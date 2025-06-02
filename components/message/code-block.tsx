"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Copy, Edit3, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface CodeBlockProps {
  code: string
  language?: string
  onEdit?: (newCode: string) => void
  editable?: boolean
}

export function CodeBlock({ code, language = "javascript", onEdit, editable = false }: CodeBlockProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedCode, setEditedCode] = useState(code)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy code:", error)
    }
  }

  const handleSave = () => {
    if (onEdit) {
      onEdit(editedCode)
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedCode(code)
    setIsEditing(false)
  }

  const getLanguageColor = (lang: string) => {
    const colors: Record<string, string> = {
      javascript: "text-yellow-600",
      typescript: "text-blue-600",
      python: "text-green-600",
      html: "text-orange-600",
      css: "text-purple-600",
      json: "text-gray-600",
      bash: "text-gray-800",
      sql: "text-pink-600",
    }
    return colors[lang.toLowerCase()] || "text-gray-600"
  }

  if (isEditing) {
    return (
      <div className="relative bg-zinc-900 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between bg-zinc-800 px-4 py-2 border-b border-zinc-700">
          <span className={cn("text-xs font-medium", getLanguageColor(language))}>{language}</span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleSave} className="h-6 text-green-400 hover:text-green-300">
              <Check className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleCancel} className="h-6 text-red-400 hover:text-red-300">
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <Textarea
          value={editedCode}
          onChange={(e) => setEditedCode(e.target.value)}
          className="min-h-32 bg-zinc-900 border-0 text-zinc-100 font-mono text-sm resize-none focus-visible:ring-0"
          style={{ fontFamily: "Consolas, Monaco, 'Courier New', monospace" }}
        />
      </div>
    )
  }

  return (
    <div className="relative bg-zinc-900 rounded-lg overflow-hidden group">
      <div className="flex items-center justify-between bg-zinc-800 px-4 py-2">
        <span className={cn("text-xs font-medium", getLanguageColor(language))}>{language}</span>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-6 text-zinc-400 hover:text-zinc-200"
            title="Copy code"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          </Button>
          {editable && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="h-6 text-zinc-400 hover:text-zinc-200"
              title="Edit code"
            >
              <Edit3 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
      <pre className="p-4 overflow-x-auto">
        <code className="text-zinc-100 text-sm font-mono leading-relaxed">{code}</code>
      </pre>
    </div>
  )
}
