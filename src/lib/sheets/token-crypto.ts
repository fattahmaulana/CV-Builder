import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto";

/**
 * AES-256-GCM Cryptographic Token Encryption Helper
 * Securely encrypts Google OAuth refresh tokens and sensitive spreadsheet credentials
 * using authenticated encryption with integrity verification (GCM tag).
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 12 bytes recommended for GCM

/**
 * Derives a strict 32-byte key buffer from the environment encryption key
 */
function getDerivedKey(): Buffer {
  const envKey =
    process.env.ENCRYPTION_MASTER_KEY ||
    process.env.KEY_ENCRYPTION_SECRET ||
    process.env.ENCRYPTION_KEY ||
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
  
  // If exactly 64 hex characters (32 bytes), parse hex directly
  if (/^[0-9a-fA-F]{64}$/.test(envKey)) {
    return Buffer.from(envKey, "hex");
  }

  // Otherwise derive 32-byte key using SHA-256
  return createHash("sha256").update(envKey, "utf8").digest();
}

/**
 * Encrypts a plain-text secret into an authenticated string: iv:authTag:ciphertext
 */
export function encryptSecret(plainText: string): string {
  if (!plainText) return "";

  const key = getDerivedKey();
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Decrypts an authenticated encrypted string: iv:authTag:ciphertext
 */
export function decryptSecret(encryptedPayload: string): string {
  if (!encryptedPayload) return "";

  const parts = encryptedPayload.split(":");
  if (parts.length !== 3) {
    throw new Error("Format data terenkripsi tidak valid");
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  const key = getDerivedKey();
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const encryptedText = Buffer.from(encryptedHex, "hex");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encryptedText),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
