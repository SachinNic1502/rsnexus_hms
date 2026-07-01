import { NextRequest, NextResponse } from 'next/server'

interface RateLimitStore {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitStore>()

const CLEANUP_INTERVAL = 60000 // 1 minute
const DEFAULT_LIMIT = 100 // requests per window
const DEFAULT_WINDOW = 60000 // 1 minute window

// Cleanup expired entries
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}, CLEANUP_INTERVAL)

export function getIdentifier(request: NextRequest): string {
  // Try to get user ID from auth token first
  const authHeader = request.headers.get('authorization')
  if (authHeader) {
    return `user:${authHeader}`
  }
  
  // Fall back to IP address
  const ip = request.headers.get('x-forwarded-for') || 
            request.headers.get('x-real-ip') || 
            'unknown'
  return `ip:${ip}`
}

export function rateLimit(
  identifier: string,
  limit: number = DEFAULT_LIMIT,
  windowMs: number = DEFAULT_WINDOW
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const entry = rateLimitStore.get(identifier)
  
  if (!entry || entry.resetTime < now) {
    // Create new entry or reset expired one
    const resetTime = now + windowMs
    rateLimitStore.set(identifier, { count: 1, resetTime })
    return { allowed: true, remaining: limit - 1, resetTime }
  }
  
  // Update existing entry
  if (entry.count < limit) {
    entry.count++
    return { allowed: true, remaining: limit - entry.count, resetTime: entry.resetTime }
  }
  
  // Rate limit exceeded
  return { allowed: false, remaining: 0, resetTime: entry.resetTime }
}

export function rateLimitMiddleware(
  request: NextRequest,
  limit: number = DEFAULT_LIMIT,
  windowMs: number = DEFAULT_WINDOW
): NextResponse | null {
  const identifier = getIdentifier(request)
  const result = rateLimit(identifier, limit, windowMs)
  
  if (!result.allowed) {
    return NextResponse.json(
      { 
        error: 'Too many requests', 
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000) 
      },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': result.resetTime.toString(),
          'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
        }
      }
    )
  }
  
  // Add rate limit headers to successful responses
  const response = NextResponse.next()
  response.headers.set('X-RateLimit-Limit', limit.toString())
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
  response.headers.set('X-RateLimit-Reset', result.resetTime.toString())
  
  return null
}
