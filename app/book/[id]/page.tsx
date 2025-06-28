import Link from "next/link"
import Image from "next/image"
import { TopNavigation } from "@/components/top-navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { BookNotes } from "@/components/book-notes"
import { BookHighlights } from "@/components/book-highlights"
import { BookFlashcards } from "@/components/book-flashcards"
import { BookBookmarks } from "@/components/book-bookmarks"
import { BookOpen, Clock, Calendar, BookmarkIcon, FileText, Highlighter, BrainCircuit } from "lucide-react"

// Mock book data
const book = {
  id: 1,
  title: "The Great Gatsby",
  author: "F. Scott Fitzgerald",
  currentPage: 45,
  totalPages: 180,
  coverUrl: "/placeholder.svg?height=300&width=200",
  lastRead: "2024-01-15",
  description:
    "The Great Gatsby is a 1925 novel by American writer F. Scott Fitzgerald. Set in the Jazz Age on Long Island, near New York City, the novel depicts first-person narrator Nick Carraway's interactions with mysterious millionaire Jay Gatsby and Gatsby's obsession to reunite with his former lover, Daisy Buchanan.",
  genre: "Classic Literature",
  publishedYear: 1925,
  readingTime: "3h 45m",
  notes: 12,
  highlights: 8,
  bookmarks: 5,
  flashcards: 4,
}

export default function BookDetailPage({ params }: { params: { id: string } }) {
  const progress = (book.currentPage / book.totalPages) * 100

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <TopNavigation />

      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <Link href="/dashboard" className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm">
            ← Back to Dashboard
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Book Info */}
          <div className="lg:col-span-1">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="relative h-48 bg-gradient-to-r from-indigo-500 to-purple-600">
                  <div className="absolute inset-0 flex items-center justify-center opacity-10">
                    <BookOpen className="w-32 h-32 text-white" />
                  </div>
                </div>
                <div className="relative px-6 pb-6">
                  <div className="flex justify-center">
                    <div className="absolute -top-24 w-36 h-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                      <Image
                        src={book.coverUrl || "/placeholder.svg"}
                        alt={book.title}
                        width={200}
                        height={300}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  <div className="mt-28 text-center">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{book.title}</h1>
                    <p className="text-gray-600 dark:text-gray-300">{book.author}</p>

                    <div className="flex items-center justify-center space-x-4 mt-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>{book.publishedYear}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        <span>{book.readingTime}</span>
                      </div>
                    </div>

                    <div className="mt-6">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span>
                          Page {book.currentPage} of {book.totalPages}
                        </span>
                        <span>{Math.round(progress)}% complete</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    <div className="grid grid-cols-4 gap-2 mt-6">
                      <div className="text-center">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-1">
                          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-300">{book.notes}</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Notes</p>
                      </div>
                      <div className="text-center">
                        <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center mx-auto mb-1">
                          <Highlighter className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-300">{book.highlights}</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Highlights</p>
                      </div>
                      <div className="text-center">
                        <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-1">
                          <BookmarkIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-300">{book.bookmarks}</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Bookmarks</p>
                      </div>
                      <div className="text-center">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-1">
                          <BrainCircuit className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-300">{book.flashcards}</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Flashcards</p>
                      </div>
                    </div>

                    <div className="mt-6 space-y-3">
                      <Button asChild className="w-full">
                        <Link href={`/book/${params.id}/read`}>Continue Reading</Link>
                      </Button>
                      <Button variant="outline" className="w-full">
                        Edit Book Details
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">About this Book</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">{book.description}</p>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Genre</p>
                      <p className="font-medium text-gray-900 dark:text-white">{book.genre}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Published</p>
                      <p className="font-medium text-gray-900 dark:text-white">{book.publishedYear}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Book Content Tabs */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <Tabs defaultValue="reader">
                  <TabsList className="grid grid-cols-5 mb-6">
                    <TabsTrigger value="reader">Reader</TabsTrigger>
                    <TabsTrigger value="notes">Notes</TabsTrigger>
                    <TabsTrigger value="highlights">Highlights</TabsTrigger>
                    <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
                    <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
                  </TabsList>

                  <TabsContent value="reader" className="space-y-4">
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm">
                      <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <h3 className="font-medium text-gray-900 dark:text-white">Mini Reader</h3>
                        <Button size="sm" asChild>
                          <Link href={`/book/${params.id}/read`}>Full Screen</Link>
                        </Button>
                      </div>
                      <div className="p-6 min-h-[500px] flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                        <div className="text-center">
                          <BookOpen className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                          <p className="text-gray-500 dark:text-gray-400">
                            PDF preview will appear here. Click Full Screen to read.
                          </p>
                          <Button className="mt-4" asChild>
                            <Link href={`/book/${params.id}/read`}>Start Reading</Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="notes">
                    <BookNotes bookId={params.id} />
                  </TabsContent>

                  <TabsContent value="highlights">
                    <BookHighlights bookId={params.id} />
                  </TabsContent>

                  <TabsContent value="bookmarks">
                    <BookBookmarks bookId={params.id} />
                  </TabsContent>

                  <TabsContent value="flashcards">
                    <BookFlashcards bookId={params.id} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
