import { type NextRequest, NextResponse } from "next/server"
import { hashPassword, createToken, validateEmail, validatePassword } from "@/lib/auth"
import { db } from "@/lib/db-vercel" // Changed import
import { cookies } from "next/headers"

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json()

    // Validate input
    if (!email || !password || !name) {
      return NextResponse.json({ error: "Email, password, and name are required" }, { status: 400 })
    }

    if (!validateEmail(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      return NextResponse.json({ error: passwordValidation.message }, { status: 400 })
    }

    if (name.length < 2 || name.length > 50) {
      return NextResponse.json({ error: "Name must be between 2 and 50 characters" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await db.users.findByEmail(email.toLowerCase())
    if (existingUser) {
      return NextResponse.json({ error: "User already exists with this email" }, { status: 400 })
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password)
    const user = await db.users.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      name: name.trim(),
    })

    // Create token
    const token = await createToken({ userId: user.id, email: user.email })

    // Set secure cookie
    const cookieStore = await cookies()
    cookieStore.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
