'use client'

import { useTheme } from 'next-themes'
import { useEffect } from 'react'

export function ThemeDebug() {
  const { theme, setTheme, systemTheme, resolvedTheme } = useTheme()

  useEffect(() => {
    console.log('Theme Debug Info:', {
      theme,
      systemTheme,
      resolvedTheme,
      localStorage: typeof window !== 'undefined' ? localStorage.getItem('theme') : null
    })
  }, [theme, systemTheme, resolvedTheme])

  const forceLight = () => {
    setTheme('light')
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', 'light')
    }
  }

  const clearTheme = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('theme')
      window.location.reload()
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border">
      <h3 className="font-bold mb-2">Theme Debug</h3>
      <div className="text-sm space-y-1">
        <p>Current: {theme}</p>
        <p>System: {systemTheme}</p>
        <p>Resolved: {resolvedTheme}</p>
      </div>
      <div className="mt-2 space-x-2">
        <button 
          onClick={forceLight}
          className="px-2 py-1 bg-blue-500 text-white rounded text-xs"
        >
          Force Light
        </button>
        <button 
          onClick={clearTheme}
          className="px-2 py-1 bg-red-500 text-white rounded text-xs"
        >
          Clear & Reload
        </button>
      </div>
    </div>
  )
}
