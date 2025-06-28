"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
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

// Set up PDF.js worker
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
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

export default function FullScreenReadPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { storage: pdfStorage, isReady } = usePdfStorage()
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
  const pageContainerRef = useRef<HTMLDivElement>(null)
  const pdfPageRef = useRef<HTMLDivElement>(null)

  const [activeTool, setActiveTool] = useState<string | null>(null)
  const [activeColor, setActiveColor] = useState("#ffff00") // Yellow for highlights
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

  // Simplified color palette
  const colors = [
    "#ffff00", // Yellow
    "#00ff00", // Green
    "#ff69b4", // Pink
    "#00bfff", // Blue
    "#ff4500", // Orange
    "#9370db", // Purple
    "#ff0000", // Red
    "#000000", // Black
  ]

  const containerRef = useRef<HTMLDivElement>(null)

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

          // Load annotations from localStorage
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

              // Create blob URL for react-pdf
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

    // Cleanup blob URL on unmount
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

  // Handle page render success
  const onPageRenderSuccess = () => {
    console.log(`Page ${currentPage} rendered successfully`)
    // Delay to ensure page is fully rendered
    setTimeout(() => {
      hideTextLayer()
      renderAnnotations()
    }, 100)
  }

  // Hide text layer to prevent duplication but keep it for text selection
  const hideTextLayer = useCallback(() => {
    if (pdfPageRef.current) {
      const textLayer = pdfPageRef.current.querySelector('.react-pdf__Page__textContent')
      if (textLayer) {
        const textLayerElement = textLayer as HTMLElement
        // Completely hide the text layer visually but keep it functional
        textLayerElement.style.opacity = '0'
        textLayerElement.style.position = 'absolute'
        textLayerElement.style.top = '0'
        textLayerElement.style.left = '0'
        textLayerElement.style.width = '100%'
        textLayerElement.style.height = '100%'
        textLayerElement.style.pointerEvents = activeTool === 'highlighter' ? 'auto' : 'none'
        textLayerElement.style.userSelect = activeTool === 'highlighter' ? 'text' : 'none'
        textLayerElement.style.zIndex = '10'
        
        // Hide all text spans
        const textSpans = textLayer.querySelectorAll('span')
        textSpans.forEach((span) => {
          const spanElement = span as HTMLElement
          spanElement.style.color = 'transparent'
          spanElement.style.background = 'transparent'
        })
      }
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

  // Update text layer visibility when tool changes
  useEffect(() => {
    hideTextLayer()
  }, [activeTool, hideTextLayer, currentPage])

  // Render annotations on overlay canvas
  const renderAnnotations = useCallback(() => {
    if (!overlayCanvasRef.current || !pdfPageRef.current) return

    const canvas = overlayCanvasRef.current
    const context = canvas.getContext("2d")
    if (!context) return

    const pageElement = pdfPageRef.current.querySelector(".react-pdf__Page")
    if (!pageElement) return

    const pageRect = pageElement.getBoundingClientRect()

    // Set canvas size to match the PDF page exactly
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

  useEffect(() => {
    renderAnnotations()
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-lg p-12 border border-gray-200">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            {!isReady ? "Initializing PDF storage..." : "Loading your book..."}
          </h3>
          <p className="text-gray-600">Please wait while we prepare your reading experience</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Clean Top Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5 mr-2" />
            Exit Reader
          </Button>

          {bookData?.title && (
            <div className="hidden md:flex items-center space-x-3">
              <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">{bookData.title}</span>
            </div>
          )}

          {/* Status Indicators */}
          <div className="flex items-center space-x-3">
            {activeTool && (
              <div className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-full">
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
          </div>
        </div>

        <div className="flex items-center space-x-6">
          {/* Page Navigation */}
          <div className="flex items-center space-x-3 bg-white rounded-lg px-4 py-2 border border-gray-200">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg hover:bg-gray-100"
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
                className="w-16 h-8 text-center text-sm border-gray-200 rounded-lg"
                min={1}
                max={totalPages}
              />
              <span className="text-sm text-gray-500 font-medium">of {totalPages}</span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg hover:bg-gray-100"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center space-x-3 bg-white rounded-lg px-4 py-2 border border-gray-200">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-lg hover:bg-gray-100" 
              onClick={() => handleZoomChange(scale - 0.1)}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>

            <span className="text-sm font-medium text-gray-700 min-w-[3rem] text-center">
              {Math.round(scale * 100)}%
            </span>

            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-lg hover:bg-gray-100" 
              onClick={() => handleZoomChange(scale + 0.1)}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>

            <Button
              variant={fitToScreen ? "default" : "ghost"}
              size="sm"
              onClick={toggleFitToScreen}
              className="text-xs rounded-lg"
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
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-3 flex flex-col space-y-3">
            {/* Tool Buttons */}
            <Button
              variant={activeTool === "highlighter" ? "default" : "ghost"}
              size="icon"
              className={`w-12 h-12 rounded-xl transition-all duration-200 ${
                activeTool === "highlighter" 
                  ? "bg-indigo-600 text-white shadow-md" 
                  : "hover:bg-gray-100"
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
                activeTool === "pen" 
                  ? "bg-indigo-600 text-white shadow-md" 
                  : "hover:bg-gray-100"
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
                activeTool === "eraser" 
                  ? "bg-indigo-600 text-white shadow-md" 
                  : "hover:bg-gray-100"
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
                activeTool === "note" 
                  ? "bg-indigo-600 text-white shadow-md" 
                  : "hover:bg-gray-100"
              }`}
              onClick={() => handleToolClick("note")}
              title="Add Note (N)"
            >
              <StickyNote className="h-5 w-5" />
            </Button>

            {/* Divider */}
            <div className="w-8 h-px bg-gray-200 mx-auto"></div>

            {/* Action Buttons */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="w-12 h-12 rounded-xl hover:bg-gray-100 transition-all duration-200" 
              onClick={handleBookmarkClick} 
              title="Bookmark"
            >
              <BookmarkIcon className="h-5 w-5 text-gray-600" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="w-12 h-12 rounded-xl hover:bg-gray-100 transition-all duration-200"
              onClick={handleCreateFlashcard}
              title="Create Flashcard"
            >
              <BrainCircuit className="h-5 w-5 text-gray-600" />
            </Button>

            {/* Divider */}
            <div className="w-8 h-px bg-gray-200 mx-auto"></div>

            {/* Light Mode Indicator */}
            <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center">
              <Sun className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>

        {/* Color Palette */}
        {(activeTool === "highlighter" || activeTool === "pen") && (
          <div className="absolute left-24 top-1/2 transform -translate-y-1/2 z-40">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-3 flex flex-col space-y-3">
              {colors.map((color) => (
                <button
                  key={color}
                  className={`w-10 h-10 rounded-xl border-2 transition-all duration-200 ${
                    activeColor === color
                      ? "border-gray-800 scale-110"
                      : "border-gray-200 hover:scale-105 hover:border-gray-400"
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
          className="flex-1 overflow-auto"
          style={{ 
            height: 'calc(100vh - 80px)',
            maxHeight: 'calc(100vh - 80px)'
          }}
        >
          {pdfError ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-8 max-w-md bg-white rounded-2xl shadow-lg border border-gray-200">
                <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl font-semibold mb-3 text-gray-800">PDF Not Available</h2>
                <p className="text-gray-600 mb-6">{pdfError}</p>
                <Button 
                  onClick={() => router.back()}
                  className="bg-indigo-600 text-white rounded-lg"
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
                      <div className="flex items-center justify-center p-12 bg-white rounded-2xl shadow-lg border border-gray-200">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Loader2 className="w-8 h-8 text-white animate-spin" />
                          </div>
                          <p className="text-gray-600 font-medium">Loading your book...</p>
                        </div>
                      </div>
                    }
                  >
                    <Page
                      key={`page_${currentPage}_${scale}`}
                      pageNumber={currentPage}
                      scale={scale}
                      onRenderSuccess={onPageRenderSuccess}
                      renderTextLayer={true}
                      renderAnnotationLayer={false}
                      className="shadow-lg border border-gray-200 rounded-lg overflow-hidden bg-white"
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
              <div className="text-center bg-white rounded-2xl shadow-lg border border-gray-200 p-12">
                <div className="w-16 h-16 bg-gray-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl font-semibold mb-3 text-gray-800">No PDF Loaded</h2>
                <p className="text-gray-600">Please upload a PDF file to start reading</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Clean Note Input */}
      {isAddingNote && (
        <div
          className="absolute bg-white border border-gray-200 rounded-2xl shadow-lg w-80 z-50 p-6"
          style={{ left: `${notePosition.x + 100}px`, top: `${notePosition.y + 80}px` }}
        >
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Add Note</h3>
            <Textarea
              className="w-full h-32 p-4 text-sm bg-gray-50 border-gray-200 rounded-lg resize-none focus:bg-white transition-colors"
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
              className="rounded-lg"
            >
              Cancel
            </Button>
            <Button 
              size="sm" 
              onClick={handleNoteSave}
              className="bg-indigo-600 text-white rounded-lg"
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