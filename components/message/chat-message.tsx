"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { MessageSquare, UserIcon, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MessageContent } from "./message-content"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  fileUrl?: string
  fileName?: string
  fileType?: string
  createdAt: string
}

interface ChatMessageProps {
  message: Message
  onEdit?: (messageId: string, newContent: string) => void
  onDelete?: (messageId: string) => void
  editable?: boolean
}

export function ChatMessage({ message, onEdit, onDelete, editable = false }: ChatMessageProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleEdit = (newContent: string) => {
    if (onEdit) {
      onEdit(message.id, newContent)
    }
  }

  const handleDelete = () => {
    if (onDelete) {
      onDelete(message.id)
    }
    setIsMenuOpen(false)
  }

  const isImage = (fileType: string) => fileType?.startsWith("image/")

  return (
    <div
      className={cn(
        "px-4 py-6 md:px-8 group relative",
        message.role === "assistant" ? "bg-zinc-50 dark:bg-zinc-800/50" : "",
      )}
    >
      <div className="mx-auto flex max-w-3xl gap-4">
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md",
            message.role === "assistant" ? "bg-emerald-600 text-white" : "bg-zinc-700 text-white dark:bg-zinc-800",
          )}
        >
          {message.role === "assistant" ? <MessageSquare className="h-4 w-4" /> : <UserIcon className="h-4 w-4" />}
        </div>

        <div className="flex-1 break-words min-w-0">
          <MessageContent content={message.content} onEdit={handleEdit} editable={editable} />

          {message.fileUrl && (
            <div className="mt-3">
              {isImage(message.fileType || "") ? (
                <img
                  src={message.fileUrl || "/placeholder.svg"}
                  alt={message.fileName}
                  className="max-w-sm rounded-lg border shadow-sm"
                />
              ) : (
                <div className="flex items-center gap-2 p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg max-w-sm border">
                  <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900 rounded flex items-center justify-center">
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                      {message.fileName?.split(".").pop()?.toUpperCase() || "FILE"}
                    </span>
                  </div>
                  <span className="text-sm font-medium">{message.fileName}</span>
                </div>
              )}
            </div>
          )}

          <div className="mt-2 text-xs text-zinc-500">
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>

        {(editable || onDelete) && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onDelete && (
                  <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                    Delete message
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  )
}
