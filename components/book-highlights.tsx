"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Highlighter, Edit, Trash2, Plus, BrainCircuit } from "lucide-react"

// Mock highlights data
const mockHighlights = [
  {
    id: 1,
    page: 18,
    content:
      "In my younger and more vulnerable years my father gave me some advice that I've been turning over in my mind ever since.",
    color: "yellow",
    date: "2024-01-08",
  },
  {
    id: 2,
    page: 34,
    content: "So we beat on, boats against the current, borne back ceaselessly into the past.",
    color: "green",
    date: "2024-01-11",
  },
  {
    id: 3,
    page: 48,
    content: "I hope she'll be a fool—that's the best thing a girl can be in this world, a beautiful little fool.",
    color: "pink",
    date: "2024-01-13",
  },
]

interface BookHighlightsProps {
  bookId: string
}

export function BookHighlights({ bookId }: BookHighlightsProps) {
  const [highlights, setHighlights] = useState(mockHighlights)
  const [searchTerm, setSearchTerm] = useState("")

  const filteredHighlights = highlights.filter((highlight) =>
    highlight.content.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleDeleteHighlight = (id: number) => {
    setHighlights(highlights.filter((highlight) => highlight.id !== id))
  }

  const getHighlightColor = (color: string) => {
    switch (color) {
      case "yellow":
        return "bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-400"
      case "green":
        return "bg-green-100 dark:bg-green-900/30 border-l-4 border-green-400"
      case "pink":
        return "bg-pink-100 dark:bg-pink-900/30 border-l-4 border-pink-400"
      case "blue":
        return "bg-blue-100 dark:bg-blue-900/30 border-l-4 border-blue-400"
      default:
        return "bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-400"
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Highlights</h3>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-1" />
          Add Highlight
        </Button>
      </div>

      <div className="relative">
        <Input
          placeholder="Search highlights..."
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

      {filteredHighlights.length === 0 ? (
        <div className="text-center py-8">
          <Highlighter className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No highlights found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {searchTerm ? "Try a different search term" : "Add your first highlight to this book"}
          </p>
          {!searchTerm && (
            <Button>
              <Plus className="w-4 h-4 mr-1" />
              Add Highlight
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHighlights.map((highlight) => (
            <div key={highlight.id} className={`${getHighlightColor(highlight.color)} rounded-lg p-4 shadow-sm`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-medium px-2.5 py-0.5 rounded">
                    Page {highlight.page}
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">{highlight.date}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <BrainCircuit className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleDeleteHighlight(highlight.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
              <p className="text-gray-700 dark:text-gray-300 italic">"{highlight.content}"</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
