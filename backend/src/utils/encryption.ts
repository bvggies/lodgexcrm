import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production-32-chars!!';
const ALGORITHM = 'aes-256-cbc';

/**
 * Encrypt sensitive data (API keys, secrets, etc.)
 */
export function encrypt(text: string): string {
  if (!text) return '';
  
  try {
    const iv = crypto.randomBytes(16);
    const key = Buffer.from(ENCRYPTION_KEY.slice(0, 32).padEnd(32, '0'), 'utf8');
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    throw new Error('Encryption failed');
  }
}

/**
 * Decrypt sensitive data
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return '';
  
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const key = Buffer.from(ENCRYPTION_KEY.slice(0, 32).padEnd(32, '0'), 'utf8');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    
    let decrypted = decipher.update(parts[1], 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error('Decryption failed');
  }
}

