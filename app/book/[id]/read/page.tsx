"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Document, Page, pdfjs } from "react-pdf"
import { Button } from "@/components/ui/button"
import {
  Highlighter,
  Eraser,
  Pencil,
  StickyNote,
  BookmarkIcon,
  Sun,
  Moon,
  Lightbulb,
  BookOpen,
  X,
  ChevronLeft,
  ChevronRight,
  Save,
  BrainCircuit,
  ZoomIn,
  ZoomOut,
  AlertCircle,
  Loader2,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { usePdfStorage } from "@/hooks/use-pdf-storage"

// Set up PDF.js worker - use local worker file
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
}

interface Note {
  id: string
  text: string
  position: { x: number; y: number }
  page: number
  timestamp: number
}

interface Bookmark {
  id: string
  page: number
  note: string
  timestamp: number
}

interface TextHighlight {
  id: string
  page: number
  text: string
  color: string
  rects: Array<{ x: number; y: number; width: number; height: number }>
  timestamp: number
}

interface Drawing {
  id: string
  page: number
  paths: Array<{ x: number; y: number }>
  color: string
  lineWidth: number
  timestamp: number
}

interface Annotation {
  highlights: TextHighlight[]
  drawings: Drawing[]
  notes: Note[]
  bookmarks: Bookmark[]
}

type ReadingMode = "light" | "dark" | "night"

export default function FullScreenReadPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { storage: pdfStorage, isReady } = usePdfStorage()
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
  const pageContainerRef = useRef<HTMLDivElement>(null)
  const pdfPageRef = useRef<HTMLDivElement>(null)
  const documentRef = useRef<any>(null)

  const [activeTool, setActiveTool] = useState<string | null>(null)
  const [activeColor, setActiveColor] = useState("#ffff00")
  const [readingMode, setReadingMode] = useState<ReadingMode>("light")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [scale, setScale] = useState(1.0)
  const [originalScale, setOriginalScale] = useState(1.0)
  const [fitToScreen, setFitToScreen] = useState(false)
  const [fitPercentage, setFitPercentage] = useState(90)
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [noteText, setNoteText] = useState("")
  const [notePosition, setNotePosition] = useState({ x: 0, y: 0 })
  const [bookData, setBookData] = useState<any>(null)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfDocument, setPdfDocument] = useState<any>(null)

  // Text selection states
  const [selectedText, setSelectedText] = useState("")

  // Annotation states
  const [annotations, setAnnotations] = useState<Annotation>({
    highlights: [],
    drawings: [],
    notes: [],
    bookmarks: [],
  })

  // Drawing states
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPath, setCurrentPath] = useState<Array<{ x: number; y: number }>>([])

  // Color palette for tools
  const getColors = () => {
    switch (readingMode) {
      case "dark":
        return [
          "#ffff00", "#00ff88", "#ff69b4", "#00bfff", 
          "#ff6b35", "#bb86fc", "#ff5555", "#ffffff"
        ]
      case "night":
        return [
          "#ffd700", "#90ee90", "#ffb6c1", "#87ceeb", 
          "#ffa500", "#dda0dd", "#ff6347", "#f5f5dc"
        ]
      default:
        return [
          "#ffff00", "#00ff00", "#ff69b4", "#00bfff", 
          "#ff4500", "#9370db", "#ff0000", "#000000"
        ]
    }
  }

  const containerRef = useRef<HTMLDivElement>(null)

  // Load and save reading mode preference
  useEffect(() => {
    const savedMode = localStorage.getItem(`readingMode_${params.id}`) as ReadingMode
    if (savedMode && ["light", "dark", "night"].includes(savedMode)) {
      setReadingMode(savedMode)
    }
  }, [params.id])

  const saveReadingMode = useCallback((mode: ReadingMode) => {
    console.log(`Switching reading mode to: ${mode}`)
    setReadingMode(mode)
    localStorage.setItem(`readingMode_${params.id}`, mode)
  }, [params.id])

  // Load book data and PDF
  useEffect(() => {
    if (!isReady || !pdfStorage) return

    const loadBookData = async () => {
      try {
        setIsLoading(true)
        const books = JSON.parse(localStorage.getItem("userBooks") || "[]")
        const book = books.find((b: any) => b.id.toString() === params.id)

        if (book) {
          setBookData(book)
          console.log("Book data loaded:", book)

          const savedAnnotations = localStorage.getItem(`annotations_${params.id}`)
          if (savedAnnotations) {
            setAnnotations(JSON.parse(savedAnnotations))
          }

          if (book.currentPage && book.currentPage > 0) {
            setCurrentPage(book.currentPage)
          }

          try {
            const file = await pdfStorage.getPDF(book.id.toString())
            if (file) {
              console.log("PDF file loaded from storage:", file.name)
              setPdfFile(file)
              const url = URL.createObjectURL(file)
              setPdfUrl(url)
              setPdfError(null)
            } else {
              setPdfError("PDF file not found. Please upload the PDF file again.")
            }
          } catch (error) {
            console.error("Error loading PDF from storage:", error)
            setPdfError("Error loading PDF file from storage.")
          }
        } else {
          setPdfError("Book not found")
        }
      } catch (error) {
        console.error("Error loading book data:", error)
        setPdfError("Error loading book data")
      } finally {
        setIsLoading(false)
      }
    }

    loadBookData()

    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl)
      }
    }
  }, [params.id, isReady, pdfStorage])

  // Save annotations to localStorage
  const saveAnnotations = useCallback(
    (newAnnotations: Annotation) => {
      localStorage.setItem(`annotations_${params.id}`, JSON.stringify(newAnnotations))
      setAnnotations(newAnnotations)
    },
    [params.id],
  )

  // Handle PDF document load success
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setTotalPages(numPages)
    console.log(`PDF loaded successfully with ${numPages} pages`)

    if (bookData && numPages !== bookData.totalPages) {
      const books = JSON.parse(localStorage.getItem("userBooks") || "[]")
      const updatedBooks = books.map((b: any) => {
        if (b.id.toString() === params.id) {
          return { ...b, totalPages: numPages }
        }
        return b
      })
      localStorage.setItem("userBooks", JSON.stringify(updatedBooks))
    }
  }

  // Handle PDF document load error
  const onDocumentLoadError = (error: Error) => {
    console.error("Error loading PDF document:", error)
    setPdfError(`Error loading PDF document: ${error.message}. Please try uploading the PDF again.`)
  }

  // Handle page render success - STABLE VERSION
  const onPageRenderSuccess = useCallback(() => {
    console.log(`Page ${currentPage} rendered successfully`)
    
    // Apply reading mode styles with proper timing
    setTimeout(() => {
      applyReadingModeToPdf()
    }, 100)
    
    // Setup text layer for highlighting
    setTimeout(() => {
      setupTextLayer()
    }, 150)
    
    // Render annotations
    setTimeout(() => {
      renderAnnotations()
    }, 200)
  }, [currentPage])

  // Apply reading mode styles - IMPROVED STABILITY
  const applyReadingModeToPdf = useCallback(() => {
    if (!pdfPageRef.current) return

    const canvas = pdfPageRef.current.querySelector("canvas")
    const textLayer = pdfPageRef.current.querySelector(".react-pdf__Page__textContent")

    if (canvas) {
      // Apply reading mode filters without forcing re-render
      switch (readingMode) {
        case "dark":
          canvas.style.filter = "invert(1) hue-rotate(180deg)"
          canvas.style.backgroundColor = "#1f2937"
          break
        case "night":
          canvas.style.filter = "sepia(1) saturate(0.8) hue-rotate(15deg) brightness(0.9) contrast(1.1)"
          canvas.style.backgroundColor = "#451a03"
          break
        default:
          canvas.style.filter = "none"
          canvas.style.backgroundColor = "#ffffff"
      }
    }

    if (textLayer) {
      const textLayerElement = textLayer as HTMLElement
      
      switch (readingMode) {
        case "dark":
          textLayerElement.style.filter = "invert(1)"
          break
        case "night":
          textLayerElement.style.filter = "sepia(1) saturate(0.8) hue-rotate(15deg) brightness(0.9)"
          break
        default:
          textLayerElement.style.filter = "none"
      }
    }
  }, [readingMode])

  // Setup text layer for highlighting - STABLE VERSION
  const setupTextLayer = useCallback(() => {
    if (!pdfPageRef.current) return

    const textLayer = pdfPageRef.current.querySelector('.react-pdf__Page__textContent')
    if (textLayer) {
      const textLayerElement = textLayer as HTMLElement
      
      // Make text layer invisible but functional for text selection
      textLayerElement.style.opacity = '0'
      textLayerElement.style.position = 'absolute'
      textLayerElement.style.top = '0'
      textLayerElement.style.left = '0'
      textLayerElement.style.width = '100%'
      textLayerElement.style.height = '100%'
      textLayerElement.style.pointerEvents = activeTool === 'highlighter' ? 'auto' : 'none'
      textLayerElement.style.userSelect = activeTool === 'highlighter' ? 'text' : 'none'
      textLayerElement.style.zIndex = '10'
      
      // Hide all text spans but keep them functional
      const textSpans = textLayer.querySelectorAll('span')
      textSpans.forEach((span) => {
        const spanElement = span as HTMLElement
        spanElement.style.color = 'transparent'
        spanElement.style.background = 'transparent'
      })
    }
  }, [activeTool])

  // Calculate scale to fit PDF to screen width
  const calculateFitToScreenScale = useCallback(() => {
    if (!containerRef.current || !pdfPageRef.current) return scale

    const sidebarWidth = activeTool === "highlighter" || activeTool === "pen" ? 28 : 16
    const availableWidth = window.innerWidth - sidebarWidth - 80

    const pageElement = pdfPageRef.current.querySelector(".react-pdf__Page")
    if (!pageElement) return scale

    const pageWidth = (pageElement as HTMLElement).scrollWidth / scale
    const targetWidth = (availableWidth * fitPercentage) / 100
    const newScale = targetWidth / pageWidth

    return Math.max(0.5, Math.min(2.5, newScale))
  }, [scale, fitPercentage, activeTool])

  useEffect(() => {
    if (fitToScreen && containerRef.current) {
      const handleResize = () => {
        const newScale = calculateFitToScreenScale()
        setScale(newScale)
      }

      const timeoutId = setTimeout(handleResize, 300)
      window.addEventListener("resize", handleResize)
      return () => {
        clearTimeout(timeoutId)
        window.removeEventListener("resize", handleResize)
      }
    }
  }, [fitToScreen, calculateFitToScreenScale, currentPage])

  // Handle text selection
  const handleTextSelection = useCallback(() => {
    if (activeTool !== "highlighter") return

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) {
      setSelectedText("")
      return
    }

    const range = selection.getRangeAt(0)
    const selectedText = range.toString().trim()

    if (selectedText && selectedText.length > 0) {
      console.log("Text selected:", selectedText)
      setSelectedText(selectedText)

      const rects = Array.from(range.getClientRects()).map((rect) => {
        const pageElement = pdfPageRef.current?.querySelector('.react-pdf__Page')
        if (!pageElement) return { x: 0, y: 0, width: 0, height: 0 }
        
        const pageRect = pageElement.getBoundingClientRect()
        return {
          x: rect.left - pageRect.left,
          y: rect.top - pageRect.top,
          width: rect.width,
          height: rect.height,
        }
      })

      if (rects.length > 0) {
        const newHighlight: TextHighlight = {
          id: Date.now().toString(),
          page: currentPage,
          text: selectedText,
          color: activeColor,
          rects: rects,
          timestamp: Date.now(),
        }

        const newAnnotations = {
          ...annotations,
          highlights: [...annotations.highlights, newHighlight],
        }
        saveAnnotations(newAnnotations)

        setTimeout(() => {
          window.getSelection()?.removeAllRanges()
          setSelectedText("")
        }, 200)
      }
    }
  }, [activeTool, currentPage, activeColor, annotations, saveAnnotations])

  // Handle selection events
  useEffect(() => {
    const handleSelectionChange = () => {
      if (activeTool === "highlighter") {
        const timeoutId = setTimeout(handleTextSelection, 100)
        return () => clearTimeout(timeoutId)
      }
    }

    const handleMouseUp = () => {
      if (activeTool === "highlighter") {
        setTimeout(handleTextSelection, 50)
      }
    }

    document.addEventListener("selectionchange", handleSelectionChange)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [activeTool, handleTextSelection])

  // Apply reading mode styles when mode changes - STABLE VERSION
  useEffect(() => {
    // Only apply styles if PDF is already rendered
    if (pdfPageRef.current && pdfPageRef.current.querySelector("canvas")) {
      console.log(`Applying ${readingMode} mode styles`)
      
      // Use requestAnimationFrame for smooth transitions
      requestAnimationFrame(() => {
        applyReadingModeToPdf()
      })
    }
  }, [readingMode, applyReadingModeToPdf])

  // Update text layer when tool changes
  useEffect(() => {
    if (pdfPageRef.current && pdfPageRef.current.querySelector(".react-pdf__Page__textContent")) {
      requestAnimationFrame(() => {
        setupTextLayer()
      })
    }
  }, [activeTool, setupTextLayer])

  // Render annotations on overlay canvas
  const renderAnnotations = useCallback(() => {
    if (!overlayCanvasRef.current || !pdfPageRef.current) return

    const canvas = overlayCanvasRef.current
    const context = canvas.getContext("2d")
    if (!context) return

    const pageElement = pdfPageRef.current.querySelector(".react-pdf__Page")
    if (!pageElement) return

    const pageRect = pageElement.getBoundingClientRect()

    canvas.width = pageRect.width
    canvas.height = pageRect.height
    canvas.style.width = pageRect.width + "px"
    canvas.style.height = pageRect.height + "px"

    context.clearRect(0, 0, canvas.width, canvas.height)

    // Render text highlights
    annotations.highlights
      .filter((highlight) => highlight.page === currentPage)
      .forEach((highlight) => {
        context.fillStyle = highlight.color + "80"
        highlight.rects.forEach((rect) => {
          context.fillRect(rect.x, rect.y, rect.width, rect.height)
        })
      })

    // Render drawings
    annotations.drawings
      .filter((drawing) => drawing.page === currentPage)
      .forEach((drawing) => {
        if (drawing.paths.length > 1) {
          context.strokeStyle = drawing.color
          context.lineWidth = drawing.lineWidth
          context.lineCap = "round"
          context.lineJoin = "round"
          context.beginPath()
          context.moveTo(drawing.paths[0].x, drawing.paths[0].y)
          for (let i = 1; i < drawing.paths.length; i++) {
            context.lineTo(drawing.paths[i].x, drawing.paths[i].y)
          }
          context.stroke()
        }
      })
  }, [annotations, currentPage])

  // Handle mouse events for drawing
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!overlayCanvasRef.current || activeTool === "highlighter") return

    const rect = overlayCanvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (activeTool === "pen") {
      setIsDrawing(true)
      setCurrentPath([{ x, y }])
    } else if (activeTool === "note") {
      setNotePosition({ x, y })
      setIsAddingNote(true)
    } else if (activeTool === "eraser") {
      const newAnnotations = { ...annotations }

      newAnnotations.highlights = newAnnotations.highlights.filter((highlight) => {
        if (highlight.page !== currentPage) return true
        return !highlight.rects.some(
          (rect) => x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height,
        )
      })

      newAnnotations.drawings = newAnnotations.drawings.filter((drawing) => {
        if (drawing.page !== currentPage) return true
        return !drawing.paths.some((point) => {
          const distance = Math.sqrt((point.x - x) ** 2 + (point.y - y) ** 2)
          return distance < 20
        })
      })

      newAnnotations.notes = newAnnotations.notes.filter((note) => {
        if (note.page !== currentPage) return true
        const distance = Math.sqrt((note.position.x - x) ** 2 + (note.position.y - y) ** 2)
        return distance > 30
      })

      saveAnnotations(newAnnotations)
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!overlayCanvasRef.current || !isDrawing || activeTool !== "pen") return

    const rect = overlayCanvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setCurrentPath((prev) => [...prev, { x, y }])

    const context = overlayCanvasRef.current.getContext("2d")
    if (context && currentPath.length > 0) {
      context.strokeStyle = activeColor
      context.lineWidth = 2
      context.lineCap = "round"
      context.lineJoin = "round"

      const lastPoint = currentPath[currentPath.length - 1]
      context.beginPath()
      context.moveTo(lastPoint.x, lastPoint.y)
      context.lineTo(x, y)
      context.stroke()
    }
  }

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!overlayCanvasRef.current || !isDrawing || activeTool !== "pen") return

    const rect = overlayCanvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (currentPath.length > 1) {
      const newDrawing: Drawing = {
        id: Date.now().toString(),
        page: currentPage,
        paths: [...currentPath, { x, y }],
        color: activeColor,
        lineWidth: 2,
        timestamp: Date.now(),
      }

      const newAnnotations = {
        ...annotations,
        drawings: [...annotations.drawings, newDrawing],
      }
      saveAnnotations(newAnnotations)
    }

    setIsDrawing(false)
    setCurrentPath([])
  }

  // Re-render annotations when they change
  useEffect(() => {
    if (pdfPageRef.current && pdfPageRef.current.querySelector(".react-pdf__Page")) {
      requestAnimationFrame(() => {
        renderAnnotations()
      })
    }
  }, [annotations, currentPage, renderAnnotations, scale])

  // Handle note save
  const handleNoteSave = () => {
    if (noteText.trim()) {
      const newNote: Note = {
        id: Date.now().toString(),
        text: noteText,
        position: notePosition,
        page: currentPage,
        timestamp: Date.now(),
      }

      const newAnnotations = {
        ...annotations,
        notes: [...annotations.notes, newNote],
      }
      saveAnnotations(newAnnotations)
    }
    setIsAddingNote(false)
    setNoteText("")
    setActiveTool(null)
  }

  // Handle bookmark
  const handleBookmarkClick = () => {
    const newBookmark: Bookmark = {
      id: Date.now().toString(),
      page: currentPage,
      note: `Bookmark on page ${currentPage}`,
      timestamp: Date.now(),
    }

    const newAnnotations = {
      ...annotations,
      bookmarks: [...annotations.bookmarks, newBookmark],
    }
    saveAnnotations(newAnnotations)
    alert(`Bookmark added on page ${currentPage}`)
  }

  // Create flashcard from selected text
  const handleCreateFlashcard = () => {
    if (selectedText) {
      const question = `What does this text mean: "${selectedText.substring(0, 50)}${selectedText.length > 50 ? "..." : ""}"`
      const answer = selectedText

      alert(`Flashcard created!\nQ: ${question}\nA: ${answer}`)
      window.getSelection()?.removeAllRanges()
      setSelectedText("")
    } else {
      const recentHighlight = annotations.highlights
        .filter((h) => h.page === currentPage)
        .sort((a, b) => b.timestamp - a.timestamp)[0]

      if (recentHighlight) {
        const question = `What does this highlighted text mean: "${recentHighlight.text.substring(0, 50)}${recentHighlight.text.length > 50 ? "..." : ""}"`
        const answer = recentHighlight.text

        alert(`Flashcard created from highlight!\nQ: ${question}\nA: ${answer}`)
      } else {
        alert("Please select some text or create a highlight first to make a flashcard")
      }
    }
  }

  // Update book progress
  const updateBookProgress = useCallback(
    (pageNum: number) => {
      if (bookData) {
        const books = JSON.parse(localStorage.getItem("userBooks") || "[]")
        const updatedBooks = books.map((b: any) => {
          if (b.id.toString() === params.id) {
            return { ...b, currentPage: pageNum, lastRead: new Date().toISOString() }
          }
          return b
        })
        localStorage.setItem("userBooks", JSON.stringify(updatedBooks))
      }
    },
    [bookData, params.id],
  )

  // Handle page navigation
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage)
      updateBookProgress(newPage)
      window.getSelection()?.removeAllRanges()
      setSelectedText("")
    }
  }

  const handleZoomChange = (newScale: number) => {
    const clampedScale = Math.max(0.5, Math.min(2.5, Math.round(newScale * 10) / 10))
    if (clampedScale !== scale) {
      setScale(clampedScale)
      if (fitToScreen) {
        setFitToScreen(false)
      }
    }
  }

  const toggleFitToScreen = () => {
    if (fitToScreen) {
      setFitToScreen(false)
      setScale(originalScale)
    } else {
      setOriginalScale(scale)
      setFitToScreen(true)
      setTimeout(() => {
        const newScale = calculateFitToScreenScale()
        setScale(newScale)
      }, 100)
    }
  }

  const handleToolClick = (tool: string) => {
    if (activeTool === tool) {
      setActiveTool(null)
    } else {
      setActiveTool(tool)
      setIsAddingNote(false)
      if (tool !== "highlighter") {
        window.getSelection()?.removeAllRanges()
        setSelectedText("")
      }
    }
  }

  // Get container styles based on reading mode
  const getContainerStyles = () => {
    switch (readingMode) {
      case "dark":
        return "bg-gray-900 text-white"
      case "night":
        return "bg-amber-950 text-amber-50"
      default:
        return "bg-gray-50 text-gray-900"
    }
  }

  // Get card styles based on reading mode
  const getCardStyles = () => {
    switch (readingMode) {
      case "dark":
        return "bg-gray-800 border-gray-700 text-white"
      case "night":
        return "bg-amber-900 border-amber-800 text-amber-50"
      default:
        return "bg-white border-gray-200 text-gray-900"
    }
  }

  // Get button styles based on reading mode
  const getButtonStyles = (isActive = false) => {
    if (isActive) {
      switch (readingMode) {
        case "dark":
          return "bg-blue-600 text-white shadow-md"
        case "night":
          return "bg-amber-600 text-white shadow-md"
        default:
          return "bg-indigo-600 text-white shadow-md"
      }
    }
    
    switch (readingMode) {
      case "dark":
        return "hover:bg-gray-700 text-gray-300"
      case "night":
        return "hover:bg-amber-800 text-amber-200"
      default:
        return "hover:bg-gray-100 text-gray-600"
    }
  }

  // Handle reading mode change - STABLE VERSION
  const handleReadingModeChange = (mode: ReadingMode) => {
    console.log(`Switching to ${mode} mode`)
    saveReadingMode(mode)
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      switch (e.key) {
        case "ArrowLeft":
        case "PageUp":
          e.preventDefault()
          handlePageChange(currentPage - 1)
          break
        case "ArrowRight":
        case "PageDown":
        case " ":
          e.preventDefault()
          handlePageChange(currentPage + 1)
          break
        case "h":
          e.preventDefault()
          handleToolClick("highlighter")
          break
        case "p":
          e.preventDefault()
          handleToolClick("pen")
          break
        case "n":
          e.preventDefault()
          handleToolClick("note")
          break
        case "e":
          e.preventDefault()
          handleToolClick("eraser")
          break
        case "1":
          e.preventDefault()
          handleReadingModeChange("light")
          break
        case "2":
          e.preventDefault()
          handleReadingModeChange("dark")
          break
        case "3":
          e.preventDefault()
          handleReadingModeChange("night")
          break
        case "Escape":
          e.preventDefault()
          setActiveTool(null)
          window.getSelection()?.removeAllRanges()
          break
        case "f":
          e.preventDefault()
          toggleFitToScreen()
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [currentPage, totalPages, activeTool])

  // Show loading state
  if (!isReady || isLoading) {
    return (
      <div className={`min-h-screen ${getContainerStyles()} flex items-center justify-center`}>
        <div className={`text-center ${getCardStyles()} rounded-2xl shadow-lg p-12`}>
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
          <h3 className="text-xl font-semibold mb-2">
            {!isReady ? "Initializing PDF storage..." : "Loading your book..."}
          </h3>
          <p className="opacity-75">Please wait while we prepare your reading experience</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`h-screen ${getContainerStyles()} flex flex-col overflow-hidden transition-colors duration-300`}>
      {/* Clean Top Bar */}
      <div className={`${getCardStyles()} border-b px-6 py-3 flex items-center justify-between flex-shrink-0 transition-colors duration-300`}>
        <div className="flex items-center space-x-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.back()}
            className={`${getButtonStyles()} rounded-lg transition-colors duration-300`}
          >
            <X className="w-5 h-5 mr-2" />
            Exit Reader
          </Button>

          {bookData?.title && (
            <div className="hidden md:flex items-center space-x-3">
              <div className={`w-2 h-2 rounded-full ${
                readingMode === "dark" ? "bg-blue-500" : 
                readingMode === "night" ? "bg-amber-500" : "bg-indigo-600"
              }`}></div>
              <span className="text-sm font-medium opacity-75">{bookData.title}</span>
            </div>
          )}

          {/* Status Indicators */}
          <div className="flex items-center space-x-3">
            {activeTool && (
              <div className={`flex items-center space-x-2 px-4 py-2 rounded-full text-white ${
                readingMode === "dark" ? "bg-blue-600" : 
                readingMode === "night" ? "bg-amber-600" : "bg-indigo-600"
              }`}>
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span className="text-sm font-medium capitalize">{activeTool} mode</span>
              </div>
            )}

            {selectedText && (
              <div className="flex items-center space-x-2 bg-amber-500 text-white px-4 py-2 rounded-full">
                <span className="text-sm font-medium">
                  "{selectedText.substring(0, 25)}{selectedText.length > 25 ? "..." : ""}" selected
                </span>
              </div>
            )}

            {/* Reading mode indicator */}
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${
              readingMode === "dark" ? "bg-gray-700 text-gray-300" : 
              readingMode === "night" ? "bg-amber-800 text-amber-200" : "bg-gray-100 text-gray-700"
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                readingMode === "dark" ? "bg-blue-400" : 
                readingMode === "night" ? "bg-amber-400" : "bg-yellow-400"
              }`}></div>
              <span className="text-sm font-medium capitalize">{readingMode} mode</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          {/* Page Navigation */}
          <div className={`flex items-center space-x-3 ${getCardStyles()} rounded-lg px-4 py-2 border transition-colors duration-300`}>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 rounded-lg ${getButtonStyles()}`}
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <div className="flex items-center space-x-2">
              <Input
                type="number"
                value={currentPage}
                onChange={(e) => handlePageChange(Number.parseInt(e.target.value) || 1)}
                className={`w-16 h-8 text-center text-sm rounded-lg border-0 ${
                  readingMode === "dark" ? "bg-gray-700 text-white" : 
                  readingMode === "night" ? "bg-amber-800 text-amber-100" : "bg-gray-50"
                }`}
                min={1}
                max={totalPages}
              />
              <span className="text-sm font-medium opacity-75">of {totalPages}</span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 rounded-lg ${getButtonStyles()}`}
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Zoom Controls */}
          <div className={`flex items-center space-x-3 ${getCardStyles()} rounded-lg px-4 py-2 border transition-colors duration-300`}>
            <Button 
              variant="ghost" 
              size="icon" 
              className={`h-8 w-8 rounded-lg ${getButtonStyles()}`}
              onClick={() => handleZoomChange(scale - 0.1)}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>

            <span className="text-sm font-medium min-w-[3rem] text-center opacity-75">
              {Math.round(scale * 100)}%
            </span>

            <Button 
              variant="ghost" 
              size="icon" 
              className={`h-8 w-8 rounded-lg ${getButtonStyles()}`}
              onClick={() => handleZoomChange(scale + 0.1)}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>

            <Button
              variant={fitToScreen ? "default" : "ghost"}
              size="sm"
              onClick={toggleFitToScreen}
              className={`text-xs rounded-lg ${fitToScreen ? getButtonStyles(true) : getButtonStyles()}`}
            >
              {fitToScreen ? "Exit Fit" : "Fit Width"}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Clean Floating Sidebar */}
        <div className="absolute left-6 top-1/2 transform -translate-y-1/2 z-50">
          <div className={`${getCardStyles()} rounded-2xl shadow-lg border p-3 flex flex-col space-y-3 transition-colors duration-300`}>
            {/* Tool Buttons */}
            <Button
              variant={activeTool === "highlighter" ? "default" : "ghost"}
              size="icon"
              className={`w-12 h-12 rounded-xl transition-all duration-200 ${
                activeTool === "highlighter" ? getButtonStyles(true) : getButtonStyles()
              }`}
              onClick={() => handleToolClick("highlighter")}
              title="Text Highlighter (H)"
            >
              <Highlighter className="h-5 w-5" />
            </Button>

            <Button
              variant={activeTool === "pen" ? "default" : "ghost"}
              size="icon"
              className={`w-12 h-12 rounded-xl transition-all duration-200 ${
                activeTool === "pen" ? getButtonStyles(true) : getButtonStyles()
              }`}
              onClick={() => handleToolClick("pen")}
              title="Drawing Pen (P)"
            >
              <Pencil className="h-5 w-5" />
            </Button>

            <Button
              variant={activeTool === "eraser" ? "default" : "ghost"}
              size="icon"
              className={`w-12 h-12 rounded-xl transition-all duration-200 ${
                activeTool === "eraser" ? getButtonStyles(true) : getButtonStyles()
              }`}
              onClick={() => handleToolClick("eraser")}
              title="Eraser (E)"
            >
              <Eraser className="h-5 w-5" />
            </Button>

            <Button
              variant={activeTool === "note" ? "default" : "ghost"}
              size="icon"
              className={`w-12 h-12 rounded-xl transition-all duration-200 ${
                activeTool === "note" ? getButtonStyles(true) : getButtonStyles()
              }`}
              onClick={() => handleToolClick("note")}
              title="Add Note (N)"
            >
              <StickyNote className="h-5 w-5" />
            </Button>

            {/* Divider */}
            <div className={`w-8 h-px mx-auto ${
              readingMode === "dark" ? "bg-gray-600" : 
              readingMode === "night" ? "bg-amber-700" : "bg-gray-200"
            }`}></div>

            {/* Action Buttons */}
            <Button 
              variant="ghost" 
              size="icon" 
              className={`w-12 h-12 rounded-xl transition-all duration-200 ${getButtonStyles()}`}
              onClick={handleBookmarkClick} 
              title="Bookmark"
            >
              <BookmarkIcon className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className={`w-12 h-12 rounded-xl transition-all duration-200 ${getButtonStyles()}`}
              onClick={handleCreateFlashcard}
              title="Create Flashcard"
            >
              <BrainCircuit className="h-5 w-5" />
            </Button>

            {/* Divider */}
            <div className={`w-8 h-px mx-auto ${
              readingMode === "dark" ? "bg-gray-600" : 
              readingMode === "night" ? "bg-amber-700" : "bg-gray-200"
            }`}></div>

            {/* Reading Mode Buttons */}
            <Button
              variant={readingMode === "light" ? "default" : "ghost"}
              size="icon"
              className={`w-12 h-12 rounded-xl transition-all duration-200 ${
                readingMode === "light" ? "bg-yellow-500 text-white" : getButtonStyles()
              }`}
              onClick={() => handleReadingModeChange("light")}
              title="Light Mode (1)"
            >
              <Sun className="h-5 w-5" />
            </Button>

            <Button
              variant={readingMode === "dark" ? "default" : "ghost"}
              size="icon"
              className={`w-12 h-12 rounded-xl transition-all duration-200 ${
                readingMode === "dark" ? "bg-blue-600 text-white" : getButtonStyles()
              }`}
              onClick={() => handleReadingModeChange("dark")}
              title="Dark Mode (2)"
            >
              <Moon className="h-5 w-5" />
            </Button>

            <Button
              variant={readingMode === "night" ? "default" : "ghost"}
              size="icon"
              className={`w-12 h-12 rounded-xl transition-all duration-200 ${
                readingMode === "night" ? "bg-amber-600 text-white" : getButtonStyles()
              }`}
              onClick={() => handleReadingModeChange("night")}
              title="Night Light Mode (3) - Reduces Blue Light"
            >
              <Lightbulb className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Color Palette */}
        {(activeTool === "highlighter" || activeTool === "pen") && (
          <div className="absolute left-24 top-1/2 transform -translate-y-1/2 z-40">
            <div className={`${getCardStyles()} rounded-2xl shadow-lg border p-3 flex flex-col space-y-3 transition-colors duration-300`}>
              {getColors().map((color) => (
                <button
                  key={color}
                  className={`w-10 h-10 rounded-xl border-2 transition-all duration-200 ${
                    activeColor === color
                      ? `border-gray-800 scale-110 ${readingMode === "dark" ? "border-white" : ""}`
                      : `border-gray-200 hover:scale-105 hover:border-gray-400 ${
                          readingMode === "dark" ? "border-gray-600 hover:border-gray-400" : 
                          readingMode === "night" ? "border-amber-700 hover:border-amber-500" : ""
                        }`
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setActiveColor(color)}
                  title={`Select ${color}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* PDF Viewer */}
        <div
          ref={containerRef}
          className="flex-1 overflow-auto transition-colors duration-300"
          style={{ 
            height: 'calc(100vh - 80px)',
            maxHeight: 'calc(100vh - 80px)'
          }}
        >
          {pdfError ? (
            <div className="flex items-center justify-center h-full">
              <div className={`text-center p-8 max-w-md ${getCardStyles()} rounded-2xl shadow-lg border transition-colors duration-300`}>
                <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl font-semibold mb-3">PDF Not Available</h2>
                <p className="opacity-75 mb-6">{pdfError}</p>
                <Button 
                  onClick={() => router.back()}
                  className={`rounded-lg ${getButtonStyles(true)}`}
                >
                  Go Back
                </Button>
              </div>
            </div>
          ) : pdfUrl ? (
            <div className="flex justify-center py-8 px-6">
              <div className="relative" ref={pageContainerRef}>
                {activeTool === "highlighter" && (
                  <div className="absolute -top-12 left-0 right-0 text-center z-20">
                    <div className="inline-block bg-amber-500 text-white px-6 py-2 rounded-full text-sm font-medium">
                      Select text to highlight it
                    </div>
                  </div>
                )}

                <div ref={pdfPageRef} className="relative">
                  <Document
                    file={pdfUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                    loading={
                      <div className={`flex items-center justify-center p-12 ${getCardStyles()} rounded-2xl shadow-lg border transition-colors duration-300`}>
                        <div className="text-center">
                          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Loader2 className="w-8 h-8 text-white animate-spin" />
                          </div>
                          <p className="font-medium opacity-75">Loading your book...</p>
                        </div>
                      </div>
                    }
                  >
                    <Page
                      pageNumber={currentPage}
                      scale={scale}
                      onRenderSuccess={onPageRenderSuccess}
                      renderTextLayer={true}
                      renderAnnotationLayer={false}
                      className={`shadow-lg border rounded-lg overflow-hidden transition-colors duration-300 ${
                        readingMode === "dark" ? "border-gray-600" : 
                        readingMode === "night" ? "border-amber-700" : "border-gray-200"
                      }`}
                    />
                  </Document>

                  {/* Overlay Canvas */}
                  <canvas
                    ref={overlayCanvasRef}
                    className="absolute top-0 left-0 pointer-events-none rounded-lg"
                    style={{
                      pointerEvents: activeTool && activeTool !== "highlighter" ? "auto" : "none",
                      cursor: activeTool === "eraser" ? "grab" : activeTool === "pen" ? "crosshair" : "default",
                    }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                  />

                  {/* Notes */}
                  {annotations.notes
                    .filter((note) => note.page === currentPage)
                    .map((note) => (
                      <div
                        key={note.id}
                        className="absolute w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-sm font-bold text-white cursor-pointer shadow-lg hover:scale-110 transition-transform z-10 border-2 border-white"
                        style={{ left: note.position.x, top: note.position.y }}
                        title={note.text}
                      >
                        📝
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className={`text-center ${getCardStyles()} rounded-2xl shadow-lg border p-12 transition-colors duration-300`}>
                <div className="w-16 h-16 bg-gray-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl font-semibold mb-3">No PDF Loaded</h2>
                <p className="opacity-75">Please upload a PDF file to start reading</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Clean Note Input */}
      {isAddingNote && (
        <div
          className={`absolute ${getCardStyles()} border rounded-2xl shadow-lg w-80 z-50 p-6 transition-colors duration-300`}
          style={{ left: `${notePosition.x + 100}px`, top: `${notePosition.y + 80}px` }}
        >
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Add Note</h3>
            <Textarea
              className={`w-full h-32 p-4 text-sm rounded-lg resize-none transition-colors duration-300 border-0 ${
                readingMode === "dark" ? "bg-gray-700 text-white focus:bg-gray-600" : 
                readingMode === "night" ? "bg-amber-800 text-amber-100 focus:bg-amber-700" : "bg-gray-50 focus:bg-white"
              }`}
              placeholder="Write your note here..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex justify-end space-x-3">
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => setIsAddingNote(false)}
              className={`rounded-lg ${getButtonStyles()}`}
            >
              Cancel
            </Button>
            <Button 
              size="sm" 
              onClick={handleNoteSave}
              className={`rounded-lg ${getButtonStyles(true)}`}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Note
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}