'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function ThemeDebug() {
  const { theme, setTheme, systemTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      console.log('Theme Debug Info:', {
        theme,
        systemTheme,
        resolvedTheme,
        localStorage: typeof window !== 'undefined' ? localStorage.getItem('theme') : null
      })
    }
  }, [theme, systemTheme, resolvedTheme, mounted])

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

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border">
      <h3 className="font-bold mb-2">Theme Debug</h3>
      <div className="text-sm space-y-1">
        <p>Current: {theme || 'undefined'}</p>
        <p>System: {systemTheme || 'undefined'}</p>
        <p>Resolved: {resolvedTheme || 'undefined'}</p>
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
