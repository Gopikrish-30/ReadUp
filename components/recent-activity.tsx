import { BookOpen, FileText, Highlighter, BookmarkIcon, BrainCircuit } from "lucide-react"

// Mock data for recent activity
const activities = [
  {
    id: 1,
    type: "read",
    book: "The Great Gatsby",
    pages: 15,
    time: "2 hours ago",
    icon: BookOpen,
    color: "text-blue-500",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  {
    id: 2,
    type: "note",
    book: "To Kill a Mockingbird",
    content: "Added a note about Atticus Finch's character development",
    time: "Yesterday",
    icon: FileText,
    color: "text-emerald-500",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
  },
  {
    id: 3,
    type: "highlight",
    book: "1984",
    content: "Highlighted a passage about doublethink",
    time: "2 days ago",
    icon: Highlighter,
    color: "text-yellow-500",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
  },
  {
    id: 4,
    type: "bookmark",
    book: "The Catcher in the Rye",
    page: 78,
    time: "3 days ago",
    icon: BookmarkIcon,
    color: "text-purple-500",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
  },
  {
    id: 5,
    type: "flashcard",
    book: "The Great Gatsby",
    content: "Created flashcard about symbolism",
    time: "3 days ago",
    icon: BrainCircuit,
    color: "text-indigo-500",
    bgColor: "bg-indigo-100 dark:bg-indigo-900/30",
  },
]

export function RecentActivity() {
  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="flex items-start space-x-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
          <div className={`${activity.bgColor} p-2 rounded-lg mt-0.5 flex-shrink-0`}>
            <activity.icon className={`w-4 h-4 ${activity.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900 dark:text-white truncate">{activity.book}</h4>
              <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">{activity.time}</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {activity.type === "read" && `Read ${activity.pages} pages`}
              {activity.type === "note" && activity.content}
              {activity.type === "highlight" && activity.content}
              {activity.type === "bookmark" && `Bookmarked page ${activity.page}`}
              {activity.type === "flashcard" && activity.content}
            </p>
          </div>
        </div>
      ))}

      <button className="w-full mt-4 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium">
        View all activity →
      </button>
    </div>
  )
}
