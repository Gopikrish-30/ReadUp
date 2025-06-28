"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, Clock, CheckCircle } from "lucide-react"

export function DailyGoalWidget() {
  const [dailyGoal] = useState(30) // pages
  const [pagesReadToday] = useState(18)
  const [readingTime] = useState(45) // minutes

  const progress = (pagesReadToday / dailyGoal) * 100
  const pagesLeft = Math.max(0, dailyGoal - pagesReadToday)

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="text-3xl font-bold text-gray-900 dark:text-white">
          {pagesReadToday}
          <span className="text-lg text-gray-500 dark:text-gray-400">/{dailyGoal}</span>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">pages read today</div>
      </div>

      <Progress value={progress} className="h-3" />

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center mb-1">
            <TrendingUp className="w-4 h-4 text-emerald-500 mr-1" />
          </div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">{pagesLeft}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">pages left</div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center mb-1">
            <Clock className="w-4 h-4 text-blue-500 mr-1" />
          </div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">{readingTime}m</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">today</div>
        </div>
      </div>

      {progress >= 100 ? (
        <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
          <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
          <div className="text-emerald-700 dark:text-emerald-300 font-medium">Goal completed! 🎉</div>
          <div className="text-sm text-emerald-600 dark:text-emerald-400">Great job staying consistent!</div>
        </div>
      ) : (
        <Button className="w-full" size="sm">
          Continue Reading
        </Button>
      )}
    </div>
  )
}
