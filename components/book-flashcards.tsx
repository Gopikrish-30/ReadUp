"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BrainCircuit, Edit, Trash2, Plus } from "lucide-react"

// Mock flashcards data
const mockFlashcards = [
  {
    id: 1,
    front: "Who is the narrator of The Great Gatsby?",
    back: "Nick Carraway",
    page: 1,
    date: "2024-01-10",
  },
  {
    id: 2,
    front: "What does the green light symbolize?",
    back: "Gatsby's hopes and dreams for the future, specifically his hope to be with Daisy.",
    page: 21,
    date: "2024-01-12",
  },
  {
    id: 3,
    front: "Where does Gatsby live?",
    back: "In a mansion in West Egg, Long Island, across the bay from Daisy's home.",
    page: 5,
    date: "2024-01-14",
  },
]

interface BookFlashcardsProps {
  bookId: string
}

export function BookFlashcards({ bookId }: BookFlashcardsProps) {
  const [flashcards, setFlashcards] = useState(mockFlashcards)
  const [searchTerm, setSearchTerm] = useState("")
  const [flippedCards, setFlippedCards] = useState<number[]>([])
  const [viewMode, setViewMode] = useState<"grid" | "study">("grid")

  const filteredFlashcards = flashcards.filter(
    (card) =>
      card.front.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.back.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleDeleteFlashcard = (id: number) => {
    setFlashcards(flashcards.filter((card) => card.id !== id))
  }

  const toggleFlip = (id: number) => {
    if (flippedCards.includes(id)) {
      setFlippedCards(flippedCards.filter((cardId) => cardId !== id))
    } else {
      setFlippedCards([...flippedCards, id])
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Flashcards</h3>
        <div className="flex space-x-2">
          <Button size="sm" variant={viewMode === "grid" ? "default" : "outline"} onClick={() => setViewMode("grid")}>
            Grid
          </Button>
          <Button size="sm" variant={viewMode === "study" ? "default" : "outline"} onClick={() => setViewMode("study")}>
            Study
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Add Card
          </Button>
        </div>
      </div>

      {viewMode === "grid" && (
        <div className="relative">
          <Input
            placeholder="Search flashcards..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
        </div>
      )}

      {filteredFlashcards.length === 0 ? (
        <div className="text-center py-8">
          <BrainCircuit className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No flashcards found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {searchTerm ? "Try a different search term" : "Add your first flashcard to this book"}
          </p>
          {!searchTerm && (
            <Button>
              <Plus className="w-4 h-4 mr-1" />
              Add Flashcard
            </Button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFlashcards.map((card) => (
            <div
              key={card.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium px-2.5 py-0.5 rounded">
                    Page {card.page}
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{card.date}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleDeleteFlashcard(card.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Question:</h4>
                  <p className="text-gray-900 dark:text-white">{card.front}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Answer:</h4>
                  <p className="text-gray-900 dark:text-white">{card.back}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center">
          {filteredFlashcards.map((card, index) => (
            <div
              key={card.id}
              className={`w-full max-w-md h-64 cursor-pointer perspective-1000 ${index === 0 ? "block" : "hidden"}`}
              onClick={() => toggleFlip(card.id)}
            >
              <div
                className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${
                  flippedCards.includes(card.id) ? "rotate-y-180" : ""
                }`}
              >
                {/* Front of card */}
                <div
                  className={`absolute w-full h-full backface-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-md flex flex-col ${
                    flippedCards.includes(card.id) ? "hidden" : ""
                  }`}
                >
                  <div className="flex-1 flex items-center justify-center">
                    <h3 className="text-xl font-medium text-gray-900 dark:text-white text-center">{card.front}</h3>
                  </div>
                  <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
                    Click to reveal answer
                  </div>
                </div>

                {/* Back of card */}
                <div
                  className={`absolute w-full h-full backface-hidden bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-6 shadow-md flex flex-col rotate-y-180 ${
                    !flippedCards.includes(card.id) ? "hidden" : ""
                  }`}
                >
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-lg text-gray-900 dark:text-white text-center">{card.back}</p>
                  </div>
                  <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">Click to see question</div>
                </div>
              </div>
            </div>
          ))}

          <div className="flex items-center justify-center space-x-4 mt-6">
            <Button variant="outline" size="sm">
              Previous
            </Button>
            <span className="text-sm text-gray-600 dark:text-gray-300">Card 1 of {filteredFlashcards.length}</span>
            <Button variant="outline" size="sm">
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
