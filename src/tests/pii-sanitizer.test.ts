import { describe, it, expect } from "vitest";
import {
  scrubTextPii,
  sanitizeCvForAi,
  rehydrateCvWithAi,
  AiOptimizationResult,
} from "@/lib/ai/pii-sanitizer";
import { CvData } from "@/types/cv";

describe("UU PDP PII Sanitizer & Rehydrator", () => {
  const sampleCv: CvData = {
    personalInfo: {
      fullName: "Budi Santoso",
      email: "budi.santoso@gmail.com",
      phone: "+6281234567890",
      city: "Jakarta Selatan",
      linkedinUrl: "https://linkedin.com/in/budisantoso",
      portfolioUrl: "https://budisantoso.dev",
      summary: "Hubungi saya di budi.santoso@gmail.com atau WA 081234567890 jika tertarik.",
    },
    educations: [
      {
        id: "edu-1",
        institution: "Universitas Indonesia",
        degree: "S1",
        fieldOfStudy: "Sistem Informasi",
        gpa: "3.75",
        startDate: "2020",
        endDate: "2024",
        city: "Depok",
        current: false,
        description: "Catatan akademik dengan NIK 3201012345678901 terverifikasi.",
      },
    ],
    experiences: [
      {
        id: "exp-1",
        category: "magang",
        role: "Admin Intern",
        organization: "PT Sejahtera",
        startDate: "Jan 2024",
        endDate: "Jun 2024",
        city: "Jakarta",
        current: false,
        bullets: [
          "Bantu input data dan kirim email laporan ke hrd@perusahaan.com setiap hari.",
          "Menghubungi vendor via telepon 085612345678 untuk konfirmasi stok.",
        ],
      },
    ],
    skills: {
      technical: ["Excel"],
      tools: ["Google Docs"],
      languages: ["Bahasa Indonesia"],
    },
    certifications: [],
    awards: [],
    metadata: {
      language: "id",
      targetPosition: "Data Entry Specialist",
      targetCompany: "PT Maju Terus",
      jobDescription: "Dibutuhkan staf data entry teliti.",
    },
  };

  it("should scrub email, phone numbers, and NIK from free text", () => {
    const text = "Kontak: budi@gmail.com, WA: 08123456789, NIK: 3171012345678901.";
    const { scrubbed, count } = scrubTextPii(text);

    expect(scrubbed).not.toContain("budi@gmail.com");
    expect(scrubbed).not.toContain("08123456789");
    expect(scrubbed).not.toContain("3171012345678901");
    expect(scrubbed).toContain("[EMAIL_DIRAHASIAKAN]");
    expect(scrubbed).toContain("[TELEPON_DIRAHASIAKAN]");
    expect(scrubbed).toContain("[NIK_DIRAHASIAKAN]");
    expect(count).toBe(3);
  });

  it("should completely anonymize CV personal info and clean embedded text before sending to AI", () => {
    const { sanitizedCv, redactedCount } = sanitizeCvForAi(sampleCv);

    // Primary contact fields stripped
    expect(sanitizedCv.personalInfo.fullName).toBe("Kandidat");
    expect(sanitizedCv.personalInfo.email).toBe("kandidat@anonim.local");
    expect(sanitizedCv.personalInfo.phone).toBe("+620000000000");
    expect(sanitizedCv.personalInfo.city).toBe("Indonesia");
    expect(sanitizedCv.personalInfo.linkedinUrl).toBe("");
    expect(sanitizedCv.personalInfo.portfolioUrl).toBe("");

    // Embedded text scrubbed
    expect(sanitizedCv.personalInfo.summary).not.toContain("budi.santoso@gmail.com");
    expect(sanitizedCv.personalInfo.summary).not.toContain("081234567890");
    expect(sanitizedCv.experiences[0].bullets[0]).not.toContain("hrd@perusahaan.com");
    expect(sanitizedCv.experiences[0].bullets[1]).not.toContain("085612345678");
    expect(sanitizedCv.educations[0].description).not.toContain("3201012345678901");

    expect(redactedCount).toBeGreaterThanOrEqual(10);
  });

  it("should rehydrate AI suggestions without losing original candidate contact info", () => {
    const mockAiResult: AiOptimizationResult = {
      summary: "Profesional Sistem Informasi dengan spesialisasi entri data dan rekonsiliasi akurat.",
      experiences: [
        {
          id: "exp-1",
          role: "Admin Intern",
          organization: "PT Sejahtera",
          bullets: [
            "Mengelola dan merekonsiliasi 500+ entri data harian, memangkas waktu pelaporan 30%.",
            "Mengoordinasikan komunikasi dengan 20+ vendor pihak ketiga guna menjamin ketersediaan stok 100%.",
          ],
        },
      ],
      skills: {
        technical: ["Excel", "Rekonsiliasi Data"],
        tools: ["Google Docs", "SAP"],
        languages: ["Bahasa Indonesia", "Bahasa Inggris"],
      },
      matchScore: 88,
      matchAnalysis: {
        matchedKeywords: ["EXCEL"],
        missingKeywords: ["SQL"],
        recommendations: ["Pelajari dasar SQL"],
        strengths: ["Lulusan UI"],
      },
    };

    const rehydrated = rehydrateCvWithAi(sampleCv, mockAiResult);

    // Candidate's real PII remains intact!
    expect(rehydrated.personalInfo.fullName).toBe("Budi Santoso");
    expect(rehydrated.personalInfo.email).toBe("budi.santoso@gmail.com");
    expect(rehydrated.personalInfo.phone).toBe("+6281234567890");
    expect(rehydrated.personalInfo.city).toBe("Jakarta Selatan");
    expect(rehydrated.personalInfo.linkedinUrl).toBe("https://linkedin.com/in/budisantoso");

    // AI upgrades are merged
    expect(rehydrated.personalInfo.summary).toBe(mockAiResult.summary);
    expect(rehydrated.experiences[0].bullets[0]).toContain("Mengelola dan merekonsiliasi 500+ entri data");
    expect(rehydrated.skills.technical).toContain("Rekonsiliasi Data");
    expect(rehydrated.skills.tools).toContain("SAP");
  });
});
