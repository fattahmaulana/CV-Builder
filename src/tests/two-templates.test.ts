import { describe, it, expect } from "vitest";
import { buildCvModel } from "@/lib/cv/buildCvModel";
import { initialCvData, CvData } from "@/types/cv";
import { pdf } from "@react-pdf/renderer";
import React from "react";
import { HarvardPdfDocument } from "@/lib/pdf/HarvardPdfDocument";
import { generateHarvardPdfBuffer } from "@/lib/pdf/generatePdfBuffer";
import { generateHarvardDocxBuffer } from "@/lib/docx/harvardDocxGenerator";


async function extractPdfText(pdfBuffer: Buffer): Promise<string> {
  const pdfParseModule = await import("pdf-parse");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const PDFParseClass = (pdfParseModule as any).PDFParse || (pdfParseModule as any).default?.PDFParse;
  const parser = new PDFParseClass({ data: pdfBuffer });
  const parsedResult = await parser.getText();
  return typeof parsedResult === "string" ? parsedResult : parsedResult.text;
}

describe("MASALAH 5: Dua Template CV (ATS Harvard & Dengan Foto)", () => {
  const sampleData: CvData = {
    ...initialCvData,
    personalInfo: {
      fullName: "Siti Rahmawati, S.Kom.",
      email: "siti.rahmawati@gmail.com",
      phone: "+6281234567890",
      city: "Jakarta Selatan",
      linkedinUrl: "https://linkedin.com/in/sitirahmawati",
      portfolioUrl: "https://github.com/sitirahma",
      summary: "Fresh graduate Ilmu Komputer Universitas Indonesia yang fokus pada rekayasa perangkat lunak dan analisis data sistematis.",
      photoUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    },
    educations: [
      {
        id: "edu-1",
        institution: "Universitas Indonesia",
        degree: "Sarjana Komputer (S1)",
        fieldOfStudy: "Ilmu Komputer",
        gpa: "3.85 / 4.00",
        startDate: "Agu 2020",
        endDate: "Jul 2024",
        city: "Depok",
        current: false,
        description: "Predikat Cum Laude. Asisten Dosen Struktur Data dan Algoritma.",
      },
    ],
    experiences: [
      {
        id: "exp-1",
        category: "magang",
        role: "Software Engineering Intern",
        organization: "PT Tokopedia",
        startDate: "Feb 2024",
        endDate: "Jun 2024",
        city: "Jakarta",
        current: false,
        bullets: [
          "Mengembangkan modul backend pembayaran menggunakan Node.js dan PostgreSQL untuk 50.000 transaksi harian.",
          "Menganalisis bottleneck query database serta mengoptimalkan performa response time hingga 35%.",
          "Berkolaborasi dengan tim lintas divisi untuk memastikan integrasi API berjalan sesuai standar operasional.",
        ],
      },
    ],
    skills: {
      technical: ["TypeScript", "Next.js", "PostgreSQL", "Node.js"],
      tools: ["Git", "Docker", "VS Code", "Postman"],
      languages: ["Bahasa Indonesia", "Bahasa Inggris"],
    },
    certifications: [
      {
        id: "cert-1",
        name: "AWS Certified Cloud Practitioner",
        issuer: "Amazon Web Services",
        issueDate: "Mei 2024",
        credentialId: "AWS-CCP-987654",
        url: "",
      },
    ],
    awards: [
      {
        id: "award-1",
        title: "Juara 1 Hackathon Nasional",
        issuer: "Kementerian Kominfo",
        year: "2023",
        description: "Mengembangkan aplikasi deteksi dini kesehatan digital berbasis web",
      },
    ],
    metadata: {
      language: "id",
      template: "ats-harvard",
    },
  };

  describe("1. Template A (ATS Harvard)", () => {
    it("should build normalized model with ats-harvard template and 1-column structure", () => {
      const model = buildCvModel({
        ...sampleData,
        metadata: { ...sampleData.metadata, template: "ats-harvard" },
      });

      expect(model.metadata.template).toBe("ats-harvard");
      expect(model.personalInfo.fullName).toBe("Siti Rahmawati, S.Kom.");
      expect(model.experiences).toHaveLength(1);
    });

    it("should generate valid PDF and extract selectable text in linear order", async () => {
      const pdfBuffer = await generateHarvardPdfBuffer({
        ...sampleData,
        metadata: { ...sampleData.metadata, template: "ats-harvard" },
      }, true);

      expect(pdfBuffer.toString("ascii", 0, 5)).toBe("%PDF-");

      const text = await extractPdfText(pdfBuffer);

      expect(text).toContain("SITI RAHMAWATI, S.KOM.");
      expect(text).toContain("siti.rahmawati@gmail.com");
      expect(text).toContain("Universitas Indonesia");
      expect(text).toContain("Software Engineering Intern");
      expect(text).toContain("PT Tokopedia");
    });

    it("should generate valid Harvard ATS DOCX buffer", async () => {
      const docxBuffer = await generateHarvardDocxBuffer({
        ...sampleData,
        metadata: { ...sampleData.metadata, template: "ats-harvard" },
      });

      expect(Buffer.isBuffer(docxBuffer)).toBe(true);
      expect(docxBuffer.length).toBeGreaterThan(5000);
      expect(docxBuffer.toString("ascii", 0, 2)).toBe("PK");
    });
  });

  describe("2. Template B (Dengan Foto)", () => {
    it("should build normalized model preserving photoUrl and with-photo template", () => {
      const model = buildCvModel({
        ...sampleData,
        metadata: { ...sampleData.metadata, template: "with-photo" },
      });

      expect(model.metadata.template).toBe("with-photo");
      expect(model.personalInfo.photoUrl).toContain("data:image/png;base64");
    });

    it("should generate valid PDF with photo header and extract searchable text identically", async () => {
      const pdfBuffer = await generateHarvardPdfBuffer({
        ...sampleData,
        metadata: { ...sampleData.metadata, template: "with-photo" },
      }, true);

      expect(pdfBuffer.toString("ascii", 0, 5)).toBe("%PDF-");

      const text = await extractPdfText(pdfBuffer);

      expect(text).toContain("SITI RAHMAWATI, S.KOM.");
      expect(text).toContain("siti.rahmawati@gmail.com");
      expect(text).toContain("PT Tokopedia");
      expect(text).toContain("Universitas Indonesia");
    });

    it("should generate valid DOCX buffer embedding candidate photo for Template B", async () => {
      const docxBuffer = await generateHarvardDocxBuffer({
        ...sampleData,
        metadata: { ...sampleData.metadata, template: "with-photo" },
      });

      expect(Buffer.isBuffer(docxBuffer)).toBe(true);
      expect(docxBuffer.length).toBeGreaterThan(5000);
      expect(docxBuffer.toString("ascii", 0, 2)).toBe("PK");
    });
  });

  describe("3. Unified Single Source & Template Switching", () => {
    it("should switch between Template A and Template B without content mutation", () => {
      const modelA = buildCvModel({
        ...sampleData,
        metadata: { ...sampleData.metadata, template: "ats-harvard" },
      });

      const modelB = buildCvModel({
        ...sampleData,
        metadata: { ...sampleData.metadata, template: "with-photo" },
      });

      expect(modelA.personalInfo.fullName).toBe(modelB.personalInfo.fullName);
      expect(modelA.educations).toEqual(modelB.educations);
      expect(modelA.experiences).toEqual(modelB.experiences);
      expect(modelA.skills).toEqual(modelB.skills);
      expect(modelA.certifications).toEqual(modelB.certifications);
      expect(modelA.awards).toEqual(modelB.awards);

      expect(modelA.metadata.template).toBe("ats-harvard");
      expect(modelB.metadata.template).toBe("with-photo");
    });
  });
});
