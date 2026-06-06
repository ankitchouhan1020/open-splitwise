import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from "crypto";

const SCRYPT_SALT = "open-splitwise-ai-v1";

function encryptionSecret(): string {
  const secret =
    process.env.AI_ENCRYPTION_SECRET?.trim() ??
    process.env.SESSION_SECRET?.trim();
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET (or AI_ENCRYPTION_SECRET) must be at least 32 chars for AI key encryption",
    );
  }
  return secret;
}

function encryptionKey(): Buffer {
  return scryptSync(encryptionSecret(), SCRYPT_SALT, 32);
}

/** Encrypt a plaintext API key for storage. */
export function encryptApiKey(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    iv.toString("base64"),
    tag.toString("base64"),
    encrypted.toString("base64"),
  ].join(":");
}

/** Decrypt a stored API key ciphertext. */
export function decryptApiKey(stored: string): string {
  const parts = stored.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted API key format");
  }
  const [ivB64, tagB64, dataB64] = parts as [string, string, string];
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const data = Buffer.from(dataB64, "base64");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString(
    "utf8",
  );
}

/** Non-reversible display hint for a saved API key (never log or persist this). */
export function formatApiKeyPreview(plaintext: string): string {
  const trimmed = plaintext.trim();
  if (trimmed.length <= 4) return "••••";
  if (trimmed.length <= 8) {
    return `${trimmed.slice(0, 2)}…${trimmed.slice(-2)}`;
  }
  return `${trimmed.slice(0, 6)}…${trimmed.slice(-4)}`;
}
