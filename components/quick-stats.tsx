import { BookOpen, Clock, Target, TrendingUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export function QuickStats() {
  const stats = [
    {
      label: "Books Completed",
      value: "12",
      icon: BookOpen,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      trend: "+2 this month",
      trendColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Pages Read",
      value: "2,847",
      icon: TrendingUp,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
      trend: "+156 this week",
      trendColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Reading Time",
      value: "127h",
      icon: Clock,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      trend: "+8h this week",
      trendColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Current Streak",
      value: "7 days",
      icon: Target,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
      trend: "Best: 14 days",
      trendColor: "text-gray-600 dark:text-gray-400",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                <p className={`text-sm ${stat.trendColor} mt-1`}>{stat.trend}</p>
              </div>
              <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
