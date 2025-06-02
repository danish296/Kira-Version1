import { type NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/auth"
import { db } from "@/lib/db"

// Retry configuration
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second

// Sleep function for delays
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Available models in order of preference
const GEMINI_MODELS = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"]

async function callGeminiAPI(content: string, model: string, apiKey: string, retryCount = 0): Promise<any> {
  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: content,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
    },
    safetySettings: [
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE",
      },
      {
        category: "HARM_CATEGORY_HATE_SPEECH",
        threshold: "BLOCK_MEDIUM_AND_ABOVE",
      },
    ],
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    },
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: { message: "Unknown error" } }))

    // If it's a 503 (overloaded) or 429 (rate limit), we can retry
    if ((response.status === 503 || response.status === 429) && retryCount < MAX_RETRIES) {
      console.log(
        `Model ${model} is overloaded, retrying in ${RETRY_DELAY * (retryCount + 1)}ms... (attempt ${retryCount + 1}/${MAX_RETRIES})`,
      )
      await sleep(RETRY_DELAY * (retryCount + 1))
      return callGeminiAPI(content, model, apiKey, retryCount + 1)
    }

    throw new Error(`${response.status}: ${errorData.error?.message || "Unknown error"}`)
  }

  return response.json()
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { chatId, content } = await req.json()

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY

    if (!apiKey) {
      console.error("GOOGLE_GENERATIVE_AI_API_KEY not found in environment variables")
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    // Verify chat belongs to user
    const chat = db.chats.findById(chatId)
    if (!chat || chat.userId !== user.id) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 })
    }

    console.log("Attempting to call Gemini API...")

    let lastError: Error | null = null

    // Try each model in order until one works
    for (const model of GEMINI_MODELS) {
      try {
        console.log(`Trying model: ${model}`)
        const data = await callGeminiAPI(content, model, apiKey)

        // Extract the response text with better error handling
        const aiResponse =
          data.candidates?.[0]?.content?.parts?.[0]?.text ||
          "I apologize, but I couldn't generate a proper response. Please try again."

        console.log(`Successfully got response from ${model}`)

        // Save AI response to database
        const assistantMessage = db.messages.create({
          chatId,
          role: "assistant",
          content: aiResponse,
        })

        // Update chat timestamp
        db.chats.update(chatId, { updatedAt: new Date() })

        return NextResponse.json({
          message: assistantMessage,
          model: model,
        })
      } catch (error) {
        console.log(`Model ${model} failed:`, error instanceof Error ? error.message : error)
        lastError = error instanceof Error ? error : new Error(String(error))
        continue // Try next model
      }
    }

    // If all models failed, return the last error
    console.error("All Gemini models failed:", lastError?.message)

    return NextResponse.json(
      {
        error: `All Gemini models are currently unavailable. Last error: ${lastError?.message || "Unknown error"}. Please try again in a few moments.`,
      },
      { status: 503 },
    )
  } catch (error) {
    console.error("Error in chat API:", error)
    return NextResponse.json(
      {
        error: "Internal server error. Please check the console for details.",
      },
      { status: 500 },
    )
  }
}
