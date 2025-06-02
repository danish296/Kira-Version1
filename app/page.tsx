"use client"

import type React from "react"

import { useRef, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Send, Plus, Menu, X, MessageSquare, Settings, UserIcon, LogOut } from "lucide-react"
import { LoginForm } from "@/components/auth/login-form"
import { RegisterForm } from "@/components/auth/register-form"
import { FileUpload } from "@/components/file-upload"
import { CustomLoading } from "@/components/custom-loading"
import { SettingsModal } from "@/components/settings-modal"
import { ProfileModal } from "@/components/profile-modal"
import { ChatMessage } from "@/components/message/chat-message"

interface Chat {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  fileUrl?: string
  fileName?: string
  fileType?: string
  createdAt: string
}

export default function KiraV1() {
  const [user, setUser] = useState<{ id: string; email: string; name: string } | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [authMode, setAuthMode] = useState<"login" | "register">("login")

  const [chats, setChats] = useState<Chat[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<{
    fileUrl: string
    fileName: string
    fileType: string
    fileSize: number
  } | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [showSettings, setShowSettings] = useState(false)
  const [showProfile, setShowProfile] = useState(false)

  // Check authentication on mount
  useEffect(() => {
    checkAuth()
  }, [])

  // Check if mobile on mount and when window resizes
  useEffect(() => {
    const checkIfMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      // On desktop, sidebar starts open; on mobile, starts closed
      if (!mobile && !sidebarOpen) {
        setSidebarOpen(true)
      }
    }
    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)
    return () => window.removeEventListener("resize", checkIfMobile)
  }, [sidebarOpen])

  // Load chats when user is authenticated
  useEffect(() => {
    if (user) {
      loadChats()
    }
  }, [user])

  // Load messages when chat changes
  useEffect(() => {
    if (currentChatId) {
      loadMessages(currentChatId)
    }
  }, [currentChatId])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/me")
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      }
    } catch (error) {
      console.error("Auth check failed:", error)
    } finally {
      setIsAuthLoading(false)
    }
  }

  const loadChats = async () => {
    try {
      const response = await fetch("/api/chats")
      if (response.ok) {
        const data = await response.json()
        setChats(data.chats)
      }
    } catch (error) {
      console.error("Failed to load chats:", error)
    }
  }

  const loadMessages = async (chatId: string) => {
    try {
      const response = await fetch(`/api/chats/${chatId}/messages`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages)
      }
    } catch (error) {
      console.error("Failed to load messages:", error)
    }
  }

  const handleNewChat = async () => {
    try {
      const response = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Chat" }),
      })

      if (response.ok) {
        const data = await response.json()
        setCurrentChatId(data.chat.id)
        setMessages([])
        setInput("")
        setUploadedFile(null)
        await loadChats() // Refresh chats list
      }
    } catch (error) {
      console.error("Failed to create new chat:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading || !currentChatId) return

    const messageContent = input.trim()
    setInput("")

    // Create user message in database
    try {
      const userMessageResponse = await fetch(`/api/chats/${currentChatId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: messageContent,
          fileUrl: uploadedFile?.fileUrl,
          fileName: uploadedFile?.fileName,
          fileType: uploadedFile?.fileType,
        }),
      })

      if (userMessageResponse.ok) {
        const userData = await userMessageResponse.json()
        setMessages((prev) => [...prev, userData.message])
        setUploadedFile(null) // Clear uploaded file after sending
      }

      setIsLoading(true)

      // Get AI response with file context if available
      let aiPrompt = messageContent
      if (uploadedFile) {
        aiPrompt += `\n\n[User has attached a file: ${uploadedFile.fileName} (${uploadedFile.fileType})]`
      }

      const aiResponse = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: currentChatId,
          content: aiPrompt,
        }),
      })

      if (aiResponse.ok) {
        const aiData = await aiResponse.json()
        setMessages((prev) => [...prev, aiData.message])
        await loadChats() // Refresh chats to update timestamps
      } else {
        const errorData = await aiResponse.json()
        throw new Error(errorData.error || "Failed to get AI response")
      }
    } catch (error) {
      console.error("Error:", error)
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : "Unknown error"}. Please try again.`,
        createdAt: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditMessage = async (messageId: string, newContent: string) => {
    if (!currentChatId) return

    try {
      const response = await fetch(`/api/chats/${currentChatId}/messages/${messageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newContent }),
      })

      if (response.ok) {
        // Update local state
        setMessages((prev) => prev.map((msg) => (msg.id === messageId ? { ...msg, content: newContent } : msg)))
      } else {
        console.error("Failed to update message")
      }
    } catch (error) {
      console.error("Error updating message:", error)
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (!currentChatId) return

    try {
      const response = await fetch(`/api/chats/${currentChatId}/messages/${messageId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        // Update local state
        setMessages((prev) => prev.filter((msg) => msg.id !== messageId))
      } else {
        console.error("Failed to delete message")
      }
    } catch (error) {
      console.error("Error deleting message:", error)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      setUser(null)
      setChats([])
      setCurrentChatId(null)
      setMessages([])
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  const handleAuthSuccess = () => {
    checkAuth()
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <CustomLoading />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        {authMode === "login" ? (
          <LoginForm onSuccess={handleAuthSuccess} onToggleMode={() => setAuthMode("register")} />
        ) : (
          <RegisterForm onSuccess={handleAuthSuccess} onToggleMode={() => setAuthMode("login")} />
        )}
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "flex flex-col bg-zinc-900 transition-all duration-300 ease-in-out z-50",
          // Mobile: Fixed positioning with transform
          isMobile && "fixed inset-y-0 left-0 w-72",
          isMobile && sidebarOpen && "translate-x-0",
          isMobile && !sidebarOpen && "-translate-x-full",
          // Desktop: Flexible width with smooth transitions
          !isMobile && sidebarOpen && "w-72",
          !isMobile && !sidebarOpen && "w-0 overflow-hidden",
        )}
      >
        {/* Sidebar Header */}
        <div className="flex h-14 items-center justify-between border-b border-zinc-800 px-4 flex-shrink-0">
          <h1 className="text-lg font-semibold text-white whitespace-nowrap">Kira V1</h1>
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
              className="text-white hover:bg-zinc-800 flex-shrink-0"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-auto p-4 min-w-0">
          <Button
            variant="outline"
            className="mb-4 w-full justify-start gap-2 border-white/20 bg-white/10 text-white hover:bg-white/20 whitespace-nowrap"
            onClick={handleNewChat}
          >
            <Plus className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">New chat</span>
          </Button>

          <div className="mt-6">
            <h2 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-zinc-400 whitespace-nowrap">
              Recent chats
            </h2>
            <div className="space-y-1">
              {chats.map((chat) => (
                <Button
                  key={chat.id}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-2 text-zinc-300 hover:bg-white/10 hover:text-white",
                    currentChatId === chat.id && "bg-white/10 text-white",
                  )}
                  onClick={() => setCurrentChatId(chat.id)}
                >
                  <MessageSquare className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate text-left">{chat.title}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="border-t border-zinc-800 p-4 flex-shrink-0">
          <div className="mb-2 text-xs text-zinc-400 truncate">Signed in as {user.name}</div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-zinc-300 hover:bg-white/10 hover:text-white mb-1"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">Settings</span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-zinc-300 hover:bg-white/10 hover:text-white mb-1"
            onClick={() => setShowProfile(true)}
          >
            <UserIcon className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">Profile</span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-zinc-300 hover:bg-white/10 hover:text-white"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">Sign out</span>
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 transition-all duration-300 ease-in-out">
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-4 flex-shrink-0 bg-white dark:bg-zinc-900">
          <div className="flex items-center min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="mr-3 flex-shrink-0 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold truncate">Kira V1 Chat</h1>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-hidden bg-white dark:bg-zinc-900">
          <ScrollArea className="h-full">
            <div className="flex flex-col min-h-full">
              {!currentChatId ? (
                <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
                  <div className="rounded-full bg-emerald-100 p-6 dark:bg-emerald-900/20 mb-6">
                    <MessageSquare className="h-12 w-12 text-emerald-600" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Welcome to Kira V1</h3>
                  <p className="max-w-md text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
                    Your intelligent AI assistant powered by Google's Gemini. Start a conversation to get help with
                    anything from creative writing to technical questions.
                  </p>
                  <Button onClick={handleNewChat} className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Start Your First Chat
                  </Button>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
                  <div className="rounded-full bg-emerald-100 p-4 dark:bg-emerald-900/20 mb-6">
                    <MessageSquare className="h-8 w-8 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">How can Kira help you today?</h3>
                  <p className="max-w-sm text-sm text-zinc-500 leading-relaxed">
                    Ask questions, upload files for analysis, get creative assistance, or just have a conversation.
                  </p>
                </div>
              ) : (
                <div className="flex-1">
                  {messages.map((message) => (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      onEdit={handleEditMessage}
                      onDelete={handleDeleteMessage}
                      editable={true}
                    />
                  ))}
                  {isLoading && (
                    <div className="px-4 py-6 md:px-8 bg-zinc-50 dark:bg-zinc-800/50">
                      <div className="mx-auto flex max-w-3xl gap-4">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-600 text-white">
                          <MessageSquare className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <CustomLoading />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          </ScrollArea>
        </div>

        {/* Input Area */}
        <div className="border-t border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 flex-shrink-0">
          <div className="mx-auto max-w-4xl">
            {uploadedFile && (
              <div className="mb-3">
                <div className="flex items-center gap-2 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                  <span className="text-sm font-medium truncate flex-1">{uploadedFile.fileName}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setUploadedFile(null)}
                    className="h-6 w-6 p-0 flex-shrink-0 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
            <form onSubmit={handleSubmit} className="relative">
              <div className="flex items-end gap-3">
                <FileUpload onFileUploaded={setUploadedFile} disabled={isLoading || !currentChatId} />
                <div className="flex-1 relative">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={currentChatId ? "Message Kira..." : "Start a new chat first"}
                    className="min-h-12 border-zinc-300 pr-12 shadow-sm focus-visible:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:focus-visible:ring-emerald-400 transition-colors"
                    disabled={isLoading || !currentChatId}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={isLoading || !input.trim() || !currentChatId}
                    className="absolute right-1.5 top-1.5 h-9 w-9 rounded-md bg-emerald-600 p-0 hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    <Send className="h-4 w-4 text-white" />
                  </Button>
                </div>
              </div>
            </form>
            <p className="mt-3 text-center text-xs text-zinc-500 leading-relaxed">
              Kira V1 may produce inaccurate information about people, places, or facts.
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} user={user} />
      <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} user={user} />
    </div>
  )
}
