"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Copy, Edit3, Check, X } from "lucide-react"
import { CodeBlock } from "./code-block"

interface MessageContentProps {
  content: string
  onEdit?: (newContent: string) => void
  editable?: boolean
}

export function MessageContent({ content, onEdit, editable = false }: MessageContentProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(content)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy message:", error)
    }
  }

  const handleSave = () => {
    if (onEdit) {
      onEdit(editedContent)
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedContent(content)
    setIsEditing(false)
  }

  const handleCodeEdit = (index: number, newCode: string) => {
    // Update the code block in the content
    const parts = parseContent(editedContent)
    if (parts[index] && parts[index].type === "code") {
      parts[index].content = newCode
      const newContent = parts
        .map((part) => {
          if (part.type === "code") {
            return `\`\`\`${part.language}\n${part.content}\n\`\`\``
          }
          return part.content
        })
        .join("")
      setEditedContent(newContent)
      if (onEdit) {
        onEdit(newContent)
      }
    }
  }

  const parseContent = (text: string) => {
    const parts: Array<{
      type: "text" | "code"
      content: string
      language?: string
    }> = []

    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
    let lastIndex = 0
    let match

    while ((match = codeBlockRegex.exec(text)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        const textContent = text.slice(lastIndex, match.index)
        if (textContent.trim()) {
          parts.push({ type: "text", content: textContent })
        }
      }

      // Add code block
      parts.push({
        type: "code",
        content: match[2],
        language: match[1] || "text",
      })

      lastIndex = match.index + match[0].length
    }

    // Add remaining text
    if (lastIndex < text.length) {
      const textContent = text.slice(lastIndex)
      if (textContent.trim()) {
        parts.push({ type: "text", content: textContent })
      }
    }

    return parts
  }

  if (isEditing) {
    return (
      <div className="space-y-2">
        <Textarea
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          className="min-h-24 resize-none"
          placeholder="Edit your message..."
        />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleSave}>
            <Check className="h-3 w-3 mr-1" />
            Save
          </Button>
          <Button variant="outline" size="sm" onClick={handleCancel}>
            <X className="h-3 w-3 mr-1" />
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  const parts = parseContent(content)

  return (
    <div className="group relative">
      <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white dark:bg-zinc-800 rounded-bl-lg border-l border-b border-zinc-200 dark:border-zinc-700 p-1">
        <Button variant="ghost" size="sm" onClick={handleCopy} className="h-6 w-6 p-0" title="Copy message">
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        </Button>
        {editable && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="h-6 w-6 p-0"
            title="Edit message"
          >
            <Edit3 className="h-3 w-3" />
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {parts.map((part, index) => {
          if (part.type === "code") {
            return (
              <CodeBlock
                key={index}
                code={part.content}
                language={part.language}
                onEdit={(newCode) => handleCodeEdit(index, newCode)}
                editable={editable}
              />
            )
          }

          return (
            <div key={index} className="prose prose-zinc dark:prose-invert max-w-none">
              {part.content.split("\n").map((line, lineIndex) => (
                <p key={lineIndex} className={line.trim() === "" ? "h-4" : ""}>
                  {line || "\u00A0"}
                </p>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
