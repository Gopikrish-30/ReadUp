import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "../styles/globals.css"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Reading Tracker - Track Your Reading Journey",
  description:
    "A modern reading tracker app to manage books, take notes, create flashcards, and track your reading progress.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
          storageKey="reading-tracker-theme"
          forcedTheme="light"
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
