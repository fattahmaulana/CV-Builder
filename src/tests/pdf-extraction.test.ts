import { describe, it, expect } from "vitest";
import { generateHarvardPdfBuffer } from "../lib/pdf/generatePdfBuffer";
import { CvData } from "../types/cv";

describe("ATS Harvard PDF Generation & Text Extraction Test", () => {
  const sampleCvData: CvData = {
    personalInfo: {
      fullName: "Budi Pratama",
      email: "budi.pratama@email.com",
      phone: "0812-3456-7890",
      city: "Jakarta Selatan",
      linkedinUrl: "https://linkedin.com/in/budipratama",
      portfolioUrl: "https://github.com/budipratama",
      summary:
        "Fresh graduate Ilmu Komputer dengan pengalaman magang pengembangan antarmuka web dan rekapitulasi data.",
    },
    educations: [
      {
        id: "edu-1",
        institution: "Universitas Indonesia",
        degree: "Sarjana Ilmu Komputer",
        fieldOfStudy: "Sistem Informasi",
        gpa: "3.82",
        startDate: "2022",
        endDate: "2026",
        city: "Depok",
        current: false,
        description: "Mata Kuliah Relevan: Algoritma, Basis Data, Rekayasa Perangkat Lunak.",
      },
    ],
    experiences: [
      {
        id: "exp-1",
        category: "magang",
        role: "Frontend Developer Intern",
        organization: "PT Teknologi Nusantara",
        startDate: "Jan 2025",
        endDate: "Jun 2025",
        city: "Jakarta",
        current: false,
        bullets: [
          "Membangun 8 komponen antarmuka responsif menggunakan React dan Tailwind CSS.",
          "Meningkatkan skor performa Lighthouse dari 74 menjadi 95 pada halaman utama.",
        ],
      },
    ],
    skills: {
      technical: ["TypeScript", "React", "PostgreSQL", "Next.js"],
      tools: ["Git", "Figma", "Docker"],
      languages: ["Bahasa Indonesia (Native)", "English (Professional)"],
    },
    certifications: [
      {
        id: "cert-1",
        name: "Google Data Analytics Professional",
        issuer: "Coursera",
        issueDate: "2025",
        credentialId: "GDA-98765",
        url: "https://coursera.org",
      },
    ],
    awards: [],
    metadata: {
      language: "id",
      targetPosition: "Junior Frontend Engineer",
      targetCompany: "Unicorn Tech",
      jobDescription: "Dicari junior engineer yang menguasai React dan TypeScript.",
    },
  };

  it("should generate a valid PDF buffer with %PDF- header", async () => {
    const pdfBuffer = await generateHarvardPdfBuffer(sampleCvData, true);
    expect(pdfBuffer).toBeDefined();
    expect(pdfBuffer.length).toBeGreaterThan(1000);

    // PDF files always begin with '%PDF-'
    const header = pdfBuffer.subarray(0, 5).toString();
    expect(header).toBe("%PDF-");
  });

  it("should contain selectable, searchable text with correct ATS linear reading order", async () => {
    const pdfBuffer = await generateHarvardPdfBuffer(sampleCvData, true);

    // Dynamic import to handle pdf-parse v2 API
    const pdfParseModule = await import("pdf-parse");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const PDFParseClass = (pdfParseModule as any).PDFParse || (pdfParseModule as any).default?.PDFParse;
    const parser = new PDFParseClass({ data: pdfBuffer });
    const parsedResult = await parser.getText();
    const text = typeof parsedResult === "string" ? parsedResult : parsedResult.text;

    expect(text).toBeDefined();

    // 1. Text elements must be present
    expect(text).toContain("BUDI PRATAMA");
    expect(text).toContain("Jakarta Selatan");
    expect(text).toContain("budi.pratama@email.com");
    expect(text).toContain("Universitas Indonesia");
    expect(text).toContain("Frontend Developer Intern");
    expect(text).toContain("TypeScript");

    // 2. Linear Reading Order verification (Crucial for ATS compliance)
    // Name -> Education -> Experience -> Skills
    const nameIndex = text.indexOf("BUDI PRATAMA");
    const educationHeadingIndex = text.indexOf("PENDIDIKAN");
    const expHeadingIndex = text.indexOf("PENGALAMAN KERJA & ORGANISASI");
    const skillsHeadingIndex = text.indexOf("KEAHLIAN");

    expect(nameIndex).toBeGreaterThan(-1);
    expect(educationHeadingIndex).toBeGreaterThan(nameIndex);
    expect(expHeadingIndex).toBeGreaterThan(educationHeadingIndex);
    expect(skillsHeadingIndex).toBeGreaterThan(expHeadingIndex);
  });
});
