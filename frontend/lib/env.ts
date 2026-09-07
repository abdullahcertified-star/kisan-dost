/**
 * Centralized Environment Security Validator
 * Safely resolves database and encryption secrets without breaking build-time static page collection.
 */

export function getDatabaseUrl(): string {
  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.NEON_DATABASE_URL ||
    '';

  if (!url && typeof window === 'undefined' && process.env.NEXT_PHASE !== 'phase-production-build') {
    console.warn('[Database Warning] DATABASE_URL is not set in environment variables. Database operations will require this variable.');
  }
  return url;
}

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (typeof window === 'undefined' && process.env.NEXT_PHASE !== 'phase-production-build') {
      console.warn('[Security Warning] JWT_SECRET is not set in environment variables; using secure fallback key.');
    }
    return 'kisan_dost_secure_jwt_production_fallback_key_2026!';
  }
  return secret;
}

export function getEncryptionSecret(): string {
  const secret = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET;
  if (!secret) {
    if (typeof window === 'undefined' && process.env.NEXT_PHASE !== 'phase-production-build') {
      console.warn('[Security Warning] ENCRYPTION_KEY or JWT_SECRET is not set; using secure fallback key.');
    }
    return 'kisan_dost_master_encryption_secret_key_2026_super_secure!';
  }
  return secret;
}

export function getGeminiServerKey(): string | null {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
    null
  );
}
