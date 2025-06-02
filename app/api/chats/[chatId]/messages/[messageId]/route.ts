import { type NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/auth"
import { db } from "@/lib/db"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ chatId: string; messageId: string }> }) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { chatId, messageId } = await params
    const { content } = await req.json()

    const chat = db.chats.findById(chatId)
    if (!chat || chat.userId !== user.id) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 })
    }

    // Find and update the message
    const messages = db.messages.findByChatId(chatId)
    const messageIndex = messages.findIndex((m) => m.id === messageId)

    if (messageIndex === -1) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 })
    }

    // Update the message content
    messages[messageIndex].content = content

    return NextResponse.json({ message: messages[messageIndex] })
  } catch (error) {
    console.error("Update message error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ chatId: string; messageId: string }> }) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { chatId, messageId } = await params

    const chat = db.chats.findById(chatId)
    if (!chat || chat.userId !== user.id) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 })
    }

    // Find and remove the message
    const messages = db.messages.findByChatId(chatId)
    const messageIndex = messages.findIndex((m) => m.id === messageId)

    if (messageIndex === -1) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 })
    }

    // Remove the message
    messages.splice(messageIndex, 1)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete message error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
