import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CvEditor, SkillTagInput } from "@/components/cv/CvEditor";
import { HarvardCvPreview } from "@/components/cv/HarvardCvPreview";
import { AiDiffModal } from "@/components/cv/AiDiffModal";
import { CvData } from "@/types/cv";

describe("Phase 3: Neobrutalist CV Editor & Plain ATS Harvard Preview", () => {
  const mockCvData: CvData = {
    personalInfo: {
      fullName: "Budi Pratama",
      email: "budi.pratama@example.com",
      phone: "0812-3456-7890",
      city: "Jakarta Selatan",
      linkedinUrl: "https://linkedin.com/in/budipratama",
      portfolioUrl: "https://github.com/budipratama",
      summary: "Fresh graduate Sistem Informasi dengan minat analitika data.",
    },
    educations: [
      {
        id: "edu-1",
        institution: "Universitas Indonesia",
        degree: "Sarjana (S1)",
        fieldOfStudy: "Sistem Informasi",
        gpa: "3.85 / 4.00",
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
        organization: "PT Digital Nusantara",
        startDate: "Feb 2024",
        endDate: "Jul 2024",
        city: "Jakarta",
        current: false,
        bullets: [
          "Menganalisis 50.000+ baris data log transaksi menggunakan SQL dan Python.",
          "Meningkatkan akurasi deteksi anomali sebesar 28%.",
        ],
      },
    ],
    skills: {
      technical: ["SQL", "Python", "Tableau", "PostgreSQL"],
      tools: ["Git", "Excel", "VS Code"],
      languages: ["Bahasa Indonesia", "English"],
    },
    certifications: [
      {
        id: "cert-1",
        name: "Google Data Analytics Professional Certificate",
        issuer: "Coursera",
        issueDate: "2024",
        credentialId: "GDA-987",
        url: "",
      },
    ],
    awards: [],
    metadata: {
      language: "id",
      targetPosition: "Junior Data Analyst",
      targetCompany: "GoTo Group",
      jobDescription: "Mencari lulusan baru yang mahir SQL dan visualisasi data.",
    },
  };

  it("should render 6-step stepper with sequence numbers 01 to 06", () => {
    const html = renderToStaticMarkup(
      React.createElement(CvEditor, {
        cvId: "test-cv-123",
        initialData: mockCvData,
        initialTitle: "CV Budi Pratama Data Analyst",
        isPaid: false,
      })
    );

    expect(html).toContain("01");
    expect(html).toContain("Data Diri");
    expect(html).toContain("02");
    expect(html).toContain("Pendidikan");
    expect(html).toContain("03");
    expect(html).toContain("Pengalaman");
    expect(html).toContain("04");
    expect(html).toContain("Keahlian");
    expect(html).toContain("05");
    expect(html).toContain("Sertifikasi");
    expect(html).toContain("06");
    expect(html).toContain("Target Lowongan");
  });

  it("should incorporate Neobrutalist design tokens in editor container", () => {
    const html = renderToStaticMarkup(
      React.createElement(CvEditor, {
        cvId: "test-cv-123",
        initialData: mockCvData,
        initialTitle: "CV Budi Pratama",
        isPaid: false,
      })
    );

    // Thick border and hard-drop shadow tokens
    expect(html).toContain("border-b-[3px] border-black");
    expect(html).toContain("border-[3px] border-black");
    expect(html).toContain("hard-drop");
    expect(html).toContain("Pratinjau Format Harvard (ATS)");
  });

  it("should preserve plain Harvard ATS document typography in preview", () => {
    const html = renderToStaticMarkup(
      React.createElement(HarvardCvPreview, {
        data: mockCvData,
        isPaid: true,
      })
    );

    // Must strictly follow Times New Roman and ATS plain structure
    expect(html).toContain("Times New Roman");
    expect(html).toContain("Budi Pratama");
    expect(html).toContain("PENDIDIKAN");
    expect(html).toContain("PENGALAMAN KERJA &amp; ORGANISASI");
    expect(html).toContain("KEAHLIAN");
    expect(html).not.toContain("PREVIEW ATS"); // no watermark when paid
  });

  it("should display ATS watermark overlay when preview is unpaid", () => {
    const html = renderToStaticMarkup(
      React.createElement(HarvardCvPreview, {
        data: mockCvData,
        isPaid: false,
      })
    );

    expect(html).toContain("PREVIEW ATS");
  });

  it("should render Neobrutalist AiDiffModal with hard borders and no blur", () => {
    const mockOptimized = {
      matchScore: 84,
      summary: "Junior Data Analyst lulusan Universitas Indonesia...",
      experiences: [
        {
          id: "exp-1",
          role: "Data Analyst Intern",
          organization: "PT Digital Nusantara",
          bullets: [
            "Mengoptimalkan 50.000+ kueri SQL transaksi untuk mempercepat pelaporan 28%.",
          ],
        },
      ],
      skills: {
        technical: ["SQL", "Python", "Tableau", "BigQuery"],
        tools: ["Git", "Excel", "VS Code"],
        languages: ["Bahasa Indonesia", "English"],
      },
      matchAnalysis: {
        matchedKeywords: ["SQL", "Data Analyst", "Python"],
        missingKeywords: ["BigQuery", "ETL"],
        recommendations: ["Tonjolkan proyek berbasis BigQuery."],
        strengths: ["Latar belakang pendidikan relevan dengan posisi analitika data."],
      },
    };

    const html = renderToStaticMarkup(
      React.createElement(AiDiffModal, {
        isOpen: true,
        onClose: () => {},
        originalCv: mockCvData,
        optimized: mockOptimized,
        isLoading: false,
        onApplyAll: () => {},
        onApplyBullet: () => {},
        onApplySummary: () => {},
        onApplySkills: () => {},
      })
    );

    // Verify modal styling
    expect(html).toContain("Skor Kecocokan: 84%");
    expect(html).toContain("border-[3px] border-black");
    expect(html).toContain("bg-[var(--accent)]");
    expect(html).not.toContain("backdrop-blur");
    expect(html).toContain("Terapkan Semua Saran AI");
  });

  it("should render Section 04 Keahlian with interactive SkillTagInput and badge counts", () => {
    const html = renderToStaticMarkup(
      React.createElement(CvEditor, {
        cvId: "test-cv-skills",
        initialData: mockCvData,
        initialTitle: "CV Budi Pratama",
        isPaid: false,
        initialStep: 3,
      })
    );

    expect(html).toContain("04. Keahlian &amp; Perangkat Lunak");
    expect(html).toContain("Keahlian Teknis (Hard Skills)");
    expect(html).toContain("Perangkat Lunak / Tools");
    expect(html).toContain("Kemampuan Bahasa");
    expect(html).toContain("SQL");
    expect(html).toContain("Python");
    expect(html).toContain("Tableau");
    expect(html).toContain("4 item");
  });

  it("should support multi-word skills with spaces, commas, and interactive badges in SkillTagInput", () => {
    const skills = ["Google Cloud Platform", "Next.js", "Data Analysis", "English (Fluent)"];
    const html = renderToStaticMarkup(
      React.createElement(SkillTagInput, {
        label: "Keahlian Teknis (Hard Skills)",
        value: skills,
        onChange: () => {},
        placeholder: "e.g. React, TypeScript",
      })
    );

    // Multi-word skills with spaces must be preserved
    expect(html).toContain("Google Cloud Platform");
    expect(html).toContain("Data Analysis");
    expect(html).toContain("English (Fluent)");
    expect(html).toContain("4 item");
    // Raw input value must contain comma and space separation
    expect(html).toContain('value="Google Cloud Platform, Next.js, Data Analysis, English (Fluent)"');
  });
});


