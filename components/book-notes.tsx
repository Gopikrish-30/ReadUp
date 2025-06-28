"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileText, Edit, Trash2, Plus, BrainCircuit } from "lucide-react"

// Mock notes data
const mockNotes = [
  {
    id: 1,
    page: 12,
    content: "The green light at the end of Daisy's dock symbolizes Gatsby's hopes and dreams for the future.",
    date: "2024-01-10",
  },
  {
    id: 2,
    page: 24,
    content:
      "The valley of ashes represents the moral and social decay hidden by the beautiful façades of the rich. It symbolizes the corruption of America's moral and social values.",
    date: "2024-01-12",
  },
  {
    id: 3,
    page: 36,
    content: "The eyes of Doctor T.J. Eckleburg are a symbol of God watching over a morally bankrupt society.",
    date: "2024-01-14",
  },
]

interface BookNotesProps {
  bookId: string
}

export function BookNotes({ bookId }: BookNotesProps) {
  const [notes, setNotes] = useState(mockNotes)
  const [searchTerm, setSearchTerm] = useState("")

  const filteredNotes = notes.filter((note) => note.content.toLowerCase().includes(searchTerm.toLowerCase()))

  const handleDeleteNote = (id: number) => {
    setNotes(notes.filter((note) => note.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notes</h3>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-1" />
          Add Note
        </Button>
      </div>

      <div className="relative">
        <Input
          placeholder="Search notes..."
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

      {filteredNotes.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No notes found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {searchTerm ? "Try a different search term" : "Add your first note to this book"}
          </p>
          {!searchTerm && (
            <Button>
              <Plus className="w-4 h-4 mr-1" />
              Add Note
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium px-2.5 py-0.5 rounded">
                    Page {note.page}
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{note.date}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
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
              <p className="text-gray-700 dark:text-gray-300">{note.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
