import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Kira V1 - AI Assistant",
  description:
    "Your intelligent AI assistant powered by Google's Gemini. Chat, upload files, and get help with anything.",
  keywords: ["AI", "chatbot", "assistant", "Gemini", "artificial intelligence"],
  authors: [{ name: "Kira V1 Team" }],
  openGraph: {
    title: "Kira V1 - AI Assistant",
    description: "Your intelligent AI assistant powered by Google's Gemini",
    type: "website",
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
