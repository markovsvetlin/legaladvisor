import { Request, Response, NextFunction } from 'express'
import { jwtCache } from '../utils/jwt-cache'

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

    console.log('🔍 Attempting to get user from cache or verify token...')
    console.log('Token length:', token.length)
    console.log('Secret configured:', !!secret)

    // Use JWT cache - will hit Redis or decode if not cached
    const user = await jwtCache.getUser(token, secret)
    
    if (!user) {
      console.log('❌ Failed to get user data')
      return res.status(401).json({ error: 'Invalid token' })
    }

    console.log('✅ User authenticated:', { sub: user.sub, name: user.name, email: user.email })
    req.user = user
    
    next()
  } catch (error) {
    console.log('❌ Token verification failed:', error)
    return res.status(401).json({ error: 'Invalid token' })
  }
}
