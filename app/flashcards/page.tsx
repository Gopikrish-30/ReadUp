"use client"

import { useState } from "react"
import { TopNavigation } from "@/components/top-navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { BrainCircuit, Search, Edit, Trash2, BookOpen, Play, Plus } from "lucide-react"
import Link from "next/link"

// Mock flashcards data from all books
const allFlashcards = [
  {
    id: 1,
    bookId: 1,
    bookTitle: "The Great Gatsby",
    front: "What does the green light symbolize in The Great Gatsby?",
    back: "Gatsby's hopes and dreams for the future, specifically his hope to be with Daisy.",
    page: 21,
    date: "2024-01-10",
    tags: ["symbolism", "themes"],
    difficulty: "easy",
  },
  {
    id: 2,
    bookId: 1,
    bookTitle: "The Great Gatsby",
    front: "Who is the narrator of The Great Gatsby?",
    back: "Nick Carraway",
    page: 1,
    date: "2024-01-10",
    tags: ["characters"],
    difficulty: "easy",
  },
  {
    id: 3,
    bookId: 2,
    bookTitle: "To Kill a Mockingbird",
    front: "What does Atticus Finch represent in the novel?",
    back: "Moral courage and integrity in the face of social pressure and prejudice.",
    page: 45,
    date: "2024-01-08",
    tags: ["character analysis", "themes"],
    difficulty: "medium",
  },
  {
    id: 4,
    bookId: 2,
    bookTitle: "To Kill a Mockingbird",
    front: "What does the mockingbird symbolize?",
    back: "Innocence and the destruction of innocence through evil.",
    page: 67,
    date: "2024-01-09",
    tags: ["symbolism"],
    difficulty: "medium",
  },
  {
    id: 5,
    bookId: 3,
    bookTitle: "1984",
    front: "What is doublethink?",
    back: "The ability to hold two contradictory beliefs simultaneously and accept both as true.",
    page: 89,
    date: "2024-01-06",
    tags: ["concepts", "dystopia"],
    difficulty: "hard",
  },
  {
    id: 6,
    bookId: 3,
    bookTitle: "1984",
    front: "What does Big Brother represent?",
    back: "The totalitarian state's omnipresent surveillance and control over citizens.",
    page: 156,
    date: "2024-01-07",
    tags: ["character analysis", "surveillance"],
    difficulty: "medium",
  },
]

const books = [
  { id: 1, title: "The Great Gatsby" },
  { id: 2, title: "To Kill a Mockingbird" },
  { id: 3, title: "1984" },
]

export default function FlashcardsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedBook, setSelectedBook] = useState("all")
  const [selectedDifficulty, setSelectedDifficulty] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "study">("grid")
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [flippedCards, setFlippedCards] = useState<number[]>([])

  const filteredFlashcards = allFlashcards.filter((card) => {
    const matchesSearch =
      card.front.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.back.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.bookTitle.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesBook = selectedBook === "all" || card.bookId.toString() === selectedBook
    const matchesDifficulty = selectedDifficulty === "all" || card.difficulty === selectedDifficulty

    return matchesSearch && matchesBook && matchesDifficulty
  })

  const handleDeleteCard = (id: number) => {
    console.log("Deleting flashcard:", id)
  }

  const toggleFlip = (id: number) => {
    if (flippedCards.includes(id)) {
      setFlippedCards(flippedCards.filter((cardId) => cardId !== id))
    } else {
      setFlippedCards([...flippedCards, id])
    }
  }

  const nextCard = () => {
    if (currentCardIndex < filteredFlashcards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1)
      setFlippedCards([])
    }
  }

  const prevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1)
      setFlippedCards([])
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
      case "medium":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
      case "hard":
        return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <TopNavigation />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Flashcards</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              {allFlashcards.length} flashcards across {books.length} books
            </p>
          </div>
          <div className="flex space-x-3">
            <Button variant={viewMode === "grid" ? "default" : "outline"} onClick={() => setViewMode("grid")}>
              Grid View
            </Button>
            <Button variant={viewMode === "study" ? "default" : "outline"} onClick={() => setViewMode("study")}>
              <Play className="w-4 h-4 mr-2" />
              Study Mode
            </Button>
            <Button asChild>
              <Link href="/dashboard">
                <Plus className="w-4 h-4 mr-2" />
                Create Card
              </Link>
            </Button>
          </div>
        </div>

        {viewMode === "grid" && (
          <>
            {/* Filters */}
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search flashcards..."
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

                  {/* Difficulty Filter */}
                  <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Filter by difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Difficulties</SelectItem>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Flashcards Grid */}
            {filteredFlashcards.length === 0 ? (
              <div className="text-center py-12">
                <BrainCircuit className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No flashcards found</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  {searchTerm || selectedBook !== "all" || selectedDifficulty !== "all"
                    ? "Try adjusting your search or filters"
                    : "Create flashcards from your notes and highlights"}
                </p>
                <Button asChild>
                  <Link href="/dashboard">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Go to Dashboard
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFlashcards.map((card) => (
                  <Card key={card.id} className="cursor-pointer" onClick={() => toggleFlip(card.id)}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <Link
                          href={`/book/${card.bookId}`}
                          className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {card.bookTitle}
                        </Link>
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(card.difficulty)}`}>
                            {card.difficulty}
                          </span>
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation()
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteCard(card.id)
                              }}
                            >
                              <Trash2 className="h-3 w-3 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="min-h-[120px] flex items-center justify-center">
                        {flippedCards.includes(card.id) ? (
                          <div className="text-center">
                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Answer:</h4>
                            <p className="text-gray-900 dark:text-white">{card.back}</p>
                          </div>
                        ) : (
                          <div className="text-center">
                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Question:</h4>
                            <p className="text-gray-900 dark:text-white">{card.front}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Page {card.page}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{card.date}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {viewMode === "study" && filteredFlashcards.length > 0 && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Study Session</h2>
              <p className="text-gray-600 dark:text-gray-300">
                Card {currentCardIndex + 1} of {filteredFlashcards.length}
              </p>
            </div>

            <Card className="mb-6">
              <CardContent className="p-8">
                <div className="text-center mb-4">
                  <span className="text-sm text-indigo-600 dark:text-indigo-400">
                    {filteredFlashcards[currentCardIndex].bookTitle}
                  </span>
                </div>

                <div
                  className="min-h-[200px] flex items-center justify-center cursor-pointer"
                  onClick={() => toggleFlip(filteredFlashcards[currentCardIndex].id)}
                >
                  {flippedCards.includes(filteredFlashcards[currentCardIndex].id) ? (
                    <div className="text-center">
                      <h4 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-4">Answer:</h4>
                      <p className="text-xl text-gray-900 dark:text-white">
                        {filteredFlashcards[currentCardIndex].back}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <h4 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-4">Question:</h4>
                      <p className="text-xl text-gray-900 dark:text-white">
                        {filteredFlashcards[currentCardIndex].front}
                      </p>
                    </div>
                  )}
                </div>

                <div className="text-center mt-6">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Click to{" "}
                    {flippedCards.includes(filteredFlashcards[currentCardIndex].id) ? "see question" : "reveal answer"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-center space-x-4">
              <Button variant="outline" onClick={prevCard} disabled={currentCardIndex === 0}>
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={nextCard}
                disabled={currentCardIndex === filteredFlashcards.length - 1}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
