"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Paperclip, X, FileText, ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface FileUploadProps {
  onFileUploaded: (fileData: {
    fileUrl: string
    fileName: string
    fileType: string
    fileSize: number
  }) => void
  disabled?: boolean
}

export function FileUpload({ onFileUploaded, disabled }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<{
    fileUrl: string
    fileName: string
    fileType: string
    fileSize: number
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB")
      return
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "text/plain", "application/pdf"]
    if (!allowedTypes.includes(file.type)) {
      alert("File type not supported. Please upload images (JPEG, PNG, GIF, WebP), text files, or PDFs.")
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Upload failed")
      }

      const fileData = await response.json()
      setUploadedFile(fileData)
      onFileUploaded(fileData)
    } catch (error) {
      console.error("Upload error:", error)
      alert(error instanceof Error ? error.message : "Upload failed")
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveFile = () => {
    setUploadedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const isImage = (fileType: string) => fileType.startsWith("image/")

  if (uploadedFile) {
    return (
      <div className="flex items-center gap-2 p-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
        <div className="flex items-center gap-2 flex-1">
          {isImage(uploadedFile.fileType) ? (
            <ImageIcon className="h-4 w-4 text-blue-500" />
          ) : (
            <FileText className="h-4 w-4 text-blue-500" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{uploadedFile.fileName}</p>
            <p className="text-xs text-zinc-500">{formatFileSize(uploadedFile.fileSize)}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleRemoveFile} className="h-6 w-6 p-0">
          <X className="h-3 w-3" />
        </Button>
      </div>
    )
  }

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        accept="image/*,.pdf,.txt"
        className="hidden"
        disabled={disabled || isUploading}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isUploading}
        className={cn("h-8 w-8 p-0", isUploading && "animate-pulse")}
      >
        <Paperclip className="h-4 w-4" />
      </Button>
    </div>
  )
}
