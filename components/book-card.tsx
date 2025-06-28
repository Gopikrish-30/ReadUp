import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Calendar, Play, Eye, FileText } from "lucide-react"

interface Book {
  id: number
  title: string
  author: string
  currentPage: number
  totalPages: number
  coverUrl: string
  lastRead: string
  hasPdf?: boolean
  fileUrl?: string
  fileName?: string
}

interface BookCardProps {
  book: Book
}

export function BookCard({ book }: BookCardProps) {
  const progress = (book.currentPage / book.totalPages) * 100
  const pagesLeft = book.totalPages - book.currentPage

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 hover:shadow-md transition-all duration-200 border border-gray-100 dark:border-gray-700">
      <div className="flex space-x-4">
        {/* Book Cover */}
        <div className="flex-shrink-0">
          <div className="relative group">
            <Image
              src={book.coverUrl || "/placeholder.svg"}
              alt={book.title}
              width={80}
              height={110}
              className="rounded-lg object-cover shadow-sm"
            />
            <div className="absolute inset-0 bg-black/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Play className="w-6 h-6 text-white" />
            </div>
            {(book.hasPdf || book.fileUrl) && (
              <div className="absolute -bottom-2 -right-2 bg-red-600 text-white p-1 rounded-full">
                <FileText className="w-3 h-3" />
              </div>
            )}
          </div>
        </div>

        {/* Book Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col h-full">
            {/* Title and Author */}
            <div className="mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-white text-lg leading-tight mb-1">{book.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">{book.author}</p>
            </div>

            {/* Progress Section */}
            <div className="mb-4 flex-1">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">
                  Page {book.currentPage} of {book.totalPages}
                </span>
                <span className="font-medium text-gray-900 dark:text-white">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2 mb-2" />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {pagesLeft > 0 ? `${pagesLeft} pages remaining` : "Completed"}
              </p>
            </div>

            {/* Footer with Last Read and Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                <Calendar className="w-3 h-3 mr-1" />
                <span>{new Date(book.lastRead).toLocaleDateString()}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/book/${book.id}`}>
                    <Eye className="w-3 h-3 mr-1" />
                    Details
                  </Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href={`/book/${book.id}/read`}>
                    <Play className="w-3 h-3 mr-1" />
                    {book.hasPdf || book.fileUrl ? "Read PDF" : "Continue"}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
