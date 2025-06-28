"use client"

import { useState, useEffect } from "react"
import { TopNavigation } from "@/components/top-navigation"
import { BookCard } from "@/components/book-card"
import { DailyGoalWidget } from "@/components/daily-goal-widget"
import { StreakCalendar } from "@/components/streak-calendar"
import { AddBookFAB } from "@/components/add-book-fab"
import { RecentActivity } from "@/components/recent-activity"
import { QuickStats } from "@/components/quick-stats"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, TrendingUp, Target, Plus, ArrowRight, BookMarked, BookCopy } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const [currentBooks, setCurrentBooks] = useState<any[]>([])
  const [recentlyAdded, setRecentlyAdded] = useState<any[]>([])
  const [completedBooks, setCompletedBooks] = useState<any[]>([])

  useEffect(() => {
    // Load books from localStorage
    const loadBooks = () => {
      try {
        const books = JSON.parse(localStorage.getItem("userBooks") || "[]")

        // Filter books by status
        const reading = books.filter(
          (book: any) => book.status === "reading" || (book.currentPage > 0 && book.currentPage < book.totalPages),
        )
        const recent = books.filter((book: any) => book.status === "to-read" || book.currentPage === 0)
        const completed = books.filter(
          (book: any) => book.status === "completed" || book.currentPage >= book.totalPages,
        )

        setCurrentBooks(reading)
        setRecentlyAdded(recent)
        setCompletedBooks(completed)
      } catch (error) {
        console.error("Error loading books:", error)
      }
    }

    loadBooks()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <TopNavigation />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Good morning! 👋</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">Ready to continue your reading journey today?</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" size="sm" asChild>
                <Link href="/stats">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Analytics
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/library">
                  <BookCopy className="w-4 h-4 mr-2" />
                  Library
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/add">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Book
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mb-8">
          <QuickStats />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Reading Tabs */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle>My Books</CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/library" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700">
                      View All
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </Button>
                </div>
                <CardDescription>Track your reading progress across all your books</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Tabs defaultValue="reading" className="w-full">
                  <TabsList className="grid grid-cols-3 mb-6">
                    <TabsTrigger value="reading" className="text-sm">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Reading
                    </TabsTrigger>
                    <TabsTrigger value="recent" className="text-sm">
                      <BookMarked className="w-4 h-4 mr-2" />
                      Recently Added
                    </TabsTrigger>
                    <TabsTrigger value="completed" className="text-sm">
                      <Target className="w-4 h-4 mr-2" />
                      Completed
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="reading" className="mt-0">
                    {currentBooks.length === 0 ? (
                      <div className="text-center py-12">
                        <BookOpen className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No books in progress</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                          Start your reading journey by adding your first book
                        </p>
                        <Button asChild>
                          <Link href="/add">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Your First Book
                          </Link>
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {currentBooks.map((book) => (
                          <BookCard key={book.id} book={book} />
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="recent" className="mt-0">
                    <div className="space-y-4">
                      {recentlyAdded.map((book) => (
                        <BookCard key={book.id} book={book} />
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="completed" className="mt-0">
                    {completedBooks.length === 0 ? (
                      <div className="text-center py-12">
                        <Target className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          No completed books yet
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">Keep reading to finish your first book</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {completedBooks.map((book) => (
                          <BookCard key={book.id} book={book} />
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest reading activity and notes</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <RecentActivity />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-8">
            {/* Daily Goal Widget */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Daily Goal</CardTitle>
                <CardDescription>Track your daily reading progress</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <DailyGoalWidget />
              </CardContent>
            </Card>

            {/* Reading Streak Calendar */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Reading Streak</CardTitle>
                <CardDescription>Your daily reading consistency</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <StreakCalendar />
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Quick Links</CardTitle>
                <CardDescription>Frequently used features</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="justify-start" asChild>
                    <Link href="/notes">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Notes
                    </Link>
                  </Button>
                  <Button variant="outline" className="justify-start" asChild>
                    <Link href="/flashcards">
                      <BookMarked className="w-4 h-4 mr-2" />
                      Flashcards
                    </Link>
                  </Button>
                  <Button variant="outline" className="justify-start" asChild>
                    <Link href="/stats">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Statistics
                    </Link>
                  </Button>
                  <Button variant="outline" className="justify-start" asChild>
                    <Link href="/library">
                      <BookCopy className="w-4 h-4 mr-2" />
                      Library
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Floating Add Book Button */}
      <AddBookFAB />
    </div>
  )
}
