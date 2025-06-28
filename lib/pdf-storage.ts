"use client"

// IndexedDB wrapper for storing PDF files - Client-side only
class PDFStorage {
  private dbName = "ReadingTrackerPDFs"
  private version = 1
  private storeName = "pdfs"

  // Check if we're in the browser
  private isBrowser(): boolean {
    return typeof window !== "undefined" && typeof indexedDB !== "undefined"
  }

  async openDB(): Promise<IDBDatabase> {
    if (!this.isBrowser()) {
      throw new Error("IndexedDB is not available")
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: "id" })
        }
      }
    })
  }

  async storePDF(id: string, file: File): Promise<void> {
    if (!this.isBrowser()) {
      throw new Error("IndexedDB is not available")
    }

    try {
      const db = await this.openDB()
      const arrayBuffer = await file.arrayBuffer()

      const pdfData = {
        id,
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified,
        data: arrayBuffer,
        timestamp: Date.now(),
      }

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], "readwrite")
        const store = transaction.objectStore(this.storeName)

        transaction.oncomplete = () => {
          console.log("PDF stored successfully")
          resolve()
        }

        transaction.onerror = () => {
          console.error("Transaction error:", transaction.error)
          reject(transaction.error)
        }

        const request = store.put(pdfData)
        request.onerror = () => {
          console.error("Store put error:", request.error)
          reject(request.error)
        }
      })
    } catch (error) {
      console.error("Error in storePDF:", error)
      throw error
    }
  }

  async getPDF(id: string): Promise<File | null> {
    if (!this.isBrowser()) {
      return null
    }

    try {
      const db = await this.openDB()

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], "readonly")
        const store = transaction.objectStore(this.storeName)
        const request = store.get(id)

        request.onsuccess = () => {
          const result = request.result
          if (result) {
            try {
              const file = new File([result.data], result.name, {
                type: result.type,
                lastModified: result.lastModified,
              })
              resolve(file)
            } catch (error) {
              console.error("Error creating file:", error)
              resolve(null)
            }
          } else {
            resolve(null)
          }
        }

        request.onerror = () => {
          console.error("Get request error:", request.error)
          reject(request.error)
        }
      })
    } catch (error) {
      console.error("Error getting PDF:", error)
      return null
    }
  }

  async deletePDF(id: string): Promise<void> {
    if (!this.isBrowser()) {
      return
    }

    try {
      const db = await this.openDB()

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], "readwrite")
        const store = transaction.objectStore(this.storeName)

        transaction.oncomplete = () => resolve()
        transaction.onerror = () => reject(transaction.error)

        const request = store.delete(id)
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error("Error deleting PDF:", error)
      throw error
    }
  }

  async getAllPDFs(): Promise<string[]> {
    if (!this.isBrowser()) {
      return []
    }

    try {
      const db = await this.openDB()

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], "readonly")
        const store = transaction.objectStore(this.storeName)
        const request = store.getAllKeys()

        request.onsuccess = () => resolve(request.result as string[])
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error("Error getting all PDFs:", error)
      return []
    }
  }

  // Test method to verify storage is working
  async testStorage(): Promise<boolean> {
    if (!this.isBrowser()) {
      return false
    }

    try {
      const db = await this.openDB()
      db.close()
      return true
    } catch (error) {
      console.error("Storage test failed:", error)
      return false
    }
  }
}

// Create singleton instance
let pdfStorageInstance: PDFStorage | null = null

export const getPdfStorage = (): PDFStorage => {
  if (!pdfStorageInstance) {
    pdfStorageInstance = new PDFStorage()
  }
  return pdfStorageInstance
}
