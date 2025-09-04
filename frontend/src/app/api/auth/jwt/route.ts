import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Create a JWT token with user info using standard jsonwebtoken
    const payload = {
      sub: session.user.id || session.user.email,
      name: session.user.name,
      email: session.user.email,
      picture: session.user.image,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24), // 24 hours
    }

    const token = jwt.sign(payload, process.env.NEXTAUTH_SECRET!, {
      algorithm: 'HS256'
    })

    return NextResponse.json({ token })
  } catch (error) {
    console.log("JWT generation error:", error)
    return NextResponse.json({ error: "Failed to generate token" }, { status: 500 })
  }
}
