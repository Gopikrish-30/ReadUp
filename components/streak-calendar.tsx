"use client"

import { Flame } from "lucide-react"

export function StreakCalendar() {
  // Mock streak data - in real app, this would come from your database
  const streakData = [
    { date: "2024-01-08", pages: 0 },
    { date: "2024-01-09", pages: 25 },
    { date: "2024-01-10", pages: 30 },
    { date: "2024-01-11", pages: 15 },
    { date: "2024-01-12", pages: 40 },
    { date: "2024-01-13", pages: 35 },
    { date: "2024-01-14", pages: 20 },
    { date: "2024-01-15", pages: 18 },
  ]

  const currentStreak = 7

  const getIntensityClass = (pages: number) => {
    if (pages === 0) return "bg-gray-100 dark:bg-gray-700"
    if (pages < 20) return "bg-emerald-200 dark:bg-emerald-800"
    if (pages < 30) return "bg-emerald-400 dark:bg-emerald-600"
    return "bg-emerald-600 dark:bg-emerald-500"
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-gray-500 dark:text-gray-400">Last 7 days</div>
        <div className="flex items-center space-x-1 text-orange-500">
          <Flame className="w-4 h-4" />
          <span className="font-bold">{currentStreak}</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {streakData.map((day, index) => (
          <div key={day.date} className="text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              {new Date(day.date).toLocaleDateString("en", { weekday: "short" })[0]}
            </div>
            <div
              className={`w-8 h-8 rounded-lg ${getIntensityClass(day.pages)} flex items-center justify-center text-xs font-medium transition-colors hover:scale-110 cursor-pointer mx-auto`}
              title={`${day.pages} pages on ${new Date(day.date).toLocaleDateString()}`}
            >
              {day.pages > 0 && <span className="text-white">{day.pages}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-3">
        <span>Less</span>
        <div className="flex space-x-1">
          <div className="w-3 h-3 rounded bg-gray-100 dark:bg-gray-700"></div>
          <div className="w-3 h-3 rounded bg-emerald-200 dark:bg-emerald-800"></div>
          <div className="w-3 h-3 rounded bg-emerald-400 dark:bg-emerald-600"></div>
          <div className="w-3 h-3 rounded bg-emerald-600 dark:bg-emerald-500"></div>
        </div>
        <span>More</span>
      </div>
    </div>
  )
}
