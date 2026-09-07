require('dotenv').config();

function getDatabaseUrl() {
  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.NEON_DATABASE_URL;

  if (!url) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CRITICAL SECURITY ERROR: DATABASE_URL environment variable is missing in production.');
    }
    console.warn('[Security Warning] DATABASE_URL is not defined in environment variables.');
  }
  return url || '';
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CRITICAL SECURITY ERROR: JWT_SECRET environment variable is missing in production.');
    }
    return 'kisan_dost_local_development_jwt_secret_do_not_use_in_prod';
  }
  return secret;
}

function getEncryptionSecret() {
  const secret = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CRITICAL SECURITY ERROR: ENCRYPTION_KEY or JWT_SECRET environment variable is missing in production.');
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
