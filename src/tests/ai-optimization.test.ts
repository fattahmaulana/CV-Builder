import { describe, it, expect } from "vitest";
import { generateHeuristicOptimization, optimizeCvWithGemini } from "@/lib/ai/gemini-client";
import { CvData } from "@/types/cv";

describe("AI Optimization & Job Alignment Engine", () => {
  const freshGradCv: CvData = {
    personalInfo: {
      fullName: "Siti Rahma",
      email: "siti.rahma@univ.ac.id",
      phone: "+6281122334455",
      city: "Bandung",
      linkedinUrl: "",
      portfolioUrl: "",
      summary: "",
    },
    educations: [
      {
        id: "edu-1",
        institution: "Institut Teknologi Bandung",
        degree: "Sarjana (S1)",
        fieldOfStudy: "Teknik Informatika",
        gpa: "3.80",
        startDate: "2020",
        endDate: "2024",
        city: "Bandung",
        current: false,
        description: "Mata kuliah relevan: Rekayasa Perangkat Lunak, Basis Data.",
      },
    ],
    experiences: [
      {
        id: "exp-1",
        category: "magang",
        role: "Software Engineering Intern",
        organization: "PT Solusi Digital",
        startDate: "Jan 2024",
        endDate: "Jun 2024",
        city: "Jakarta",
        current: false,
        bullets: [
          "Bantu bikin fitur login dan registrasi user pakai typescript.",
          "Ikut rapat mingguan dan bantu perbaiki bug di aplikasi.",
        ],
      },
    ],
    skills: {
      technical: ["TypeScript", "React", "Git"],
      tools: ["VS Code"],
      languages: ["Bahasa Indonesia", "Bahasa Inggris"],
    },
    certifications: [],
    awards: [],
    metadata: {
      language: "id",
      targetPosition: "Junior Frontend Developer",
      targetCompany: "Tokopedia",
      jobDescription: "Mencari Junior Frontend Developer yang menguasai React, TypeScript, dan Rest API untuk mengembangkan UI responsif.",
    },
  };

  it("should transform rough bullets into active achievement metrics", () => {
    const result = generateHeuristicOptimization(
      freshGradCv,
      "Junior Frontend Developer",
      "Tokopedia",
      freshGradCv.metadata.jobDescription || ""
    );

    expect(result.experiences.length).toBe(1);
    const bullets = result.experiences[0].bullets;

    // Must not retain colloquial Indonesian prefixes
    expect(bullets[0]).not.toMatch(/^bantu\s+/i);
    expect(bullets[1]).not.toMatch(/^ikut\s+/i);

    // Must contain active verb and adhere to zero hallucination (no fake 25%)
    expect(bullets[0]).toMatch(/^(Mengelola|Mengembangkan|Merekayasa|Mengoptimalkan|Menganalisis|Mengkoordinasikan)/);
    expect(bullets[0]).not.toContain("25%");
  });

  it("should generate a tailored professional summary for fresh graduates", () => {
    const result = generateHeuristicOptimization(
      freshGradCv,
      "Junior Frontend Developer",
      "Tokopedia",
      freshGradCv.metadata.jobDescription || ""
    );

    expect(result.summary).toContain("Institut Teknologi Bandung");
    expect(result.summary).toContain("Junior Frontend Developer");
    expect(result.summary).toContain("Tokopedia");
  });

  it("should compute match score and extract matched vs missing keywords", () => {
    const result = generateHeuristicOptimization(
      freshGradCv,
      "Junior Frontend Developer",
      "Tokopedia",
      freshGradCv.metadata.jobDescription || ""
    );

    expect(result.matchScore).toBeGreaterThanOrEqual(60);
    expect(result.matchScore).toBeLessThanOrEqual(100);

    // React and TypeScript should be identified as matched
    expect(result.matchAnalysis.matchedKeywords).toContain("TYPESCRIPT");
    expect(result.matchAnalysis.matchedKeywords).toContain("REACT");

    // Recommendations and strengths should be populated
    expect(result.matchAnalysis.recommendations.length).toBeGreaterThan(0);
    expect(result.matchAnalysis.strengths.length).toBeGreaterThan(0);
  });

  it("should return valid result via optimizeCvWithGemini with fallback in test mode", async () => {
    const result = await optimizeCvWithGemini(
      freshGradCv,
      "Junior Frontend Developer",
      "Tokopedia",
      freshGradCv.metadata.jobDescription || ""
    );

    expect(result).toBeDefined();
    expect(result.summary).toBeTruthy();
    expect(result.experiences[0].bullets.length).toBe(2);
    expect(result.matchScore).toBeGreaterThan(0);
  });

  it("should safely handle draft CVs where educations fieldOfStudy is empty", async () => {
    const { buildCvModel } = await import("@/lib/cv/buildCvModel");
    const draftCvWithEmptyField = {
      ...freshGradCv,
      educations: [
        {
          id: "edu-draft-1",
          institution: "Universitas Indonesia",
          degree: "Sarjana (S1)",
          fieldOfStudy: "", // Empty draft field
          gpa: "",
          startDate: "2020",
          endDate: "2024",
          city: "Depok",
          current: false,
          description: "",
        },
      ],
    };

    // buildCvModel normalizes safely without throwing Zod too_small error
    const normalized = buildCvModel(draftCvWithEmptyField) as unknown as CvData;
    expect(normalized).toBeDefined();
    expect(normalized.educations[0].fieldOfStudy).toBe("");

    const result = await optimizeCvWithGemini(
      normalized,
      "Data Analyst",
      "Perusahaan",
      "Deskripsi pekerjaan"
    );
    expect(result).toBeDefined();
    expect(result.summary).toBeTruthy();
  });
});

