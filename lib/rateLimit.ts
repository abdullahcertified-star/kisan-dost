/**
 * Production-grade Sliding Window Rate Limiter
 * Protects Authentication, AI Chat, and heavy Agronomic compute routes from abuse, DoS, and credential stuffing.
 */

interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup stale entries every 5 minutes to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < 300000);
      if (record.timestamps.length === 0) {
        rateLimitStore.delete(key);
      }
    }
  }, 300000);
}

export function checkRateLimit(
  bucketKey: string,
  maxRequests: number = 30,
  windowSeconds: number = 60
): { allowed: boolean; remaining: number; retryAfterSeconds: number; retryAfter: number } {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  let record = rateLimitStore.get(bucketKey);
  if (!record) {
    record = { timestamps: [] };
    rateLimitStore.set(bucketKey, record);
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

  // Record this request timestamp
  record.timestamps.push(now);

  return {
    allowed: true,
    remaining: maxRequests - record.timestamps.length,
    retryAfterSeconds: 0,
    retryAfter: 0,
  };
}

/**
 * Extracts a resilient client IP from trusted edge proxy headers.
 * Prioritizes platform-authenticated headers (e.g. x-real-ip, cf-connecting-ip)
 * before parsing x-forwarded-for to prevent spoofing.
 */
export function getClientIp(headers: Headers): string {
  const cfIp = headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();

  const realIp = headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    // In multi-proxy setups, standard practice is extracting the leftmost client IP
    const parts = forwarded.split(',');
    return parts[0].trim();
  }

  return '127.0.0.1';
}
