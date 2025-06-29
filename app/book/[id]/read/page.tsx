"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Document, Page, pdfjs } from "react-pdf"
import { motion, AnimatePresence } from "framer-motion"
import { useHotkeys } from "react-hotkeys-hook"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Toolbar, ToolbarButton, ToolbarSeparator, ToolbarToggleGroup, ToolbarToggleItem } from "@/components/ui/toolbar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { usePdfStorage } from "@/hooks/use-pdf-storage"
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  Search,
  Bookmark,
  StickyNote,
  Highlighter,
  Edit3,
  Eraser,
  Sun,
  Moon,
  Eye,
  Settings,
  Menu,
  Maximize,
  Minimize,
  MoreHorizontal,
  FileText,
  Loader2,
  AlertCircle
} from "lucide-react"

// Set up PDF.js worker
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

type ReadingMode = "light" | "dark" | "sepia"
type ViewMode = "single" | "continuous" | "facing"
type Tool = "select" | "highlight" | "note" | "draw" | "erase"

export default function ModernPDFReader({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { storage: pdfStorage, isReady } = usePdfStorage()
  
  // Refs
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
  const pageContainerRef = useRef<HTMLDivElement>(null)
  const pdfPageRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<HTMLDivElement>(null)

  // Core state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [scale, setScale] = useState(1.2)
  const [rotation, setRotation] = useState(0)
  const [readingMode, setReadingMode] = useState<ReadingMode>("light")
  const [viewMode, setViewMode] = useState<ViewMode>("single")
  const [activeTool, setActiveTool] = useState<Tool>("select")
  
  // UI state
  const [isToolbarVisible, setIsToolbarVisible] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  
  // PDF state
  const [bookData, setBookData] = useState<any>(null)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)

  // Annotation state
  const [annotations, setAnnotations] = useState<Annotation>({
    highlights: [],
    drawings: [],
    notes: [],
    bookmarks: [],
  })
  const [selectedText, setSelectedText] = useState("")
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [noteText, setNoteText] = useState("")
  const [notePosition, setNotePosition] = useState({ x: 0, y: 0 })

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPath, setCurrentPath] = useState<Array<{ x: number; y: number }>>([])
  const [highlightColor, setHighlightColor] = useState("#ffeb3b")

  // Keyboard shortcuts
  useHotkeys('ctrl+f', (e) => {
    e.preventDefault()
    setIsSearchOpen(true)
  })
  
  useHotkeys('escape', () => {
    setIsSearchOpen(false)
    setActiveTool("select")
  })
  
  useHotkeys('ctrl+plus', (e) => {
    e.preventDefault()
    handleZoomIn()
  })
  
  useHotkeys('ctrl+minus', (e) => {
    e.preventDefault()
    handleZoomOut()
  })
  
  useHotkeys('left', () => handlePreviousPage())
  useHotkeys('right', () => handleNextPage())
  useHotkeys('h', () => setActiveTool("highlight"))
  useHotkeys('n', () => setActiveTool("note"))
  useHotkeys('d', () => setActiveTool("draw"))

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

  // PDF document handlers
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setTotalPages(numPages)
    
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

  const onDocumentLoadError = (error: Error) => {
    console.error("Error loading PDF document:", error)
    setPdfError(`Error loading PDF document: ${error.message}`)
  }

  const onPageRenderSuccess = useCallback(() => {
    setTimeout(() => {
      applyReadingMode()
      setupTextLayer()
      renderAnnotations()
    }, 100)
  }, [currentPage, readingMode])

  // Reading mode application
  const applyReadingMode = useCallback(() => {
    if (!pdfPageRef.current) return

    const canvas = pdfPageRef.current.querySelector("canvas")
    const textLayer = pdfPageRef.current.querySelector(".react-pdf__Page__textContent")

    if (canvas) {
      switch (readingMode) {
        case "dark":
          canvas.style.filter = "invert(1) hue-rotate(180deg)"
          canvas.style.backgroundColor = "#1a1a1a"
          break
        case "sepia":
          canvas.style.filter = "sepia(1) saturate(0.8) hue-rotate(15deg) brightness(0.9)"
          canvas.style.backgroundColor = "#f4f1e8"
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
        case "sepia":
          textLayerElement.style.filter = "sepia(1) saturate(0.8) hue-rotate(15deg)"
          break
        default:
          textLayerElement.style.filter = "none"
      }
    }
  }, [readingMode])

  // Text layer setup
  const setupTextLayer = useCallback(() => {
    if (!pdfPageRef.current) return

    const textLayer = pdfPageRef.current.querySelector('.react-pdf__Page__textContent')
    if (textLayer) {
      const textLayerElement = textLayer as HTMLElement
      textLayerElement.style.opacity = activeTool === 'highlight' ? '0' : '0'
      textLayerElement.style.position = 'absolute'
      textLayerElement.style.top = '0'
      textLayerElement.style.left = '0'
      textLayerElement.style.width = '100%'
      textLayerElement.style.height = '100%'
      textLayerElement.style.pointerEvents = activeTool === 'highlight' ? 'auto' : 'none'
      textLayerElement.style.userSelect = activeTool === 'highlight' ? 'text' : 'none'
      textLayerElement.style.zIndex = '10'
    }
  }, [activeTool])

  // Annotation rendering
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

    // Render highlights
    annotations.highlights
      .filter((highlight) => highlight.page === currentPage)
      .forEach((highlight) => {
        context.fillStyle = highlight.color + "40"
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

  // Navigation handlers
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
      updateBookProgress(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
      updateBookProgress(currentPage + 1)
    }
  }

  const handlePageInput = (value: string) => {
    const pageNum = parseInt(value)
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum)
      updateBookProgress(pageNum)
    }
  }

  // Zoom handlers
  const handleZoomIn = () => {
    setScale(Math.min(scale * 1.2, 3))
  }

  const handleZoomOut = () => {
    setScale(Math.max(scale / 1.2, 0.5))
  }

  const handleFitWidth = () => {
    if (viewerRef.current && pdfPageRef.current) {
      const viewerWidth = viewerRef.current.clientWidth - 40
      const pageElement = pdfPageRef.current.querySelector(".react-pdf__Page")
      if (pageElement) {
        const pageWidth = (pageElement as HTMLElement).scrollWidth / scale
        const newScale = viewerWidth / pageWidth
        setScale(Math.max(0.5, Math.min(3, newScale)))
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
    [bookData, params.id]
  )

  // Save annotations
  const saveAnnotations = useCallback(
    (newAnnotations: Annotation) => {
      localStorage.setItem(`annotations_${params.id}`, JSON.stringify(newAnnotations))
      setAnnotations(newAnnotations)
    },
    [params.id]
  )

  // Get theme classes
  const getThemeClasses = () => {
    switch (readingMode) {
      case "dark":
        return {
          bg: "bg-gray-900",
          text: "text-white",
          toolbar: "bg-gray-800 border-gray-700",
          button: "hover:bg-gray-700 text-gray-300",
          input: "bg-gray-700 border-gray-600 text-white"
        }
      case "sepia":
        return {
          bg: "bg-amber-50",
          text: "text-amber-900",
          toolbar: "bg-amber-100 border-amber-200",
          button: "hover:bg-amber-200 text-amber-800",
          input: "bg-amber-100 border-amber-300 text-amber-900"
        }
      default:
        return {
          bg: "bg-white",
          text: "text-gray-900",
          toolbar: "bg-white border-gray-200",
          button: "hover:bg-gray-100 text-gray-700",
          input: "bg-white border-gray-300 text-gray-900"
        }
    }
  }

  const theme = getThemeClasses()

  if (!isReady || isLoading) {
    return (
      <div className={`min-h-screen ${theme.bg} flex items-center justify-center`}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-blue-600" />
          <p className={`${theme.text} text-lg font-medium`}>
            {!isReady ? "Initializing PDF storage..." : "Loading your book..."}
          </p>
        </div>
      </div>
    )
  }

  if (pdfError) {
    return (
      <div className={`min-h-screen ${theme.bg} flex items-center justify-center`}>
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className={`text-xl font-semibold mb-3 ${theme.text}`}>PDF Not Available</h2>
          <p className={`mb-6 ${theme.text} opacity-75`}>{pdfError}</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className={`h-screen ${theme.bg} flex flex-col transition-colors duration-200`}>
        {/* Top Toolbar */}
        <AnimatePresence>
          {isToolbarVisible && (
            <motion.div
              initial={{ y: -100 }}
              animate={{ y: 0 }}
              exit={{ y: -100 }}
              className={`${theme.toolbar} border-b px-4 py-3 flex items-center justify-between shadow-sm`}
            >
              {/* Left Section */}
              <div className="flex items-center space-x-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.back()}
                      className={theme.button}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Close
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Close Reader (Esc)</TooltipContent>
                </Tooltip>

                <Separator orientation="vertical" className="h-6" />

                {bookData?.title && (
                  <div className="hidden md:block">
                    <h1 className={`font-medium ${theme.text} truncate max-w-xs`}>
                      {bookData.title}
                    </h1>
                  </div>
                )}
              </div>

              {/* Center Section - Navigation */}
              <div className="flex items-center space-x-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handlePreviousPage}
                      disabled={currentPage <= 1}
                      className={theme.button}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Previous Page (←)</TooltipContent>
                </Tooltip>

                <div className="flex items-center space-x-2 px-3 py-1 rounded-md bg-gray-50 dark:bg-gray-800">
                  <Input
                    type="number"
                    value={currentPage}
                    onChange={(e) => handlePageInput(e.target.value)}
                    className={`w-16 h-8 text-center text-sm border-0 ${theme.input}`}
                    min={1}
                    max={totalPages}
                  />
                  <span className={`text-sm ${theme.text} opacity-75`}>of {totalPages}</span>
                </div>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={currentPage >= totalPages}
                      className={theme.button}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Next Page (→)</TooltipContent>
                </Tooltip>
              </div>

              {/* Right Section */}
              <div className="flex items-center space-x-2">
                {/* Zoom Controls */}
                <div className="flex items-center space-x-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleZoomOut}
                        className={theme.button}
                      >
                        <ZoomOut className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Zoom Out (Ctrl+-)</TooltipContent>
                  </Tooltip>

                  <span className={`text-sm font-medium ${theme.text} min-w-[3rem] text-center`}>
                    {Math.round(scale * 100)}%
                  </span>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleZoomIn}
                        className={theme.button}
                      >
                        <ZoomIn className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Zoom In (Ctrl++)</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleFitWidth}
                        className={theme.button}
                      >
                        <Maximize className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Fit Width</TooltipContent>
                  </Tooltip>
                </div>

                <Separator orientation="vertical" className="h-6" />

                {/* Reading Mode Toggle */}
                <ToolbarToggleGroup type="single" value={readingMode} onValueChange={(value) => value && setReadingMode(value as ReadingMode)}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ToolbarToggleItem value="light" className={theme.button}>
                        <Sun className="w-4 h-4" />
                      </ToolbarToggleItem>
                    </TooltipTrigger>
                    <TooltipContent>Light Mode</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ToolbarToggleItem value="dark" className={theme.button}>
                        <Moon className="w-4 h-4" />
                      </ToolbarToggleItem>
                    </TooltipTrigger>
                    <TooltipContent>Dark Mode</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ToolbarToggleItem value="sepia" className={theme.button}>
                        <Eye className="w-4 h-4" />
                      </ToolbarToggleItem>
                    </TooltipTrigger>
                    <TooltipContent>Sepia Mode</TooltipContent>
                  </Tooltip>
                </ToolbarToggleGroup>

                <Separator orientation="vertical" className="h-6" />

                {/* Tools */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsSearchOpen(true)}
                      className={theme.button}
                    >
                      <Search className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Search (Ctrl+F)</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                      className={theme.button}
                    >
                      <Menu className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Toggle Sidebar</TooltipContent>
                </Tooltip>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.div
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                className={`w-80 ${theme.toolbar} border-r flex flex-col`}
              >
                <div className="p-4 border-b">
                  <h3 className={`font-medium ${theme.text}`}>Tools & Annotations</h3>
                </div>

                {/* Tool Selection */}
                <div className="p-4 space-y-3">
                  <ToolbarToggleGroup type="single" value={activeTool} onValueChange={(value) => value && setActiveTool(value as Tool)}>
                    <div className="grid grid-cols-2 gap-2 w-full">
                      <ToolbarToggleItem value="select" className={`${theme.button} justify-start`}>
                        <Edit3 className="w-4 h-4 mr-2" />
                        Select
                      </ToolbarToggleItem>
                      <ToolbarToggleItem value="highlight" className={`${theme.button} justify-start`}>
                        <Highlighter className="w-4 h-4 mr-2" />
                        Highlight
                      </ToolbarToggleItem>
                      <ToolbarToggleItem value="note" className={`${theme.button} justify-start`}>
                        <StickyNote className="w-4 h-4 mr-2" />
                        Note
                      </ToolbarToggleItem>
                      <ToolbarToggleItem value="draw" className={`${theme.button} justify-start`}>
                        <Edit3 className="w-4 h-4 mr-2" />
                        Draw
                      </ToolbarToggleItem>
                    </div>
                  </ToolbarToggleGroup>
                </div>

                {/* Annotations List */}
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-4">
                    {/* Notes */}
                    {annotations.notes.filter(note => note.page === currentPage).length > 0 && (
                      <div>
                        <h4 className={`text-sm font-medium ${theme.text} mb-2`}>Notes on this page</h4>
                        <div className="space-y-2">
                          {annotations.notes
                            .filter(note => note.page === currentPage)
                            .map(note => (
                              <div key={note.id} className={`p-2 rounded text-sm ${theme.input}`}>
                                {note.text}
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Highlights */}
                    {annotations.highlights.filter(highlight => highlight.page === currentPage).length > 0 && (
                      <div>
                        <h4 className={`text-sm font-medium ${theme.text} mb-2`}>Highlights on this page</h4>
                        <div className="space-y-2">
                          {annotations.highlights
                            .filter(highlight => highlight.page === currentPage)
                            .map(highlight => (
                              <div key={highlight.id} className={`p-2 rounded text-sm ${theme.input}`}>
                                "{highlight.text.substring(0, 100)}..."
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* PDF Viewer */}
          <div
            ref={viewerRef}
            className="flex-1 overflow-auto"
            style={{ height: 'calc(100vh - 64px)' }}
          >
            {pdfUrl ? (
              <div className="flex justify-center py-8 px-6">
                <div className="relative" ref={pageContainerRef}>
                  <div ref={pdfPageRef} className="relative">
                    <Document
                      file={pdfUrl}
                      onLoadSuccess={onDocumentLoadSuccess}
                      onLoadError={onDocumentLoadError}
                      loading={
                        <div className="flex items-center justify-center p-12">
                          <div className="text-center">
                            <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-blue-600" />
                            <p className={`${theme.text} opacity-75`}>Loading PDF...</p>
                          </div>
                        </div>
                      }
                    >
                      <Page
                        pageNumber={currentPage}
                        scale={scale}
                        rotate={rotation}
                        onRenderSuccess={onPageRenderSuccess}
                        renderTextLayer={true}
                        renderAnnotationLayer={false}
                        className="shadow-lg rounded-lg overflow-hidden"
                      />
                    </Document>

                    {/* Overlay Canvas for Annotations */}
                    <canvas
                      ref={overlayCanvasRef}
                      className="absolute top-0 left-0 pointer-events-none rounded-lg"
                      style={{
                        pointerEvents: activeTool !== "select" ? "auto" : "none",
                        cursor: activeTool === "draw" ? "crosshair" : "default",
                      }}
                    />

                    {/* Notes Display */}
                    {annotations.notes
                      .filter((note) => note.page === currentPage)
                      .map((note) => (
                        <div
                          key={note.id}
                          className="absolute w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold text-white cursor-pointer shadow-lg hover:scale-110 transition-transform z-10"
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
                <div className="text-center">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h2 className={`text-xl font-semibold mb-3 ${theme.text}`}>No PDF Loaded</h2>
                  <p className={`${theme.text} opacity-75`}>Please upload a PDF file to start reading</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Search Overlay */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-16 right-4 z-50"
            >
              <div className={`${theme.toolbar} border rounded-lg shadow-lg p-4 w-80`}>
                <div className="flex items-center space-x-2 mb-3">
                  <Search className="w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search in document..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`flex-1 ${theme.input}`}
                    autoFocus
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsSearchOpen(false)}
                    className={theme.button}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className={`text-sm ${theme.text} opacity-75`}>
                  Search functionality coming soon
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Note Input Modal */}
        <AnimatePresence>
          {isAddingNote && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className={`${theme.toolbar} rounded-lg shadow-xl p-6 w-96`}
              >
                <h3 className={`text-lg font-semibold mb-4 ${theme.text}`}>Add Note</h3>
                <Textarea
                  placeholder="Write your note here..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className={`w-full h-32 mb-4 ${theme.input}`}
                  autoFocus
                />
                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsAddingNote(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={() => {
                    // Save note logic here
                    setIsAddingNote(false)
                    setNoteText("")
                  }}>
                    Save Note
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toolbar Toggle Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsToolbarVisible(!isToolbarVisible)}
          className="absolute top-2 left-1/2 transform -translate-x-1/2 z-40"
        >
          {isToolbarVisible ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </Button>
      </div>
    </TooltipProvider>
  )
}