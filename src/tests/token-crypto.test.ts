import { describe, it, expect } from "vitest";
import { encryptSecret, decryptSecret } from "@/lib/sheets/token-crypto";

describe("AES-256-GCM Token Cryptography", () => {
  it("should encrypt and decrypt a sensitive refresh token accurately", () => {
    const rawToken = "1//04mock_google_refresh_token_xyz123_very_sensitive_data";
    const encrypted = encryptSecret(rawToken);

    expect(encrypted).not.toBe(rawToken);
    expect(encrypted.split(":").length).toBe(3); // iv:authTag:ciphertext

    const decrypted = decryptSecret(encrypted);
    expect(decrypted).toBe(rawToken);
  });

  it("should produce different ciphertexts for identical plaintext due to random IV", () => {
    const secret = "my-secret-spreadsheet-id-12345";
    const enc1 = encryptSecret(secret);
    const enc2 = encryptSecret(secret);

    expect(enc1).not.toBe(enc2);
    expect(decryptSecret(enc1)).toBe(secret);
    expect(decryptSecret(enc2)).toBe(secret);
  });

  it("should throw an error when ciphertext has been tampered with (GCM authentication check)", () => {
    const secret = "authentic-refresh-token";
    const encrypted = encryptSecret(secret);
    const [iv, authTag, cipher] = encrypted.split(":");

    // Alter the last character of ciphertext
    const tamperedCipher = cipher.slice(0, -1) + (cipher.slice(-1) === "a" ? "b" : "a");
    const tamperedPayload = `${iv}:${authTag}:${tamperedCipher}`;

    expect(() => decryptSecret(tamperedPayload)).toThrow();
  });

  it("should throw an error when auth tag has been tampered with", () => {
    const secret = "authentic-refresh-token";
    const encrypted = encryptSecret(secret);
    const [iv, authTag, cipher] = encrypted.split(":");

    // Alter the auth tag
    const tamperedTag = authTag.slice(0, -2) + "00";
    const tamperedPayload = `${iv}:${tamperedTag}:${cipher}`;

    expect(() => decryptSecret(tamperedPayload)).toThrow();
  });

  it("should handle empty string safely", () => {
    expect(encryptSecret("")).toBe("");
    expect(decryptSecret("")).toBe("");
  });
});
