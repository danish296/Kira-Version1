import { type NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: NextRequest, { params }: { params: Promise<{ chatId: string }> }) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { chatId } = await params
    const chat = db.chats.findById(chatId)

    if (!chat || chat.userId !== user.id) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 })
    }

    const messages = db.messages.findByChatId(chatId)
    return NextResponse.json({ messages })
  } catch (error) {
    console.error("Get messages error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ chatId: string }> }) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { chatId } = await params
    const { content, fileUrl, fileName, fileType } = await req.json()

    const chat = db.chats.findById(chatId)
    if (!chat || chat.userId !== user.id) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 })
    }

    // Create user message
    const userMessage = db.messages.create({
      chatId,
      role: "user",
      content,
      fileUrl,
      fileName,
      fileType,
    })

    // Update chat title if it's the first message
    const messages = db.messages.findByChatId(chatId)
    if (messages.length === 1) {
      const title = content.slice(0, 50) + (content.length > 50 ? "..." : "")
      db.chats.update(chatId, { title })
    }

    return NextResponse.json({ message: userMessage })
  } catch (error) {
    console.error("Create message error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
