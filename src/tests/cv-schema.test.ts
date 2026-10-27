import { describe, it, expect } from "vitest";
import { cvDataSchema, personalInfoSchema, initialCvData } from "../types/cv";

describe("CV Data Zod Schema Validations", () => {
  it("should validate a complete valid CV document", () => {
    const validData = {
      ...initialCvData,
      personalInfo: {
        fullName: "Ahmad Fauzi",
        email: "ahmad.fauzi@email.com",
        phone: "0812-9999-8888",
        city: "Surabaya",
        linkedinUrl: "https://linkedin.com/in/ahmadfauzi",
        portfolioUrl: "",
        summary: "Junior Software Engineer antusias.",
      },
    };

    const parsed = cvDataSchema.safeParse(validData);
    expect(parsed.success).toBe(true);
  });

  it("should reject invalid email formats", () => {
    const invalidData = {
      fullName: "Ahmad Fauzi",
      email: "bukan-email",
      phone: "0812-9999-8888",
      city: "Surabaya",
    };

    const parsed = personalInfoSchema.safeParse(invalidData);
    expect(parsed.success).toBe(false);
  });

  it("should enforce job description max character limits (8000 chars)", () => {
    const oversizedData = {
      ...initialCvData,
      personalInfo: {
        fullName: "Ahmad",
        email: "ahmad@email.com",
        phone: "0812-9999-8888",
        city: "Surabaya",
      },
      metadata: {
        language: "id" as const,
        jobDescription: "A".repeat(8001), // exceeds 8000 chars
      },
    };

    const parsed = cvDataSchema.safeParse(oversizedData);
    expect(parsed.success).toBe(false);
  });
});
