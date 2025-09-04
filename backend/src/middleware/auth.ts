import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

declare global {
  namespace Express {
    interface Request {
      user?: {
        sub: string
        name: string
        email: string
        picture: string
      }
    }
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No authorization header or invalid format')
      return res.status(401).json({ error: 'No token provided' })
    }

    const token = authHeader.substring(7)
    const secret = process.env.NEXTAUTH_SECRET
    
    if (!secret) {
      console.log('❌ NEXTAUTH_SECRET not configured')
      return res.status(500).json({ error: 'Server configuration error' })
    }

    console.log('🔍 Attempting to verify token...')
    console.log('Token length:', token.length)
    console.log('Secret configured:', !!secret)

    const decoded = jwt.verify(token, secret) as any
    console.log('✅ Token decoded successfully:', { sub: decoded.sub, name: decoded.name, email: decoded.email })
    
    req.user = {
      sub: decoded.sub,
      name: decoded.name,
      email: decoded.email,
      picture: decoded.picture
    }
    
    next()
  } catch (error) {
    console.log('❌ Token verification failed:', error)
    return res.status(401).json({ error: 'Invalid token' })
  }
}
