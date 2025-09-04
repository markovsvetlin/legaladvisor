import { createClient, RedisClientType } from 'redis'

class RedisClient {
  private client: RedisClientType | null = null
  private connected: boolean = false

  async connect() {
    if (this.connected && this.client) {
      return this.client
    }

    try {
      // Connect to local Redis (default: localhost:6379)
      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      })

      this.client.on('error', (err) => {
        console.log('❌ Redis Client Error:', err)
        this.connected = false
      })

      this.client.on('connect', () => {
        console.log('✅ Connected to Redis')
        this.connected = true
      })

      await this.client.connect()
      return this.client
    } catch (error) {
      console.log('❌ Failed to connect to Redis:', error)
      this.connected = false
      return null
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.client || !this.connected) {
      console.log('⚠️ Redis not connected, skipping cache read')
      return null
    }
    
    try {
      return await this.client.get(key)
    } catch (error) {
      console.log('❌ Redis GET error:', error)
      return null
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    if (!this.client || !this.connected) {
      console.log('⚠️ Redis not connected, skipping cache write')
      return false
    }

    try {
      if (ttlSeconds) {
        await this.client.setEx(key, ttlSeconds, value)
      } else {
        await this.client.set(key, value)
      }
      return true
    } catch (error) {
      console.log('❌ Redis SET error:', error)
      return false
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.client || !this.connected) {
      return false
    }

    try {
      await this.client.del(key)
      return true
    } catch (error) {
      console.log('❌ Redis DEL error:', error)
      return false
    }
  }

  isConnected(): boolean {
    return this.connected
  }
}

// Export a single instance
export const redis = new RedisClient()
