"use client"

import { useState } from "react"
import { TopNavigation } from "@/components/top-navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Search, Edit, Trash2, BookOpen, BrainCircuit, Plus } from "lucide-react"
import Link from "next/link"

// Mock notes data from all books
const allNotes = [
  {
    id: 1,
    bookId: 1,
    bookTitle: "The Great Gatsby",
    page: 12,
    content: "The green light at the end of Daisy's dock symbolizes Gatsby's hopes and dreams for the future.",
    date: "2024-01-10",
    tags: ["symbolism", "themes"],
  },
  {
    id: 2,
    bookId: 1,
    bookTitle: "The Great Gatsby",
    page: 24,
    content: "The valley of ashes represents the moral and social decay hidden by the beautiful façades of the rich.",
    date: "2024-01-12",
    tags: ["symbolism", "social commentary"],
  },
  {
    id: 3,
    bookId: 2,
    bookTitle: "To Kill a Mockingbird",
    page: 45,
    content: "Atticus Finch represents moral courage and integrity in the face of social pressure.",
    date: "2024-01-08",
    tags: ["character analysis", "themes"],
  },
  {
    id: 4,
    bookId: 2,
    bookTitle: "To Kill a Mockingbird",
    page: 67,
    content: "The mockingbird symbolizes innocence and the destruction of innocence through evil.",
    date: "2024-01-09",
    tags: ["symbolism", "innocence"],
  },
  {
    id: 5,
    bookId: 3,
    bookTitle: "1984",
    page: 89,
    content: "Doublethink is the ability to hold two contradictory beliefs simultaneously and accept both as true.",
    date: "2024-01-06",
    tags: ["concepts", "dystopia"],
  },
  {
    id: 6,
    bookId: 3,
    bookTitle: "1984",
    page: 156,
    content: "Big Brother represents the totalitarian state's omnipresent surveillance and control.",
    date: "2024-01-07",
    tags: ["character analysis", "surveillance"],
  },
]

const books = [
  { id: 1, title: "The Great Gatsby" },
  { id: 2, title: "To Kill a Mockingbird" },
  { id: 3, title: "1984" },
]

export default function NotesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedBook, setSelectedBook] = useState("all")
  const [selectedTag, setSelectedTag] = useState("all")

  const filteredNotes = allNotes.filter((note) => {
    const matchesSearch =
      note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.bookTitle.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesBook = selectedBook === "all" || note.bookId.toString() === selectedBook
    const matchesTag = selectedTag === "all" || note.tags.includes(selectedTag)

    return matchesSearch && matchesBook && matchesTag
  })

  const allTags = [...new Set(allNotes.flatMap((note) => note.tags))]

  const handleDeleteNote = (id: number) => {
    // In a real app, this would delete from the database
    console.log("Deleting note:", id)
  }

  const handleCreateFlashcard = (note: (typeof allNotes)[0]) => {
    // In a real app, this would create a flashcard from the note
    console.log("Creating flashcard from note:", note)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <TopNavigation />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">All Notes</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              {allNotes.length} notes across {books.length} books
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard">
              <Plus className="w-4 h-4 mr-2" />
              Add Note
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Book Filter */}
              <Select value={selectedBook} onValueChange={setSelectedBook}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by book" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Books</SelectItem>
                  {books.map((book) => (
                    <SelectItem key={book.id} value={book.id.toString()}>
                      {book.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Tag Filter */}
              <Select value={selectedTag} onValueChange={setSelectedTag}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by tag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tags</SelectItem>
                  {allTags.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notes List */}
        {filteredNotes.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No notes found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {searchTerm || selectedBook !== "all" || selectedTag !== "all"
                ? "Try adjusting your search or filters"
                : "Start taking notes while reading your books"}
            </p>
            <Button asChild>
              <Link href="/dashboard">
                <BookOpen className="w-4 h-4 mr-2" />
                Go to Dashboard
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotes.map((note) => (
              <Card key={note.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Link
                        href={`/book/${note.bookId}`}
                        className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                      >
                        {note.bookTitle}
                      </Link>
                      <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium px-2.5 py-0.5 rounded">
                        Page {note.page}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{note.date}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleCreateFlashcard(note)}
                      >
                        <BrainCircuit className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteNote(note.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>

                  <p className="text-gray-700 dark:text-gray-300 mb-3">{note.content}</p>

                  <div className="flex flex-wrap gap-2">
                    {note.tags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
