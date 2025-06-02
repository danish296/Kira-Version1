import { type NextRequest, NextResponse } from "next/server"
import { verifyPassword, createToken, isEmailRateLimited, recordFailedLogin, clearFailedLogins, validateEmail } from "@/lib/auth"
import { db } from "@/lib/db"
import { cookies } from "next/headers"

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    if (!validateEmail(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // Check rate limiting
    if (isEmailRateLimited(email)) {
      return NextResponse.json(
        { error: "Too many failed login attempts. Please try again later." },
        { status: 429 }
      )
    }

    // Find user
    const user = await db.users.findByEmail(email.toLowerCase())
    if (!user) {
      recordFailedLogin(email)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password)
    if (!isValid) {
      recordFailedLogin(email)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Clear failed login attempts on successful login
    clearFailedLogins(email)
    
    // Update last login
    await db.users.updateLastLogin(user.id)

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
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
