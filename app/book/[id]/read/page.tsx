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
  Settings,
} from "lucide-react"
import { Slider } from "@/components/ui/slider"
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
  const [fitPercentage, setFitPercentage] = useState(95)
  const [showFitInput, setShowFitInput] = useState(false)
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

  // Color palette for tools
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
    // Small delay to ensure page is fully rendered before adding annotations
    setTimeout(() => renderAnnotations(), 150)
  }

  // Calculate scale to fit PDF to screen width
  const calculateFitToScreenScale = useCallback(() => {
    if (!containerRef.current || !pdfPageRef.current) return scale

    const sidebarWidth = activeTool === "highlighter" || activeTool === "pen" ? 28 : 16
    const availableWidth = window.innerWidth - sidebarWidth - 64 // Extra padding

    const pageElement = pdfPageRef.current.querySelector(".react-pdf__Page")
    if (!pageElement) return scale

    const pageWidth = (pageElement as HTMLElement).scrollWidth / scale
    const targetWidth = (availableWidth * fitPercentage) / 100
    const newScale = targetWidth / pageWidth

    return Math.max(0.3, Math.min(4.0, newScale))
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
        const containerRect = pageContainerRef.current?.getBoundingClientRect()
        if (!containerRect) return { x: 0, y: 0, width: 0, height: 0 }

        return {
          x: rect.left - containerRect.left,
          y: rect.top - containerRect.top,
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

  // Render annotations on overlay canvas
  const renderAnnotations = useCallback(() => {
    if (!overlayCanvasRef.current || !pageContainerRef.current) return

    const canvas = overlayCanvasRef.current
    const context = canvas.getContext("2d")
    if (!context) return

    const pageElement = pageContainerRef.current.querySelector(".react-pdf__Page")
    if (!pageElement) return

    const pageRect = pageElement.getBoundingClientRect()
    const containerRect = pageContainerRef.current.getBoundingClientRect()

    // Set canvas size to match the PDF page exactly
    canvas.width = pageRect.width
    canvas.height = pageRect.height
    canvas.style.width = pageRect.width + "px"
    canvas.style.height = pageRect.height + "px"
    
    // Position canvas to overlay the PDF page
    canvas.style.left = (pageRect.left - containerRect.left) + "px"
    canvas.style.top = (pageRect.top - containerRect.top) + "px"

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
    const clampedScale = Math.max(0.5, Math.min(3, Math.round(newScale * 10) / 10))
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

  const handleFitPercentageChange = (newPercentage: number) => {
    const clampedPercentage = Math.max(50, Math.min(100, newPercentage))
    setFitPercentage(clampedPercentage)

    if (fitToScreen) {
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
          setShowFitInput(false)
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-gray-400 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">
            {!isReady ? "Initializing PDF storage..." : "Loading PDF..."}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-white text-gray-900 flex flex-col transition-colors duration-300 overflow-hidden">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between transition-colors duration-300 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <X className="w-5 h-5 mr-2" />
            Exit Reader
          </Button>

          {bookData?.title && (
            <span className="text-sm font-medium text-gray-600 hidden md:inline">
              {bookData.title}
            </span>
          )}

          {activeTool && (
            <div className="flex items-center space-x-2 bg-indigo-100 px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
              <span className="text-sm font-medium text-indigo-700 capitalize">
                {activeTool} active
              </span>
            </div>
          )}

          {selectedText && (
            <div className="flex items-center space-x-2 bg-yellow-100 px-3 py-1 rounded-full">
              <span className="text-sm font-medium text-yellow-700">
                "{selectedText.substring(0, 30)}
                {selectedText.length > 30 ? "..." : ""}" selected
              </span>
            </div>
          )}

          <div className="flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded-full">
            <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
            <span className="text-sm font-medium text-gray-700 capitalize">light mode</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Page Navigation */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
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
                className="w-16 h-8 text-center text-sm"
                min={1}
                max={totalPages}
              />
              <span className="text-sm text-gray-500">of {totalPages}</span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Zoom Control */}
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleZoomChange(scale - 0.1)}>
              <ZoomOut className="w-4 h-4" />
            </Button>

            <Slider
              value={[scale * 100]}
              min={50}
              max={200}
              step={10}
              className="w-24"
              onValueChange={(value) => handleZoomChange(value[0] / 100)}
              disabled={fitToScreen}
            />

            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleZoomChange(scale + 0.1)}>
              <ZoomIn className="w-4 h-4" />
            </Button>

            <div className="flex items-center space-x-1">
              <Button
                variant={fitToScreen ? "secondary" : "ghost"}
                size="sm"
                onClick={toggleFitToScreen}
                className="text-xs"
                title={fitToScreen ? "Exit fit mode" : "Fit to screen width"}
              >
                {fitToScreen ? "Exit Fit" : "Fit Width"}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowFitInput(!showFitInput)}
                title="Adjust fit percentage"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>

            <span className="text-sm font-medium">{Math.round(scale * 100)}%</span>
          </div>
        </div>
      </div>

      {/* Fit Percentage Input */}
      {showFitInput && (
        <div className="bg-white border-b px-4 py-2 flex items-center justify-center space-x-4">
          <span className="text-sm text-gray-600">Fit Percentage:</span>
          <Input
            type="number"
            value={fitPercentage}
            onChange={(e) => handleFitPercentageChange(Number.parseInt(e.target.value) || 95)}
            className="w-20 h-8 text-center text-sm"
            min={50}
            max={100}
          />
          <span className="text-sm text-gray-500">%</span>
          <Button size="sm" variant="ghost" onClick={() => setShowFitInput(false)}>
            Done
          </Button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 relative overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 space-y-6 transition-colors duration-300 flex-shrink-0">
          <Button
            variant={activeTool === "highlighter" ? "secondary" : "ghost"}
            size="icon"
            className="rounded-full"
            onClick={() => handleToolClick("highlighter")}
            title="Text Highlighter (H) - Select text to highlight"
          >
            <Highlighter className="h-5 w-5" />
          </Button>

          <Button
            variant={activeTool === "pen" ? "secondary" : "ghost"}
            size="icon"
            className="rounded-full"
            onClick={() => handleToolClick("pen")}
            title="Drawing Pen (P)"
          >
            <Pencil className="h-5 w-5" />
          </Button>

          <Button
            variant={activeTool === "eraser" ? "secondary" : "ghost"}
            size="icon"
            className="rounded-full"
            onClick={() => handleToolClick("eraser")}
            title="Eraser (E)"
          >
            <Eraser className="h-5 w-5" />
          </Button>

          <Button
            variant={activeTool === "note" ? "secondary" : "ghost"}
            size="icon"
            className="rounded-full"
            onClick={() => handleToolClick("note")}
            title="Add Note (N)"
          >
            <StickyNote className="h-5 w-5" />
          </Button>

          <div className="border-t border-gray-200 w-8 my-2"></div>

          <Button variant="ghost" size="icon" className="rounded-full" onClick={handleBookmarkClick} title="Bookmark">
            <BookmarkIcon className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={handleCreateFlashcard}
            title="Create Flashcard from Selection"
          >
            <BrainCircuit className="h-5 w-5" />
          </Button>

          <div className="border-t border-gray-200 w-8 my-2"></div>

          <Button
            variant="secondary"
            size="icon"
            className="rounded-full"
            title="Light Mode (Always Active)"
            disabled
          >
            <Sun className="h-5 w-5" />
          </Button>
        </div>

        {/* Color Palette */}
        {(activeTool === "highlighter" || activeTool === "pen") && (
          <div className="w-12 bg-white border-r border-gray-200 flex flex-col items-center py-4 space-y-2 transition-colors duration-300 flex-shrink-0">
            {colors.map((color) => (
              <button
                key={color}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  activeColor === color
                    ? "border-gray-800 scale-110"
                    : "border-gray-300 hover:scale-105"
                }`}
                style={{ backgroundColor: color }}
                onClick={() => setActiveColor(color)}
                title={`Select ${color}`}
              />
            ))}
          </div>
        )}

        {/* PDF Viewer */}
        <div
          ref={containerRef}
          className="flex-1 bg-white overflow-auto transition-colors duration-300"
        >
          {pdfError ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-8 max-w-md">
                <AlertCircle className="w-16 h-16 text-orange-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2 text-orange-600">PDF Not Available</h2>
                <p className="text-gray-600 mb-6">{pdfError}</p>
              </div>
            </div>
          ) : pdfUrl ? (
            <div className="flex justify-center p-4">
              <div className="relative" ref={pageContainerRef}>
                {activeTool === "highlighter" && (
                  <div className="absolute -top-8 left-0 right-0 text-center z-20">
                    <div className="inline-block bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                      Select text to highlight it
                    </div>
                  </div>
                )}

                <div ref={pdfPageRef} className="pdf-page-container">
                  <Document
                    file={pdfUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                    loading={
                      <div className="flex items-center justify-center p-8">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
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
                      className="shadow-lg border border-gray-200 rounded-lg transition-all duration-300"
                    />
                  </Document>
                </div>

                <canvas
                  ref={overlayCanvasRef}
                  className="absolute pointer-events-none"
                  style={{
                    pointerEvents: activeTool && activeTool !== "highlighter" ? "auto" : "none",
                    cursor: activeTool === "eraser" ? "grab" : activeTool === "pen" ? "crosshair" : "default",
                  }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                />

                {annotations.notes
                  .filter((note) => note.page === currentPage)
                  .map((note) => (
                    <div
                      key={note.id}
                      className="absolute w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold text-white cursor-pointer shadow-lg hover:scale-110 transition-transform"
                      style={{ left: note.position.x, top: note.position.y }}
                      title={note.text}
                    >
                      📝
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">No PDF Loaded</h2>
                <p className="text-gray-500">Please upload a PDF file to start reading</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Note Input */}
      {isAddingNote && (
        <div
          className="absolute bg-yellow-100 border-yellow-300 p-3 rounded-md shadow-lg w-64 z-40 transition-colors duration-300"
          style={{ left: `${notePosition.x + 80}px`, top: `${notePosition.y + 60}px` }}
        >
          <Textarea
            className="w-full h-24 p-2 text-sm bg-transparent border rounded resize-none border-yellow-300"
            placeholder="Add your note here..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            autoFocus
          />
          <div className="flex justify-end mt-2 space-x-2">
            <Button size="sm" variant="ghost" onClick={() => setIsAddingNote(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleNoteSave}>
              <Save className="w-4 h-4 mr-1" />
              Save
            </Button>
          </div>
        </div>
      )}

      {/* Keyboard shortcuts help */}
      <div className="fixed bottom-4 right-4 bg-black/70 text-white text-xs p-2 rounded opacity-50 hover:opacity-100 transition-all duration-300">
        <div>← → : Navigate pages</div>
        <div>H : Text Highlighter</div>
        <div>P : Drawing Pen</div>
        <div>N : Add Note</div>
        <div>E : Eraser</div>
        <div>F : Toggle fit to width</div>
        <div>ESC : Deselect tool</div>
      </div>

      {/* Annotations count */}
      <div className="fixed bottom-4 left-4 bg-black/70 text-white text-xs p-2 rounded transition-all duration-300">
        <div>
          Page {currentPage}: {annotations.highlights.filter((h) => h.page === currentPage).length} highlights,{" "}
          {annotations.drawings.filter((d) => d.page === currentPage).length} drawings,{" "}
          {annotations.notes.filter((n) => n.page === currentPage).length} notes
        </div>
        {selectedText && (
          <div className="mt-1 text-yellow-300">
            Selected: "{selectedText.substring(0, 20)}
            {selectedText.length > 20 ? "..." : ""}"
          </div>
        )}
        {fitToScreen && <div className="mt-1 text-green-300">Fit Mode: {fitPercentage}% width</div>}
      </div>
    </div>
  )
}