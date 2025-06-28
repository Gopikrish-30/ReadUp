"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BookmarkIcon, Trash2, Plus } from "lucide-react"

// Mock bookmarks data
const mockBookmarks = [
  {
    id: 1,
    page: 24,
    note: "Beginning of Chapter 2",
    date: "2024-01-09",
  },
  {
    id: 2,
    page: 56,
    note: "Gatsby's party scene",
    date: "2024-01-12",
  },
  {
    id: 3,
    page: 89,
    note: "Gatsby and Daisy reunion",
    date: "2024-01-14",
  },
]

interface BookBookmarksProps {
  bookId: string
}

export function BookBookmarks({ bookId }: BookBookmarksProps) {
  const [bookmarks, setBookmarks] = useState(mockBookmarks)
  const [searchTerm, setSearchTerm] = useState("")

  const filteredBookmarks = bookmarks.filter((bookmark) =>
    bookmark.note.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleDeleteBookmark = (id: number) => {
    setBookmarks(bookmarks.filter((bookmark) => bookmark.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Bookmarks</h3>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-1" />
          Add Bookmark
        </Button>
      </div>

      <div className="relative">
        <Input
          placeholder="Search bookmarks..."
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

      {filteredBookmarks.length === 0 ? (
        <div className="text-center py-8">
          <BookmarkIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No bookmarks found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {searchTerm ? "Try a different search term" : "Add your first bookmark to this book"}
          </p>
          {!searchTerm && (
            <Button>
              <Plus className="w-4 h-4 mr-1" />
              Add Bookmark
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBookmarks.map((bookmark) => (
            <div
              key={bookmark.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm flex items-center"
            >
              <div className="flex-shrink-0 mr-4">
                <div className="w-10 h-14 bg-purple-100 dark:bg-purple-900/30 rounded flex items-center justify-center relative">
                  <BookmarkIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  <div className="absolute inset-0 flex items-center justify-center mt-1">
                    <span className="text-xs font-medium text-purple-800 dark:text-purple-300">{bookmark.page}</span>
                  </div>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium text-gray-900 dark:text-white truncate">Page {bookmark.page}</h4>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 ml-2"
                    onClick={() => handleDeleteBookmark(bookmark.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 truncate">{bookmark.note}</p>
                <span className="text-xs text-gray-500 dark:text-gray-400">{bookmark.date}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
