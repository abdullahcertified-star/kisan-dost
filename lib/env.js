require('dotenv').config();
const crypto = require('crypto');

let devEphemeralJwtSecret = null;
let devEphemeralEncSecret = null;

function getDatabaseUrl() {
  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.NEON_DATABASE_URL ||
    '';

  if (!url && typeof window === 'undefined' && process.env.NEXT_PHASE !== 'phase-production-build') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[Security Failure] Required environment variable DATABASE_URL is not configured.');
    }
    console.warn('[Database Warning] DATABASE_URL is not set in environment variables.');
  }
  return url;
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.trim().length > 0) {
    return secret.trim();
  }

  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return 'build-phase-temporary-collection-token';
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('[Security Failure] Required environment variable JWT_SECRET is not configured in production.');
  }

  if (!devEphemeralJwtSecret) {
    devEphemeralJwtSecret = crypto.randomBytes(32).toString('hex');
    console.warn('[Security Warning] JWT_SECRET is missing. An ephemeral dev-only secret was generated for this process.');
  }
  return devEphemeralJwtSecret;
}

function getEncryptionSecret() {
  const secret = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET;
  if (secret && secret.trim().length > 0) {
    return secret.trim();
  }

  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return 'build-phase-temporary-collection-token';
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('[Security Failure] Required environment variable ENCRYPTION_KEY is not configured in production.');
  }

  if (!devEphemeralEncSecret) {
    devEphemeralEncSecret = crypto.randomBytes(32).toString('hex');
    console.warn('[Security Warning] ENCRYPTION_KEY is missing. An ephemeral dev-only secret was generated for this process.');
  }
  return devEphemeralEncSecret;
}

function getGeminiServerKey() {
  const serverKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || null;
  return serverKey ? serverKey.trim() : null;
}

module.exports = {
  getDatabaseUrl,
  getJwtSecret,
  getEncryptionSecret,
  getGeminiServerKey,
};
