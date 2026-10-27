import { describe, it, expect } from "vitest";
import { generateHarvardDocxBuffer } from "../lib/docx/harvardDocxGenerator";
import { CvData } from "../types/cv";

describe("ATS Harvard DOCX Generation Test", () => {
  const sampleCvData: CvData = {
    personalInfo: {
      fullName: "Siti Rahma",
      email: "siti.rahma@email.com",
      phone: "0813-8888-9999",
      city: "Bandung",
      linkedinUrl: "https://linkedin.com/in/sitirahma",
      portfolioUrl: "",
      summary: "Lulusan baru Akuntansi dengan sertifikasi Brevet Pajak A & B.",
    },
    educations: [
      {
        id: "edu-1",
        institution: "Universitas Padjadjaran",
        degree: "Sarjana Akuntansi",
        fieldOfStudy: "Akuntansi Keuangan",
        gpa: "3.78",
        startDate: "2021",
        endDate: "2025",
        city: "Jatinangor",
        current: false,
        description: "Asisten Dosen Praktikum Perpajakan.",
      },
    ],
    experiences: [
      {
        id: "exp-1",
        category: "magang",
        role: "Staf Magang Audit",
        organization: "KAP Tanubrata & Rekan",
        startDate: "Jul 2024",
        endDate: "Des 2024",
        city: "Bandung",
        current: false,
        bullets: [
          "Melakukan sampling pengujian substantif atas 400+ bukti kas keluar.",
          "Membantu penyusunan kertas kerja audit (KKA) untuk 3 klien manufaktur.",
        ],
      },
    ],
    skills: {
      technical: ["Analisis Laporan Keuangan", "Audit Sampling", "Rekonsiliasi Bank"],
      tools: ["Microsoft Excel (VLOOKUP, Pivot)", "SAP ERP", "Accurate Online"],
      languages: ["Bahasa Indonesia (Lancar)", "English (Conversational)"],
    },
    certifications: [],
    awards: [],
    metadata: {
      language: "id",
      targetPosition: "Junior Auditor",
      targetCompany: "Big 4 Accounting Firm",
      jobDescription: "Dibutuhkan staf audit pemula.",
    },
  };

  it("should generate a valid DOCX buffer with standard ZIP/PK archive signature", async () => {
    const docxBuffer = await generateHarvardDocxBuffer(sampleCvData, true);
    expect(docxBuffer).toBeDefined();
    expect(docxBuffer.length).toBeGreaterThan(1000);

    // .docx files are OpenXML ZIP packages starting with 'PK\x03\x04'
    const pkHeader = docxBuffer.subarray(0, 4).toString("hex");
    expect(pkHeader).toBe("504b0304"); // 'PK\x03\x04' in hex
  });
});
