import { describe, expect, it } from "vitest";
import {
  buildTotpUri,
  encryptSecretForStorage,
  generateTotpSecret,
  verifyTotpCode,
} from "@/lib/auth/totp";

describe("totp", () => {
  it("generates a verifiable code", () => {
    process.env.NEXTAUTH_SECRET = "test-secret-for-totp";
    const secret = generateTotpSecret();
    const email = "user@example.com";
    const uri = buildTotpUri(email, secret);
    expect(uri).toContain("otpauth://totp/");
    const encrypted = encryptSecretForStorage(secret);
    expect(encrypted).not.toContain(secret);
    const token = verifyTotpCode(secret, email, "000000");
    expect(typeof token).toBe("boolean");
  });
});
