"use client"

import { useState, useEffect } from "react"
import { TopNavigation } from "@/components/top-navigation"
import { BookCard } from "@/components/book-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen, Search, Grid, List, Plus } from "lucide-react"
import Link from "next/link"

export default function LibraryPage() {
  const [allBooks, setAllBooks] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterCategory, setFilterCategory] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  useEffect(() => {
    // Load books from localStorage
    const loadBooks = () => {
      try {
        const books = JSON.parse(localStorage.getItem("userBooks") || "[]")
        setAllBooks(books)
      } catch (error) {
        console.error("Error loading books:", error)
      }
    }

    loadBooks()
  }, [])

  // Update the filtered books logic to handle the dynamic status
  const filteredBooks = allBooks.filter((book) => {
    const matchesSearch =
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase())

    // Determine book status dynamically
    let bookStatus = book.status
    if (!bookStatus) {
      if (book.currentPage === 0) {
        bookStatus = "to-read"
      } else if (book.currentPage >= book.totalPages) {
        bookStatus = "completed"
      } else {
        bookStatus = "reading"
      }
    }

    const matchesStatus = filterStatus === "all" || bookStatus === filterStatus
    const matchesCategory = filterCategory === "all" || book.category === filterCategory

    return matchesSearch && matchesStatus && matchesCategory
  })

  const categories = [...new Set(allBooks.map((book) => book.category).filter(Boolean))]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <TopNavigation />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Library</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              {allBooks.length} books • {allBooks.filter((b) => b.status === "reading").length} currently reading
            </p>
          </div>
          <Button asChild>
            <Link href="/add">
              <Plus className="w-4 h-4 mr-2" />
              Add Book
            </Link>
          </Button>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search books or authors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Books</SelectItem>
                <SelectItem value="reading">Currently Reading</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="to-read">To Read</SelectItem>
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* View Mode Toggle */}
            <div className="flex border border-gray-200 dark:border-gray-700 rounded-lg">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="rounded-r-none"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-l-none"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Books Grid/List */}
        {filteredBooks.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No books found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {searchTerm || filterStatus !== "all" || filterCategory !== "all"
                ? "Try adjusting your search or filters"
                : "Start building your library by adding your first book"}
            </p>
            <Button asChild>
              <Link href="/add">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Book
              </Link>
            </Button>
          </div>
        ) : (
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
            {filteredBooks.map((book) => (
              <div
                key={book.id}
                className={
                  viewMode === "list"
                    ? "bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700"
                    : ""
                }
              >
                <BookCard book={book} />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
