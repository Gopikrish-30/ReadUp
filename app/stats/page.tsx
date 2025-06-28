"use client"

import { TopNavigation } from "@/components/top-navigation"
import { StreakCalendar } from "@/components/streak-calendar"
import { QuickStats } from "@/components/quick-stats"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, Clock, Target, Calendar, Award } from "lucide-react"

// Mock data for statistics
const monthlyData = [
  { month: "Jan", books: 2, pages: 456, hours: 18 },
  { month: "Feb", books: 3, pages: 678, hours: 27 },
  { month: "Mar", books: 1, pages: 234, hours: 12 },
  { month: "Apr", books: 4, pages: 892, hours: 35 },
  { month: "May", books: 2, pages: 567, hours: 23 },
  { month: "Jun", books: 3, pages: 789, hours: 31 },
]

const readingGoals = [
  { title: "Annual Reading Goal", current: 12, target: 24, unit: "books" },
  { title: "Monthly Pages Goal", current: 567, target: 800, unit: "pages" },
  { title: "Weekly Reading Time", current: 8.5, target: 10, unit: "hours" },
]

const achievements = [
  { title: "First Book", description: "Completed your first book", earned: true, date: "2024-01-05" },
  { title: "Speed Reader", description: "Read 5 books in a month", earned: true, date: "2024-04-30" },
  { title: "Consistent Reader", description: "Maintain a 7-day streak", earned: true, date: "2024-01-15" },
  { title: "Knowledge Seeker", description: "Create 50 flashcards", earned: false, progress: 32 },
  { title: "Note Taker", description: "Write 100 notes", earned: false, progress: 67 },
  { title: "Bookworm", description: "Read 1000 pages", earned: true, date: "2024-03-20" },
]

export default function StatsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <TopNavigation />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reading Statistics</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Track your reading progress and achievements</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Stats */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Stats */}
            <QuickStats />

            {/* Monthly Progress Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Monthly Progress</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {monthlyData.map((month, index) => (
                    <div key={month.month} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{month.month}</span>
                        <span className="text-gray-500 dark:text-gray-400">
                          {month.books} books • {month.pages} pages • {month.hours}h
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Books</div>
                          <Progress value={(month.books / 5) * 100} className="h-2" />
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Pages</div>
                          <Progress value={(month.pages / 1000) * 100} className="h-2" />
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Hours</div>
                          <Progress value={(month.hours / 40) * 100} className="h-2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Reading Goals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5" />
                  <span>Reading Goals</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {readingGoals.map((goal, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900 dark:text-white">{goal.title}</h4>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {goal.current} / {goal.target} {goal.unit}
                      </span>
                    </div>
                    <Progress value={(goal.current / goal.target) * 100} className="h-3" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {Math.round((goal.current / goal.target) * 100)}% complete
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="w-5 h-5" />
                  <span>Achievements</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {achievements.map((achievement, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${
                        achievement.earned
                          ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
                          : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            achievement.earned
                              ? "bg-emerald-100 dark:bg-emerald-900/30"
                              : "bg-gray-100 dark:bg-gray-700"
                          }`}
                        >
                          <Award
                            className={`w-5 h-5 ${
                              achievement.earned ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400"
                            }`}
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">{achievement.title}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{achievement.description}</p>
                          {achievement.earned ? (
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">
                              Earned on {achievement.date}
                            </p>
                          ) : (
                            <div className="mt-2">
                              <Progress value={(achievement.progress! / 100) * 100} className="h-2" />
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {achievement.progress}% complete
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Reading Streak Calendar */}
            <StreakCalendar />

            {/* This Week Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>This Week</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Books Started</span>
                  <span className="font-semibold">1</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Books Finished</span>
                  <span className="font-semibold">0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Pages Read</span>
                  <span className="font-semibold">156</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Reading Time</span>
                  <span className="font-semibold">8.5h</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Notes Created</span>
                  <span className="font-semibold">12</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Highlights Made</span>
                  <span className="font-semibold">8</span>
                </div>
              </CardContent>
            </Card>

            {/* Reading Habits */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>Reading Habits</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Favorite Reading Time</span>
                    <span className="font-semibold">Evening</span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">7:00 PM - 9:00 PM</div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Average Session</span>
                    <span className="font-semibold">45 min</span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Reading Speed</span>
                    <span className="font-semibold">250 wpm</span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Favorite Genre</span>
                    <span className="font-semibold">Fiction</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
