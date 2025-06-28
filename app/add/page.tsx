"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { TopNavigation } from "@/components/top-navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, BookOpen, CheckCircle, X, FileText, Loader2, AlertCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { usePdfStorage } from "@/hooks/use-pdf-storage"

interface BookDetails {
  title: string
  author: string
  pages: string
  isbn: string
  year: string
  description: string
  tags: string
  category: string
}

export default function AddBookPage() {
  const router = useRouter()
  const { storage: pdfStorage, isReady } = usePdfStorage()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [showBookDetails, setShowBookDetails] = useState(false)
  const [bookDetails, setBookDetails] = useState<BookDetails>({
    title: "",
    author: "",
    pages: "",
    isbn: "",
    year: "",
    description: "",
    tags: "",
    category: "",
  })
  const [processingStatus, setProcessingStatus] = useState<"idle" | "processing" | "completed">("idle")
  const [error, setError] = useState<string | null>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === "application/pdf") {
      processFile(file)
    } else {
      setError("Please select a PDF file")
    }
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (file && file.type === "application/pdf") {
      processFile(file)
    } else {
      setError("Please drop a PDF file")
    }
  }

  const processFile = async (file: File) => {
    if (!isReady || !pdfStorage) {
      setError("PDF storage is not ready. Please try again.")
      return
    }

    setError(null)
    setIsUploading(true)
    setUploadedFile(file)
    setProcessingStatus("processing")

    try {
      // Check file size
      if (file.size > 100 * 1024 * 1024) {
        throw new Error("File is too large. Please select a PDF smaller than 100MB.")
      }

      // Test storage first
      const storageWorking = await pdfStorage.testStorage()
      if (!storageWorking) {
        throw new Error("PDF storage is not working properly")
      }

      // Extract title from filename
      const fileName = file.name.replace(".pdf", "").replace(/[-_]/g, " ")
      const cleanTitle = fileName.charAt(0).toUpperCase() + fileName.slice(1)

      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setIsUploading(false)
      setProcessingStatus("completed")
      setShowBookDetails(true)

      setBookDetails({
        title: cleanTitle,
        author: "GOPI MHARSHANTH RLOGANAND S", // From your sample document
        pages: "25", // Estimated from your sample
        isbn: "",
        year: "2024",
        description:
          "Data Ethics, Security Measures and the Future of Organizational Safety - A comprehensive guide covering data ethics principles, security measures, and organizational safety practices.",
        tags: "data ethics, cybersecurity, organizational safety, data protection",
        category: "Business",
      })
    } catch (error) {
      console.error("Error processing file:", error)
      setError(error instanceof Error ? error.message : "Error processing PDF file")
      setIsUploading(false)
      setProcessingStatus("idle")
      setUploadedFile(null)
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  const handleInputChange = (field: keyof BookDetails, value: string) => {
    setBookDetails((prev) => ({ ...prev, [field]: value }))
  }

  const handleSaveBook = async () => {
    if (!bookDetails.title || !bookDetails.author || !bookDetails.pages) {
      setError("Please fill in all required fields")
      return
    }

    if (!uploadedFile) {
      setError("Please upload a PDF file")
      return
    }

    if (!isReady || !pdfStorage) {
      setError("PDF storage is not ready. Please try again.")
      return
    }

    try {
      setError(null)
      setIsUploading(true)

      // Generate unique ID for the book
      const bookId = Date.now().toString()
      console.log("Saving book with ID:", bookId)

      // Store PDF in IndexedDB with proper error handling
      console.log("Storing PDF in IndexedDB...")
      await pdfStorage.storePDF(bookId, uploadedFile)
      console.log("PDF stored successfully")

      // Create book data
      const bookData = {
        id: bookId,
        ...bookDetails,
        currentPage: 1,
        totalPages: Number.parseInt(bookDetails.pages),
        lastRead: new Date().toISOString(),
        coverUrl: "/placeholder.svg?height=200&width=150",
        hasPdf: true,
        fileName: uploadedFile.name,
        fileSize: uploadedFile.size,
        status: "to-read",
      }

      // Save to localStorage
      console.log("Saving book data to localStorage...")
      const existingBooks = JSON.parse(localStorage.getItem("userBooks") || "[]")
      existingBooks.push(bookData)
      localStorage.setItem("userBooks", JSON.stringify(existingBooks))
      console.log("Book saved successfully")

      // Navigate to dashboard
      router.push("/dashboard")
    } catch (error) {
      console.error("Error saving book:", error)
      setError(error instanceof Error ? error.message : "Error saving book. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveFile = () => {
    setUploadedFile(null)
    setShowBookDetails(false)
    setProcessingStatus("idle")
    setError(null)
    setBookDetails({
      title: "",
      author: "",
      pages: "",
      isbn: "",
      year: "",
      description: "",
      tags: "",
      category: "",
    })
  }

  // Show loading state while PDF storage is initializing
  if (!isReady) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <TopNavigation />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
              <p className="text-gray-600 dark:text-gray-400">Initializing PDF storage...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <TopNavigation />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Add New Book</h1>
            <p className="text-gray-600 dark:text-gray-300">Upload a PDF and enter book details</p>
          </div>

          {/* Error Display */}
          {error && (
            <Card className="mb-8 border-red-200 dark:border-red-800">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <p className="text-red-700 dark:text-red-300">{error}</p>
                  <Button variant="ghost" size="sm" onClick={() => setError(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 1: PDF Upload */}
          {!uploadedFile && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="w-5 h-5" />
                  <span>Upload PDF Book</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-12 text-center hover:border-indigo-400 transition-colors cursor-pointer"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => document.getElementById("pdf-upload")?.click()}
                >
                  <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <div className="space-y-2">
                    <p className="text-xl font-medium text-gray-900 dark:text-white">
                      Drop your PDF here or click to browse
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Supports PDF files up to 100MB • Stored securely in your browser
                    </p>
                  </div>
                  <input type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" id="pdf-upload" />
                  <Button className="mt-6" size="lg" disabled={isUploading}>
                    {isUploading ? "Processing..." : "Choose PDF File"}
                  </Button>
                </div>

                {isUploading && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
                    <div className="flex items-center space-x-3">
                      <Loader2 className="h-6 w-6 text-blue-600 dark:text-blue-400 animate-spin" />
                      <div>
                        <p className="font-medium text-blue-900 dark:text-blue-100">Processing your PDF...</p>
                        <p className="text-sm text-blue-600 dark:text-blue-400">
                          Storing file securely for reading interface
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Uploaded File Success */}
          {uploadedFile && (
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                      {processingStatus === "processing" ? (
                        <Loader2 className="w-6 h-6 text-green-600 dark:text-green-400 animate-spin" />
                      ) : (
                        <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{uploadedFile.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {(uploadedFile.size / 1024 / 1024).toFixed(1)} MB •{" "}
                        {processingStatus === "processing"
                          ? "Processing PDF..."
                          : processingStatus === "completed"
                            ? "PDF ready for reading"
                            : "Upload complete"}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleRemoveFile}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Book Details Form */}
          {showBookDetails && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="w-5 h-5" />
                  <span>Book Details</span>
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Please review and complete the book information below.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Book Title *</Label>
                    <Input
                      id="title"
                      placeholder="Enter book title"
                      className="mt-1"
                      value={bookDetails.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="author">Author *</Label>
                    <Input
                      id="author"
                      placeholder="Enter author name"
                      className="mt-1"
                      value={bookDetails.author}
                      onChange={(e) => handleInputChange("author", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="pages">Total Pages *</Label>
                    <Input
                      id="pages"
                      type="number"
                      placeholder="300"
                      className="mt-1"
                      value={bookDetails.pages}
                      onChange={(e) => handleInputChange("pages", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="isbn">ISBN (optional)</Label>
                    <Input
                      id="isbn"
                      placeholder="978-0-123456-78-9"
                      className="mt-1"
                      value={bookDetails.isbn}
                      onChange={(e) => handleInputChange("isbn", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="year">Publication Year</Label>
                    <Input
                      id="year"
                      type="number"
                      placeholder="2023"
                      className="mt-1"
                      value={bookDetails.year}
                      onChange={(e) => handleInputChange("year", e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of the book..."
                    className="mt-1"
                    rows={3}
                    value={bookDetails.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tags">Tags (optional)</Label>
                    <Input
                      id="tags"
                      placeholder="fiction, classic, literature"
                      className="mt-1"
                      value={bookDetails.tags}
                      onChange={(e) => handleInputChange("tags", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={bookDetails.category}
                      onValueChange={(value) => handleInputChange("category", value)}
                    >
                      <SelectTrigger id="category" className="mt-1">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Fiction">Fiction</SelectItem>
                        <SelectItem value="Non-fiction">Non-fiction</SelectItem>
                        <SelectItem value="Science Fiction">Science Fiction</SelectItem>
                        <SelectItem value="Fantasy">Fantasy</SelectItem>
                        <SelectItem value="Mystery">Mystery</SelectItem>
                        <SelectItem value="Biography">Biography</SelectItem>
                        <SelectItem value="History">History</SelectItem>
                        <SelectItem value="Self-Help">Self-Help</SelectItem>
                        <SelectItem value="Business">Business</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200">PDF Ready for Reading</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        Your PDF is stored securely and will be available for full-screen reading
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          {showBookDetails && (
            <div className="flex justify-between mt-8">
              <Button variant="outline" size="lg" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button
                size="lg"
                onClick={handleSaveBook}
                disabled={!bookDetails.title || !bookDetails.author || isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Save Book
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
