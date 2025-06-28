import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

export function AddBookFAB() {
  return (
    <div className="fixed bottom-6 right-6 z-40">
      <Button
        asChild
        size="lg"
        className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-shadow bg-indigo-600 hover:bg-indigo-700"
      >
        <Link href="/add">
          <Plus className="w-6 h-6" />
          <span className="sr-only">Add new book</span>
        </Link>
      </Button>
    </div>
  )
}
