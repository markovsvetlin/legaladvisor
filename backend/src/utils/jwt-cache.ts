import jwt from 'jsonwebtoken'
import { redis } from './redis'

export interface CachedUser {
  sub: string
  name: string
  email: string
  picture: string
}

export class JwtCache {

  /**
   * Get user data from cache or decode JWT if not cached
   */
  async getUser(token: string, secret: string): Promise<CachedUser | null> {
    try {
      const decoded = jwt.verify(token, secret) as any
      
      const userCacheKey = `user:${decoded.sub || decoded.email}`
      console.log('🔍 User Cache Key:', userCacheKey)
      
      // Try to get from cache first
      const cachedData = await redis.get(userCacheKey)
      
      if (cachedData) {
        console.log('✅ JWT Cache HIT')
        return JSON.parse(cachedData) as CachedUser
      }
      
      console.log('❌ JWT Cache MISS - caching user data')
      
      const user: CachedUser = {
        sub: decoded.sub,
        name: decoded.name,
        email: decoded.email,
        picture: decoded.picture
      }
      
      // Cache TTL = JWT expiration time (max 30 days)
      const ttl = this.calculateTtl(decoded)
      await redis.set(userCacheKey, JSON.stringify(user), ttl)
      
      console.log(`✅ User cached for ${ttl} seconds`)
      
      return user
      
    } catch (error) {
      console.log('❌ JWT verification failed:', error)
      return null
    }
  }

  /**
   * Calculate TTL based on JWT expiration (synced with token expiry)
   */
  private calculateTtl(decoded: any): number {
    if (decoded.exp) {
      const now = Math.floor(Date.now() / 1000)
      const jwtTtl = decoded.exp - now
      
      // Return JWT TTL, but max 30 days (2,592,000 seconds)
      const maxTtl = 30 * 24 * 60 * 60 // 30 days in seconds
      return Math.min(jwtTtl, maxTtl)
    }
    // Default 15 minutes if no expiration in JWT
    return 900
  }

  /**
   * Invalidate user cache by JWT token
   */
  async invalidateToken(token: string, secret: string): Promise<boolean> {
    try {
      const decoded = jwt.verify(token, secret) as any
      const userCacheKey = `user:${decoded.sub || decoded.email}`
      
      const result = await redis.del(userCacheKey)
      console.log('🗑️ Invalidated user cache:', userCacheKey)
      return result
    } catch (error) {
      console.log('❌ Failed to invalidate token cache:', error)
      return false
    }
  }

  /**
   * Invalidate user cache by user ID/email (more efficient)
   */
  async invalidateUser(userId: string): Promise<boolean> {
    const userCacheKey = `user:${userId}`
    const result = await redis.del(userCacheKey)
    console.log('🗑️ Invalidated user cache:', userCacheKey)
    return result
  }
}

// Export singleton instance
export const jwtCache = new JwtCache()
