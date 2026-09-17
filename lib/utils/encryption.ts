import crypto from 'crypto';

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * The key must be a 32-byte base64-encoded string.
 */
export function encryptCredential(plaintext: string, base64Key: string): string {
  if (!plaintext) return '';
  if (!base64Key) {
    throw new Error('Encryption key is required.');
  }

  const keyBuffer = Buffer.from(base64Key, 'base64');
  if (keyBuffer.length !== 32) {
    throw new Error('Encryption key must be 32 bytes.');
  }

  const iv = crypto.randomBytes(12); // GCM standard IV length
  const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag().toString('base64');

  // Format: iv:authTag:encrypted
  return `${iv.toString('base64')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts a ciphertext string encrypted by `encryptCredential`.
 * The key must be the same 32-byte base64-encoded string used for encryption.
 */
export function decryptCredential(ciphertext: string, base64Key: string): string {
  if (!ciphertext) return '';
  if (!base64Key) {
    throw new Error('Encryption key is required.');
  }

  const keyBuffer = Buffer.from(base64Key, 'base64');
  if (keyBuffer.length !== 32) {
    throw new Error('Encryption key must be 32 bytes.');
  }

  const parts = ciphertext.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid ciphertext format.');
  }

  const [ivBase64, authTagBase64, encryptedBase64] = parts;
  const iv = Buffer.from(ivBase64, 'base64');
  const authTag = Buffer.from(authTagBase64, 'base64');

  const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedBase64, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
