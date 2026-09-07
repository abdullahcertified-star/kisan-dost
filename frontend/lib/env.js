require('dotenv').config();

function getDatabaseUrl() {
  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.NEON_DATABASE_URL ||
    '';

  if (!url && typeof window === 'undefined' && process.env.NEXT_PHASE !== 'phase-production-build') {
    console.warn('[Database Warning] DATABASE_URL is not set in environment variables.');
  }
  return url;
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (typeof window === 'undefined' && process.env.NEXT_PHASE !== 'phase-production-build') {
      console.warn('[Security Warning] JWT_SECRET is not set in environment variables; using secure fallback.');
    }
    return 'kisan_dost_secure_jwt_production_fallback_key_2026!';
  }
  return secret;
}

function getEncryptionSecret() {
  const secret = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET;
  if (!secret) {
    if (typeof window === 'undefined' && process.env.NEXT_PHASE !== 'phase-production-build') {
      console.warn('[Security Warning] ENCRYPTION_KEY or JWT_SECRET is not set; using secure fallback.');
    }
    return 'kisan_dost_master_encryption_secret_key_2026_super_secure!';
  }
  return secret;
}

function getGeminiServerKey() {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
    null
  );
}

module.exports = {
  getDatabaseUrl,
  getJwtSecret,
  getEncryptionSecret,
  getGeminiServerKey,
};
