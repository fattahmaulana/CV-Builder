import { describe, it, expect } from "vitest";
import { z } from "zod";
import { CURRENT_AI_CONSENT_VERSION } from "../lib/auth";

const consentSchema = z.object({
  consent_type: z.enum(["ai_gemini_processing", "terms_and_privacy"]),
  consent_version: z.string().min(1),
  granted: z.boolean(),
});

describe("UU PDP Consent Verification", () => {
  it("should validate legitimate AI processing consent", () => {
    const payload = {
      consent_type: "ai_gemini_processing",
      consent_version: CURRENT_AI_CONSENT_VERSION,
      granted: true,
    };

    const result = consentSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("should reject unrecognized consent types", () => {
    const payload = {
      consent_type: "marketing_spam",
      consent_version: "v1.0",
      granted: true,
    };

    const result = consentSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });
});
