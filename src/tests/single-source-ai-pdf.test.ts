import { describe, it, expect } from "vitest";
import { buildCvModel } from "@/lib/cv/buildCvModel";
import { rehydrateCvWithAi, AiOptimizationResult } from "@/lib/ai/pii-sanitizer";
import { generateHarvardPdfBuffer } from "@/lib/pdf/generatePdfBuffer";
import { generateHarvardDocxBuffer } from "@/lib/docx/harvardDocxGenerator";
import { CvData, initialCvData } from "@/types/cv";
import crypto from "crypto";

describe("MASALAH 2: Single Source of Truth for AI, Preview, PDF & DOCX", () => {
  const baseCv: CvData = {
    ...initialCvData,
    personalInfo: {
      fullName: "Siti Rahmawati",
      email: "siti.rahmawati@email.com",
      phone: "0812-9876-5432",
      city: "Bandung",
      linkedinUrl: "https://linkedin.com/in/sitirahmawati",
      portfolioUrl: "https://sitirahma.dev",
      summary: "Fresh graduate Sistem Informasi yang mencari pekerjaan.",
    },
    educations: [
      {
        id: "edu-1",
        institution: "Institut Teknologi Bandung",
        degree: "Sarjana Komputer (S1)",
        fieldOfStudy: "Sistem Informasi",
        gpa: "3.88",
        startDate: "2020",
        endDate: "2024",
        city: "Bandung",
        current: false,
        description: "Lulus dengan predikat Cum Laude.",
      },
    ],
    experiences: [
      {
        id: "exp-1",
        category: "magang",
        role: "Quality Assurance Intern",
        organization: "PT Solusi Teknologi",
        startDate: "Feb 2024",
        endDate: "Agu 2024",
        city: "Jakarta",
        current: false,
        bullets: [
          "Melakukan pengujian fitur aplikasi.",
          "Membantu menulis laporan bug.",
        ],
      },
    ],
    skills: {
      technical: ["TypeScript", "Vitest", "Playwright"],
      tools: ["Git", "Postman"],
      languages: ["Bahasa Indonesia", "English"],
    },
    certifications: [],
    awards: [],
    metadata: {
      language: "id",
      targetPosition: "QA Automation Engineer",
      targetCompany: "Tech Corp",
      jobDescription: "Dibutuhkan QA Automation Engineer dengan pengalaman Playwright dan CI/CD.",
      template: "ats-harvard",
    },
  };

  it("buildCvModel produces deterministic normalized model matching snapshot", () => {
    const model = buildCvModel(baseCv);
    expect(model.personalInfo.fullName).toBe("Siti Rahmawati");
    expect(model.metadata.language).toBe("id");
    expect(model.experiences[0].bullets.length).toBe(2);
    expect(model).toMatchSnapshot();
  });

  it("accepting AI suggestions writes directly to cv.data and matches extracted PDF text identically", async () => {
    // 1. AI generates optimized summary and Harvard-action bullets
    const aiOptimization: AiOptimizationResult = {
      summary: "QA Automation Engineer dengan spesialisasi pengujian otomatis menggunakan TypeScript dan Vitest.",
      experiences: [
        {
          id: "exp-1",
          role: "Quality Assurance Intern",
          organization: "PT Solusi Teknologi",
          bullets: [
            "Merancang 45 automated test scripts menggunakan Vitest dan Playwright untuk modul pembayaran.",
            "Mereduksi regresi bugs sebesar 35% sebelum rilis produksi.",
          ],
        },
      ],
      skills: {
        technical: ["TypeScript", "Vitest", "Playwright", "CI/CD"],
        tools: ["Git", "Postman", "Docker"],
        languages: ["Bahasa Indonesia", "English"],
      },
      matchScore: 92,
      matchAnalysis: {
        matchedKeywords: ["QA Automation", "Playwright", "Vitest"],
        missingKeywords: [],
        recommendations: [],
        strengths: ["Keahlian testing otomatis terbukti"],
      },
    };

    // 2. User accepts AI suggestions into cv.data
    const updatedCvData = rehydrateCvWithAi(baseCv, aiOptimization);

    // Verify written to cv.data
    expect(updatedCvData.personalInfo.summary).toBe(aiOptimization.summary);
    expect(updatedCvData.experiences[0].bullets).toEqual(aiOptimization.experiences[0].bullets);

    // 3. Normalized through buildCvModel
    const normalizedModel = buildCvModel(updatedCvData);
    expect(normalizedModel.personalInfo.summary).toBe(aiOptimization.summary);
    expect(normalizedModel.experiences[0].bullets[0]).toBe(
      "Merancang 45 automated test scripts menggunakan Vitest dan Playwright untuk modul pembayaran."
    );

    // 4. Generate PDF buffer from updated cv.data
    const pdfBuffer = await generateHarvardPdfBuffer(updatedCvData, true);
    expect(pdfBuffer).toBeDefined();

    // 5. Extract text from PDF buffer and verify exact match with cv.data
    const pdfParseModule = await import("pdf-parse");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const PDFParseClass = (pdfParseModule as any).PDFParse || (pdfParseModule as any).default?.PDFParse;
    const parser = new PDFParseClass({ data: pdfBuffer });
    const parsedResult = await parser.getText();
    const pdfText = typeof parsedResult === "string" ? parsedResult : parsedResult.text;

    // Verify candidate identity and AI-accepted summary in PDF text
    expect(pdfText).toContain("SITI RAHMAWATI");
    expect(pdfText).toContain(
      "QA Automation Engineer dengan spesialisasi pengujian otomatis menggunakan TypeScript dan Vitest."
    );

    // Verify all AI-accepted bullet points appear in the PDF text identically
    for (const bullet of updatedCvData.experiences[0].bullets) {
      expect(pdfText).toContain(bullet);
    }

    // 6. Generate DOCX buffer and verify generation succeeds without error
    const docxBuffer = await generateHarvardDocxBuffer(updatedCvData, true);
    expect(docxBuffer).toBeDefined();
    expect(docxBuffer.length).toBeGreaterThan(1000);
  });

  it("calculates cache ETag based on cv.data + template + language and changes on data update", () => {
    const model1 = buildCvModel(baseCv);
    const hash1 = crypto
      .createHash("sha256")
      .update(JSON.stringify({ data: model1, template: model1.metadata.template, language: model1.metadata.language }))
      .digest("hex");

    // Modify cv.data
    const modifiedCv = {
      ...baseCv,
      personalInfo: {
        ...baseCv.personalInfo,
        summary: "Ringkasan telah diperbarui.",
      },
    };

    const model2 = buildCvModel(modifiedCv);
    const hash2 = crypto
      .createHash("sha256")
      .update(JSON.stringify({ data: model2, template: model2.metadata.template, language: model2.metadata.language }))
      .digest("hex");

    // Hashes must differ, invalidating downstream cache
    expect(hash1).not.toBe(hash2);
  });
});
