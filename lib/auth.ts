import { jwtVerify, SignJWT } from "jose"
import { cookies } from "next/headers"
import bcrypt from "bcryptjs"
import { db } from "./db"

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-change-this-immediately"
)

// Rate limiting for login attempts
const loginAttempts = new Map<string, { count: number; lastAttempt: Date }>()
const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes

export interface User {
  id: string
  email: string
  name: string
  createdAt: Date
  lastLoginAt?: Date
}

export interface AuthPayload {
  userId: string
  email: string
  iat?: number
  exp?: number
}

// Clean up old login attempts
function cleanupLoginAttempts() {
  const now = new Date()
  for (const [email, data] of loginAttempts.entries()) {
    if (now.getTime() - data.lastAttempt.getTime() > LOCKOUT_DURATION) {
      loginAttempts.delete(email)
    }
  }
}

export function isEmailRateLimited(email: string): boolean {
  cleanupLoginAttempts()
  const attempts = loginAttempts.get(email)
  if (!attempts) return false
  
  const now = new Date()
  if (now.getTime() - attempts.lastAttempt.getTime() > LOCKOUT_DURATION) {
    loginAttempts.delete(email)
    return false
  }
  
  return attempts.count >= MAX_LOGIN_ATTEMPTS
}

export function recordFailedLogin(email: string): void {
  const now = new Date()
  const existing = loginAttempts.get(email)
  
  if (existing && now.getTime() - existing.lastAttempt.getTime() < LOCKOUT_DURATION) {
    existing.count++
    existing.lastAttempt = now
  } else {
    loginAttempts.set(email, { count: 1, lastAttempt: now })
  }
}

export function clearFailedLogins(email: string): void {
  loginAttempts.delete(email)
}

export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length < 6) {
    throw new Error("Password must be at least 6 characters long")
  }
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  if (!password || !hashedPassword) return false
  try {
    return await bcrypt.compare(password, hashedPassword)
  } catch (error) {
    console.error("Password verification error:", error)
    return false
  }
}

export async function createToken(payload: { userId: string; email: string }): Promise<string> {
  if (!payload.userId || !payload.email) {
    throw new Error("Invalid payload for token creation")
  }
  
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<AuthPayload | null> {
  if (!token) return null
  
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as AuthPayload
  } catch (error) {
    console.error("Token verification error:", error)
    return null
  }
}

export async function getUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) return null

    const payload = await verifyToken(token)
    if (!payload) return null

    // Fetch user from database
    const user = await db.users.findById(payload.userId)
    if (!user) return null

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    }
  } catch (error) {
    console.error("Get user error:", error)
    return null
  }
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePassword(password: string): { isValid: boolean; message?: string } {
  if (!password) return { isValid: false, message: "Password is required" }
  if (password.length < 6) return { isValid: false, message: "Password must be at least 6 characters" }
  if (password.length > 128) return { isValid: false, message: "Password too long" }
  
  // Check for at least one number and one letter
  const hasNumber = /\d/.test(password)
  const hasLetter = /[a-zA-Z]/.test(password)
  
  if (!hasNumber || !hasLetter) {
    return { isValid: false, message: "Password must contain at least one letter and one number" }
  }
  
  return { isValid: true }
}
