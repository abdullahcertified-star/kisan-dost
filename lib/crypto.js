const crypto = require('crypto');

const ENCRYPTION_SECRET =
  process.env.ENCRYPTION_KEY ||
  process.env.JWT_SECRET ||
  'kisan_dost_master_encryption_secret_key_2026_super_secure!';

// Derive a cryptographically sound 256-bit key using SHA-256
const MASTER_KEY = crypto.createHash('sha256').update(ENCRYPTION_SECRET).digest();

/**
 * Encrypts an API key using AES-256-GCM.
 * Format: enc:v1:<iv_hex>:<auth_tag_hex>:<ciphertext_hex>
 */
function encryptApiKey(plainText) {
  if (!plainText || typeof plainText !== 'string') return '';
  const trimmed = plainText.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('enc:v1:')) return trimmed;

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', MASTER_KEY, iv);
  let encrypted = cipher.update(trimmed, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return `enc:v1:${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts an AES-256-GCM encrypted API key.
 */
function decryptApiKey(cipherText) {
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
 * Generates a SHA-256 hash / fingerprint of an API key for verification.
 */
function hashApiKey(plainText) {
  if (!plainText || typeof plainText !== 'string') return '';
  const plain = decryptApiKey(plainText.trim());
  if (!plain) return '';
  return crypto.createHash('sha256').update(plain).digest('hex');
}

/**
 * Masks an API key for safe client display (e.g. AIzaSy••••••••1a2B).
 */
function maskApiKey(keyOrEncrypted) {
  if (!keyOrEncrypted) return '';
  const plain = decryptApiKey(keyOrEncrypted.trim());
  if (!plain || plain.length < 8) return '';
  if (plain.length <= 12) {
    return `${plain.slice(0, 3)}••••${plain.slice(-2)}`;
  }
  return `${plain.slice(0, 6)}••••••••${plain.slice(-4)}`;
}

module.exports = {
  encryptApiKey,
  decryptApiKey,
  hashApiKey,
  maskApiKey,
};
