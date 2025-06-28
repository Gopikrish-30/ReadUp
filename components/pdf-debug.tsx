'use client'

import { useEffect, useState } from 'react'
import { usePdfStorage } from '@/hooks/use-pdf-storage'

interface PDFDebugProps {
  bookId: string
}

export function PDFDebug({ bookId }: PDFDebugProps) {
  const { storage: pdfStorage, isReady } = usePdfStorage()
  const [debugInfo, setDebugInfo] = useState<any>({})

  useEffect(() => {
    const checkPDFStatus = async () => {
      if (!isReady || !pdfStorage) {
        setDebugInfo({ error: 'PDF storage not ready' })
        return
      }

      try {
        // Check if IndexedDB is working
        const storageWorking = await pdfStorage.testStorage()
        
        // Check if PDF exists
        const pdfFile = await pdfStorage.getPDF(bookId)
        
        // Get all stored PDFs
        const allPDFs = await pdfStorage.getAllPDFs()
        
        // Check localStorage for book data
        const books = JSON.parse(localStorage.getItem('userBooks') || '[]')
        const book = books.find((b: any) => b.id.toString() === bookId)

        setDebugInfo({
          storageWorking,
          pdfExists: !!pdfFile,
          pdfFileSize: pdfFile?.size || 0,
          pdfFileName: pdfFile?.name || 'N/A',
          allStoredPDFs: allPDFs,
          bookExists: !!book,
          bookData: book,
          isReady,
          timestamp: new Date().toISOString()
        })
      } catch (error) {
        setDebugInfo({ error: error.message })
      }
    }

    checkPDFStatus()
  }, [bookId, isReady, pdfStorage])

  const clearStorage = async () => {
    if (pdfStorage) {
      try {
        await pdfStorage.deletePDF(bookId)
        alert('PDF deleted from storage. Please re-upload.')
        window.location.reload()
      } catch (error) {
        alert('Error deleting PDF: ' + error.message)
      }
    }
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border rounded-lg p-4 shadow-lg max-w-md text-xs z-50">
      <h3 className="font-bold mb-2">PDF Debug Info</h3>
      <div className="space-y-1">
        <div>Storage Ready: {debugInfo.isReady ? '✅' : '❌'}</div>
        <div>Storage Working: {debugInfo.storageWorking ? '✅' : '❌'}</div>
        <div>PDF Exists: {debugInfo.pdfExists ? '✅' : '❌'}</div>
        <div>Book Exists: {debugInfo.bookExists ? '✅' : '❌'}</div>
        {debugInfo.pdfFileName && (
          <div>PDF File: {debugInfo.pdfFileName}</div>
        )}
        {debugInfo.pdfFileSize > 0 && (
          <div>Size: {(debugInfo.pdfFileSize / 1024 / 1024).toFixed(2)} MB</div>
        )}
        <div>Stored PDFs: {debugInfo.allStoredPDFs?.length || 0}</div>
        {debugInfo.error && (
          <div className="text-red-600">Error: {debugInfo.error}</div>
        )}
      </div>
      <button 
        onClick={clearStorage}
        className="mt-2 px-2 py-1 bg-red-500 text-white rounded text-xs"
      >
        Clear PDF Storage
      </button>
    </div>
  )
}
