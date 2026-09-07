import crypto from 'crypto';

/**
 * Centralized Environment Security Validator
 * Safely resolves database, JWT, and encryption secrets.
 * Strictly forbids static/hardcoded secret fallbacks in production runtime.
 */

let devEphemeralJwtSecret: string | null = null;
let devEphemeralEncSecret: string | null = null;

function isBuildTime(): boolean {
  return (
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.npm_lifecycle_event === 'build' ||
    (typeof process.argv !== 'undefined' &&
      process.argv.some((arg) => arg.includes('build') || arg.includes('next-build')))
  );
}

export function getDatabaseUrl(): string {
  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.NEON_DATABASE_URL ||
    '';

  if (url && url.trim().length > 0) {
    return url.trim();
  }

  // During Next.js static collection/build phase, provide safe compilation placeholder
  if (isBuildTime()) {
    return 'postgresql://build-placeholder:placeholder@localhost/placeholder_db?sslmode=require';
  }

  if (typeof window === 'undefined') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[Security Failure] Required environment variable DATABASE_URL is not configured in production runtime.');
    }
    console.warn('[Database Warning] DATABASE_URL is not set in environment variables.');
  }

  return '';
}

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.trim().length > 0) {
    return secret.trim();
  }

  // If DATABASE_URL is configured, derive a deterministic 256-bit secret from it
  const dbUrl =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.NEON_DATABASE_URL;

  if (dbUrl && dbUrl.trim().length > 0) {
    return crypto
      .createHmac('sha256', dbUrl.trim())
      .update('kisan_dost_jwt_signing_key_2026')
      .digest('hex');
  }

  // During Next.js static build phase, provide build-safe placeholder
  if (isBuildTime()) {
    return 'build-phase-temporary-collection-token';
  }

  // In production runtime without database, fail safely
  if (process.env.NODE_ENV === 'production') {
    throw new Error('[Security Failure] Required environment variable JWT_SECRET is not configured in production runtime.');
  }

  // Development runtime: generate ephemeral, cryptographically random 256-bit token
  if (!devEphemeralJwtSecret) {
    devEphemeralJwtSecret = crypto.randomBytes(32).toString('hex');
    console.warn('[Security Warning] JWT_SECRET is missing. An ephemeral dev-only secret was generated for this process.');
  }
  return devEphemeralJwtSecret;
}

export function getEncryptionSecret(): string {
  const secret = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET;
  if (secret && secret.trim().length > 0) {
    return secret.trim();
  }

  const dbUrl =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.NEON_DATABASE_URL;

  if (dbUrl && dbUrl.trim().length > 0) {
    return crypto
      .createHmac('sha256', dbUrl.trim())
      .update('kisan_dost_aes_encryption_key_2026')
      .digest('hex');
  }

  if (isBuildTime()) {
    return 'build-phase-temporary-collection-token';
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('[Security Failure] Required environment variable ENCRYPTION_KEY is not configured in production runtime.');
  }

  if (!devEphemeralEncSecret) {
    devEphemeralEncSecret = crypto.randomBytes(32).toString('hex');
    console.warn('[Security Warning] ENCRYPTION_KEY is missing. An ephemeral dev-only secret was generated for this process.');
  }
  return devEphemeralEncSecret;
}

export function getGeminiServerKey(): string | null {
  // Only read from server-side environment variables. Never read NEXT_PUBLIC_* variables.
  const serverKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || null;
  return serverKey ? serverKey.trim() : null;
}
