import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getOptimalApiKey,
  recordKeyUsage,
  encryptApiKey,
  __setMockDbKeys,
  __getMockDbKeys,
} from "@/lib/admin/api-key-manager";
import { optimizeCvWithGemini } from "@/lib/ai/gemini-client";
import { sanitizeCvForAi, scrubTextPii } from "@/lib/ai/pii-sanitizer";
import { CvData } from "@/types/cv";

describe("Phase 5: Gemini AI Integration & Key Rotation", () => {
  const sampleCv: CvData = {
    personalInfo: {
      fullName: "Budi Santoso",
      email: "budi.santoso@example.com",
      phone: "0812-3456-7890",
      city: "Jakarta",
      linkedinUrl: "https://linkedin.com/in/budisantoso",
      portfolioUrl: "https://github.com/budisantoso",
      summary: "Fresh graduate Sistem Informasi.",
    },
    educations: [
      {
        id: "edu-1",
        institution: "Universitas Indonesia",
        degree: "Sarjana (S1)",
        fieldOfStudy: "Sistem Informasi",
        gpa: "3.75",
        startDate: "2020",
        endDate: "2024",
        city: "Depok",
        current: false,
        description: "",
      },
    ],
    experiences: [
      {
        id: "exp-1",
        category: "magang",
        role: "Data Analyst Intern",
        organization: "PT Teknologi Bangsa",
        startDate: "Feb 2024",
        endDate: "Jun 2024",
        city: "Jakarta",
        current: false,
        bullets: [
          "Bantu-bantu rekap data 500 transaksi harian di excel.",
        ],
      },
    ],
    skills: {
      technical: ["SQL", "Excel"],
      tools: ["Google Sheets"],
      languages: ["Bahasa Indonesia", "English"],
    },
    certifications: [],
    awards: [],
    metadata: {
      language: "id",
      targetPosition: "Junior Data Analyst",
      targetCompany: "Unicorn Tech",
      jobDescription: "Kualifikasi: Mahir SQL, visualisasi data, analisis tren transaksi.",
    },
  };

  beforeEach(() => {
    __setMockDbKeys([]);
  });

  describe("PII Scrubbing & UU PDP Compliance", () => {
    it("should remove all email addresses, phone numbers, and NIK from free-form text", () => {
      const rawText =
        "Hubungi saya di budi.kerja@gmail.com atau wa 0812-9876-5432 atau 6281234567891. NIK: 3171012345670001.";
      const { scrubbed, count } = scrubTextPii(rawText);

      expect(count).toBeGreaterThanOrEqual(3);
      expect(scrubbed).not.toContain("budi.kerja@gmail.com");
      expect(scrubbed).not.toContain("0812-9876-5432");
      expect(scrubbed).not.toContain("3171012345670001");
      expect(scrubbed).toContain("[EMAIL_DIRAHASIAKAN]");
      expect(scrubbed).toContain("[TELEPON_DIRAHASIAKAN]");
      expect(scrubbed).toContain("[NIK_DIRAHASIAKAN]");
    });

    it("should sanitize whole CV data object before sending to AI prompt", () => {
      const { sanitizedCv } = sanitizeCvForAi(sampleCv);

      // Contact points must not leak real personal details
      expect(sanitizedCv.personalInfo.fullName).not.toContain("Budi Santoso");
      expect(sanitizedCv.personalInfo.email).not.toContain("budi.santoso@example.com");
      expect(sanitizedCv.personalInfo.phone).not.toContain("0812-3456-7890");
      expect(sanitizedCv.personalInfo.linkedinUrl).toBe("");

      // Experiences and educations remain present for relevant skill extraction
      expect(sanitizedCv.experiences.length).toBe(1);
      expect(sanitizedCv.educations.length).toBe(1);
    });
  });

  describe("API Key Selection & Multi-Key Retry Rotation", () => {
    it("should fallback to GEMINI_API_KEY from environment if no database key active", async () => {
      const keyData = await getOptimalApiKey("gemini");
      expect(keyData).not.toBeNull();
      if (keyData) {
        expect(keyData.key).toBeDefined();
      }
    });

    it("should rotate least-used keys and cooldown on HTTP 429", async () => {
      const key1Encrypted = encryptApiKey("mock-key-1");
      const key2Encrypted = encryptApiKey("mock-key-2");

      __setMockDbKeys([
        {
          id: "key-1",
          provider: "gemini",
          label: "Key 1",
          last_four_chars: "key1",
          masked_key: "AIza...key1",
          encrypted_key: key1Encrypted,
          status: "aktif",
          priority: 1,
          weight: 1,
          requests_today: 10,
          errors_today: 0,
          cooldown_until: null,
          last_used_at: null,
          last_error: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "key-2",
          provider: "gemini",
          label: "Key 2",
          last_four_chars: "key2",
          masked_key: "AIza...key2",
          encrypted_key: key2Encrypted,
          status: "aktif",
          priority: 1,
          weight: 1,
          requests_today: 2, // Least used!
          errors_today: 0,
          cooldown_until: null,
          last_used_at: null,
          last_error: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

      // Should pick key-2 first because requests_today is 2 (vs 10)
      const selected = await getOptimalApiKey("gemini");
      expect(selected?.id).toBe("key-2");

      // Record 429 on key-2
      await recordKeyUsage("key-2", 150, 429, "Rate limit exceeded");

      // Now key-2 is in cooldown, so getOptimalApiKey should pick key-1!
      const nextSelected = await getOptimalApiKey("gemini");
      expect(nextSelected?.id).toBe("key-1");
    });

    it("should exclude already attempted keys during retries", async () => {
      const firstKey = await getOptimalApiKey("gemini");
      if (firstKey) {
        const nextKey = await getOptimalApiKey("gemini", [firstKey.id]);
        if (nextKey) {
          expect(nextKey.id).not.toBe(firstKey.id);
        }
      }
    });

    it("should optimize CV and return structured action verbs without crashing", async () => {
      const result = await optimizeCvWithGemini(
        sampleCv,
        "Junior Data Analyst",
        "Unicorn Tech",
        "Kualifikasi: Mahir SQL, visualisasi data, analisis tren transaksi."
      );

      // Output verification
      expect(result).toHaveProperty("summary");
      expect(result).toHaveProperty("experiences");
      expect(result).toHaveProperty("skills");
      expect(result).toHaveProperty("matchScore");
      expect(result).toHaveProperty("matchAnalysis");

      expect(result.matchScore).toBeGreaterThanOrEqual(50);
      expect(result.matchScore).toBeLessThanOrEqual(100);

      // Experience bullets must follow Harvard action verb formula
      expect(result.experiences.length).toBeGreaterThan(0);
      const firstBullet = result.experiences[0].bullets[0];
      expect(firstBullet.length).toBeGreaterThan(20);
      // Contains strong action verb in Indonesian
      expect(/mengembangkan|mengelola|mengoptimalkan|menganalisis|merekayasa/i.test(firstBullet)).toBe(true);

      // Match analysis keywords extracted from JD
      expect(result.matchAnalysis.matchedKeywords.length).toBeGreaterThan(0);
      expect(result.matchAnalysis.strengths.length).toBeGreaterThan(0);
      expect(result.matchAnalysis.recommendations.length).toBeGreaterThan(0);
    });

    it("should adapt output language according to metadata (English vs Indonesian)", async () => {
      const enCv: CvData = {
        ...sampleCv,
        metadata: {
          ...sampleCv.metadata,
          language: "en",
        },
      };

      const result = await optimizeCvWithGemini(
        enCv,
        "Junior Data Analyst",
        "Tech Global Corp",
        "Required: SQL, Data Visualization, Analytical Thinking."
      );

      const firstBullet = result.experiences[0].bullets[0];
      // Contains English action verb
      expect(/spearheaded|engineered|optimized|analyzed|coordinated|streamlined/i.test(firstBullet)).toBe(true);
    });
  });
});
