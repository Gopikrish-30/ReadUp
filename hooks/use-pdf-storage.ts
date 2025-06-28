"use client"

import { useEffect, useState } from "react"
import { getPdfStorage } from "@/lib/pdf-storage"

export function usePdfStorage() {
  const [isReady, setIsReady] = useState(false)
  const [storage, setStorage] = useState<ReturnType<typeof getPdfStorage> | null>(null)

  useEffect(() => {
    // Only initialize on client side
    if (typeof window !== "undefined") {
      const pdfStorage = getPdfStorage()
      setStorage(pdfStorage)
      setIsReady(true)
    }
  }, [])

  return { storage, isReady }
}
