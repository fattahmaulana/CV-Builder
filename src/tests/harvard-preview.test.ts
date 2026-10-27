import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { HarvardCvPreview } from "@/components/cv/HarvardCvPreview";
import { CvData } from "@/types/cv";

describe("Harvard ATS HTML/CSS Preview Component", () => {
  const mockCvData: CvData = {
    personalInfo: {
      fullName: "Budi Santoso",
      email: "budi.santoso@example.com",
      phone: "+628123456789",
      city: "Jakarta Selatan",
      linkedinUrl: "https://linkedin.com/in/budisantoso",
      portfolioUrl: "https://budisantoso.dev",
      summary: "Fresh graduate Sistem Informasi dengan keahlian analisis data.",
    },
    educations: [
      {
        id: "edu-1",
        institution: "Universitas Indonesia",
        degree: "Sarjana Ilmu Komputer (S1)",
        fieldOfStudy: "Sistem Informasi",
        gpa: "3.82 / 4.00",
        startDate: "Agu 2020",
        endDate: "Jul 2024",
        city: "Depok",
        current: false,
        description: "Mata Kuliah Relevan: Algoritma, Basis Data, Rekayasa Perangkat Lunak.",
      },
    ],
    experiences: [
      {
        id: "exp-1",
        category: "magang",
        role: "Software Engineering Intern",
        organization: "PT Teknologi Bangsa",
        startDate: "Feb 2024",
        endDate: "Jun 2024",
        city: "Jakarta",
        current: false,
        bullets: [
          "Mengembangkan modul backend pembayaran menggunakan Node.js dan PostgreSQL.",
          "Meningkatkan kecepatan query pelaporan transaksi sebesar 35%.",
        ],
      },
    ],
    skills: {
      technical: ["TypeScript", "Next.js", "PostgreSQL", "REST APIs"],
      tools: ["Git", "Docker", "VS Code", "Postman"],
      languages: ["Bahasa Indonesia (Native)", "Bahasa Inggris (Profesional)"],
    },
    certifications: [
      {
        id: "cert-1",
        name: "Google Data Analytics Professional Certificate",
        issuer: "Coursera / Google",
        issueDate: "2023",
        credentialId: "GDA-12345",
        url: "",
      },
    ],
    awards: [
      {
        id: "award-1",
        title: "Juara 2 Hackathon Nasional",
        issuer: "Kementerian Kominfo",
        year: "2023",
        description: "Mengembangkan purwarupa aplikasi distribusi logistik UMKM.",
      },
    ],
    metadata: {
      language: "id",
      targetPosition: "Junior Backend Developer",
      targetCompany: "Unicorn Tech",
      jobDescription: "Mencari lulusan baru yang memahami REST API dan SQL.",
    },
  };

  it("should render candidate personal details and contact points", () => {
    const html = renderToStaticMarkup(
      React.createElement(HarvardCvPreview, { data: mockCvData, isPaid: true })
    );

    expect(html).toContain("Budi Santoso");
    expect(html).toContain("budi.santoso@example.com");
    expect(html).toContain("+628123456789");
    expect(html).toContain("Jakarta Selatan");
    expect(html).toContain("linkedin.com/in/budisantoso");
  });

  it("should render standard Harvard uppercase section headings", () => {
    const html = renderToStaticMarkup(
      React.createElement(HarvardCvPreview, { data: mockCvData, isPaid: true })
    );

    expect(html).toContain("PENDIDIKAN");
    expect(html).toContain("PENGALAMAN");
    expect(html).toContain("KEAHLIAN");
    expect(html).toContain("SERTIFIKASI");
    expect(html).toContain("PENGHARGAAN");
  });

  it("should render bullet points with bullet characters", () => {
    const html = renderToStaticMarkup(
      React.createElement(HarvardCvPreview, { data: mockCvData, isPaid: true })
    );

    expect(html).toContain("Mengembangkan modul backend pembayaran");
    expect(html).toContain("Meningkatkan kecepatan query");
  });

  it("should display watermark when isPaid is false", () => {
    const html = renderToStaticMarkup(
      React.createElement(HarvardCvPreview, { data: mockCvData, isPaid: false })
    );

    expect(html).toContain("PREVIEW ATS");
  });

  it("should NOT display watermark when isPaid is true", () => {
    const html = renderToStaticMarkup(
      React.createElement(HarvardCvPreview, { data: mockCvData, isPaid: true })
    );

    expect(html).not.toContain("PREVIEW");
  });
});
