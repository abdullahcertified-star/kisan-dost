/**
 * Production-grade In-Memory Sliding Window Rate Limiter
 * Protects AI and Auth endpoints from automated DDoS, credential stuffing, and quota exhaustion.
 */

interface RateLimitRecord {
  timestamps: number[];
}

const ipRequestMap = new Map<string, RateLimitRecord>();

// Cleanup stale entries every 5 minutes to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of ipRequestMap.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < 300000);
      if (record.timestamps.length === 0) {
        ipRequestMap.delete(ip);
      }
    }
  }, 300000);
}

export function checkRateLimit(
  clientIp: string,
  maxRequests: number = 30,
  windowSeconds: number = 60
): { allowed: boolean; remaining: number; retryAfterSeconds: number; retryAfter: number } {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  let record = ipRequestMap.get(clientIp);
  if (!record) {
    record = { timestamps: [] };
    ipRequestMap.set(clientIp, record);
  }

  // Filter out timestamps older than the sliding window
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (record.timestamps.length >= maxRequests) {
    const oldestTimestamp = record.timestamps[0];
    const retryAfterMs = windowMs - (now - oldestTimestamp);
    const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
      retryAfter: retryAfterSeconds,
    };
  }

  // Record this request
  record.timestamps.push(now);

  return {
    allowed: true,
    remaining: maxRequests - record.timestamps.length,
    retryAfterSeconds: 0,
    retryAfter: 0,
  };
}

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}
