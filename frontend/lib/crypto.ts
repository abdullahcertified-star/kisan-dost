import crypto from 'crypto';

/**
 * Robust Cryptographic Suite for Kisan Dost:
 * - Passwords: Bcrypt (one-way salt + hash) handled in auth routes.
 * - API Keys (e.g. Gemini API Key): Authenticated Two-Way Encryption (AES-256-GCM) at rest,
 *   combined with SHA-256 integrity hashing / verification fingerprinting.
 * - Raw API keys are NEVER exposed in plain text in Neon PostgreSQL or API responses.
 */

const ENCRYPTION_SECRET =
  process.env.ENCRYPTION_KEY ||
  process.env.JWT_SECRET ||
  'kisan_dost_master_encryption_secret_key_2026_super_secure!';

// Derive a cryptographically sound 256-bit (32-byte) key using SHA-256
const MASTER_KEY = crypto.createHash('sha256').update(ENCRYPTION_SECRET).digest();

/**
 * Encrypts a sensitive API key using AES-256-GCM authenticated encryption.
 * Output format: enc:v1:<iv_hex>:<auth_tag_hex>:<ciphertext_hex>
 */
export function encryptApiKey(plainText: string): string {
  if (!plainText || typeof plainText !== 'string') return '';
  const trimmed = plainText.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('enc:v1:')) return trimmed;

  const iv = crypto.randomBytes(12); // Standard 96-bit IV for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', MASTER_KEY, iv);
  let encrypted = cipher.update(trimmed, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return `enc:v1:${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts an AES-256-GCM encrypted API key back to plain text.
 * Safely handles legacy unencrypted keys if present.
 */
export function decryptApiKey(cipherText: string): string {
  if (!cipherText || typeof cipherText !== 'string') return '';
  const trimmed = cipherText.trim();
  if (!trimmed) return '';

  if (!trimmed.startsWith('enc:v1:')) {
    return trimmed;
  }

  try {
    const parts = trimmed.split(':');
    if (parts.length !== 5) return '';
    const [, , ivHex, authTagHex, encryptedHex] = parts;

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', MASTER_KEY, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.warn('Failed to decrypt API key with AES-256-GCM:', err);
    return '';
  }
}

/**
 * Generates a one-way cryptographic SHA-256 hash / fingerprint of an API key.
 * Used for database integrity verification, audit logging, and uniqueness checks.
 */
export function hashApiKey(plainText: string): string {
  if (!plainText || typeof plainText !== 'string') return '';
  const plain = decryptApiKey(plainText.trim());
  if (!plain) return '';
  return crypto.createHash('sha256').update(plain).digest('hex');
}

/**
 * Returns a secure, masked version of the API key for safe UI and API responses (e.g. AIzaSy••••••••1a2B).
 */
export function maskApiKey(keyOrEncrypted: string): string {
  if (!keyOrEncrypted) return '';
  const plain = decryptApiKey(keyOrEncrypted.trim());
  if (!plain || plain.length < 8) return '';
  if (plain.length <= 12) {
    return `${plain.slice(0, 3)}••••${plain.slice(-2)}`;
  }
  return `${plain.slice(0, 6)}••••••••${plain.slice(-4)}`;
}
