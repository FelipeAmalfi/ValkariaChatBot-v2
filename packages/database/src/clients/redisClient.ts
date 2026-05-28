import Redis from 'ioredis'

let client: Redis | null = null

export function getRedisClient(url: string): Redis {
  if (!client) {
    client = new Redis(url, { lazyConnect: true })
    client.on('error', (err) => console.error('Redis error:', err))
  }
  return client
}
