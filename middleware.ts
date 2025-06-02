import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyToken } from "@/lib/auth"

export async function middleware(request: NextRequest) {
  // Only protect API routes that require authentication
  if (
    request.nextUrl.pathname.startsWith("/api/chats") ||
    request.nextUrl.pathname.startsWith("/api/chat") ||
    request.nextUrl.pathname.startsWith("/api/upload")
  ) {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Add user info to headers for API routes
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set("x-user-id", payload.userId)
    requestHeaders.set("x-user-email", payload.email)

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/api/chats/:path*", "/api/chat", "/api/upload"],
}
