import { describe, it, expect } from "vitest";
import {
  generateHeuristicExperience,
  generateHeuristicSummary,
} from "@/lib/ai/ai-assist-service";
import {
  validateExperienceBullet,
  validateProfessionalSummary,
} from "@/lib/ai/hallucination-detector";

describe("MASALAH 3: AI Quality & Zero Hallucination Test Suite (10 Input Benchmark)", () => {
  // Test Case 1: Fresh Graduate IT (Web Developer Intern)
  it("Case 1: Fresh Graduate IT - validates action verbs, length, and zero fake numbers", () => {
    const rawText = "Membangun 5 halaman landing page menggunakan React dan Tailwind CSS untuk sistem internal.";
    const result = generateHeuristicExperience({
      rawText,
      role: "Frontend Developer Intern",
      organization: "PT Digital Solusi",
      language: "id",
    });

    expect(result.needsClarification).toBe(false);
    expect(result.variants).toBeDefined();
    expect(result.variants?.length).toBe(2);

    for (const variant of result.variants || []) {
      for (const bullet of variant.bullets) {
        const val = validateExperienceBullet(bullet, rawText, "", "id");
        expect(val.errors).toEqual([]);
        expect(val.valid).toBe(true);
      }
    }
  });

  // Test Case 2: Akuntansi (Magang Audit / Pembukuan)
  it("Case 2: Akuntansi - validates action verb and factual accuracy", () => {
    const rawText = "Memeriksa bukti transaksi 150 faktur pajak dan mencocokkan laporan keuangan di Excel.";
    const result = generateHeuristicExperience({
      rawText,
      role: "Accounting & Audit Intern",
      organization: "KAP Tanubrata",
      language: "id",
    });

    expect(result.needsClarification).toBe(false);
    for (const variant of result.variants || []) {
      for (const bullet of variant.bullets) {
        const val = validateExperienceBullet(bullet, rawText, "", "id");
        expect(val.errors).toEqual([]);
        expect(val.valid).toBe(true);
      }
    }
  });

  // Test Case 3: Marketing (Social Media Specialist)
  it("Case 3: Marketing - converts colloquial marketing tasks into action formula without fake metrics", () => {
    const rawText = "Bikin konten instagram dan tiktok harian serta rekap insight mingguan.";
    const result = generateHeuristicExperience({
      rawText,
      role: "Social Media Staff",
      organization: "Agensi Kreatif",
      language: "id",
    });

    expect(result.needsClarification).toBe(false);
    for (const variant of result.variants || []) {
      for (const bullet of variant.bullets) {
        const val = validateExperienceBullet(bullet, rawText, "", "id");
        expect(val.errors).toEqual([]);
        expect(val.valid).toBe(true);
      }
    }
  });

  // Test Case 4: Tanpa Pengalaman Kerja Formal (Proyek Kuliah & Kepanitiaan Kampus)
  it("Case 4: Fresh Graduate Tanpa Pengalaman Kerja - highlights academic project and summary", () => {
    const rawText = "Ketua divisi logistik wisuda kampus mengurus 20 vendor tenda dan konsumsi.";
    const expResult = generateHeuristicExperience({
      rawText,
      role: "Ketua Divisi Logistik",
      organization: "Kepanitiaan Wisuda ITB",
      category: "organisasi",
      language: "id",
    });

    expect(expResult.needsClarification).toBe(false);
    for (const variant of expResult.variants || []) {
      for (const bullet of variant.bullets) {
        const val = validateExperienceBullet(bullet, rawText, "", "id");
        expect(val.errors).toEqual([]);
        expect(val.valid).toBe(true);
      }
    }

    const summaryResult = generateHeuristicSummary({
      targetPosition: "Operational Management Trainee",
      targetCompany: "Unilever",
      educations: [
        { institution: "Institut Teknologi Bandung", degree: "S1", fieldOfStudy: "Teknik Industri" },
      ],
      skills: { technical: ["Supply Chain", "Vendor Management", "Excel"] },
      language: "id",
    });

    expect(summaryResult.variants.length).toBe(3);
    for (const variant of summaryResult.variants) {
      const val = validateProfessionalSummary(variant);
      expect(val.errors).toEqual([]);
      expect(val.valid).toBe(true);
    }
  });

  // Test Case 5: Teks Berantakan / Informal
  it("Case 5: Teks Berantakan - strips colloquial slang and creates standard Harvard sentences", () => {
    const rawText = "cuma bantuin admin entry data di excel tiap hari sama kirim email";
    const result = generateHeuristicExperience({
      rawText,
      role: "Staff Administrasi",
      organization: "PT Mitra Sejahtera",
      language: "id",
    });

    expect(result.needsClarification).toBe(false);
    for (const variant of result.variants || []) {
      for (const bullet of variant.bullets) {
        const val = validateExperienceBullet(bullet, rawText, "", "id");
        expect(val.errors).toEqual([]);
        expect(val.valid).toBe(true);
        expect(bullet).not.toMatch(/^(cuma|bantuin)/i);
      }
    }
  });

  // Test Case 6: Bahasa Campuran / Jaksel
  it("Case 6: Bahasa Campuran - polishes mixed language into clean formal Indonesian", () => {
    const rawText = "handle client requirement and follow up vendor buat event tahunan";
    const result = generateHeuristicExperience({
      rawText,
      role: "Event Coordinator",
      organization: "Global Media",
      language: "id",
    });

    expect(result.needsClarification).toBe(false);
    for (const variant of result.variants || []) {
      for (const bullet of variant.bullets) {
        const val = validateExperienceBullet(bullet, rawText, "", "id");
        expect(val.errors).toEqual([]);
        expect(val.valid).toBe(true);
      }
    }
  });

  // Test Case 7: Teks Terlalu Pendek / Minim (< 6 kata)
  it("Case 7: Teks Terlalu Minim - asks 3 clarifying questions instead of hallucinating", () => {
    const rawText = "admin kantor";
    const result = generateHeuristicExperience({
      rawText,
      role: "Staff Admin",
      organization: "PT ABC",
      language: "id",
    });

    expect(result.needsClarification).toBe(true);
    expect(result.questions).toBeDefined();
    expect(result.questions?.length).toBe(3);
    expect(result.questions?.[0]).toContain("tugas");
    expect(result.questions?.[1]).toContain("metode");
    expect(result.questions?.[2]).toContain("hasil");
  });

  // Test Case 8: Bahasa Inggris (Computer Science Graduate)
  it("Case 8: English Input - enforces English action verbs and strict word counts", () => {
    const rawText = "Maintained database servers and optimized SQL query execution for internal web tools.";
    const result = generateHeuristicExperience({
      rawText,
      role: "Database Engineer Intern",
      organization: "Cloud Tech Inc",
      language: "en",
    });

    expect(result.needsClarification).toBe(false);
    for (const variant of result.variants || []) {
      for (const bullet of variant.bullets) {
        const val = validateExperienceBullet(bullet, rawText, "", "en");
        expect(val.errors).toEqual([]);
        expect(val.valid).toBe(true);
      }
    }

    const summaryResult = generateHeuristicSummary({
      targetPosition: "Software Engineer",
      targetCompany: "Google",
      educations: [
        { institution: "University of Indonesia", degree: "B.Sc.", fieldOfStudy: "Computer Science" },
      ],
      skills: { technical: ["Go", "Kubernetes", "PostgreSQL"] },
      language: "en",
    });

    for (const variant of summaryResult.variants) {
      const val = validateProfessionalSummary(variant);
      expect(val.errors).toEqual([]);
      expect(val.valid).toBe(true);
    }
  });

  // Test Case 9: Desain Grafis / UI/UX Intern
  it("Case 9: Desain Grafis - validates creative process terminology without fake metrics", () => {
    const rawText = "Merancang 12 wireframe dan prototipe aplikasi mobile di Figma.";
    const result = generateHeuristicExperience({
      rawText,
      role: "UI/UX Designer Intern",
      organization: "Studio Desain",
      language: "id",
    });

    expect(result.needsClarification).toBe(false);
    for (const variant of result.variants || []) {
      for (const bullet of variant.bullets) {
        const val = validateExperienceBullet(bullet, rawText, "", "id");
        expect(val.errors).toEqual([]);
        expect(val.valid).toBe(true);
      }
    }
  });

  // Test Case 10: Customer Service / Operasional
  it("Case 10: Customer Service - preserves real ticket count numbers while enhancing active voice", () => {
    const rawText = "Melayani keluhan 80 pelanggan per hari lewat live chat dan email bantuan.";
    const result = generateHeuristicExperience({
      rawText,
      role: "Customer Support Staff",
      organization: "E-Commerce Nasional",
      language: "id",
    });

    expect(result.needsClarification).toBe(false);
    for (const variant of result.variants || []) {
      for (const bullet of variant.bullets) {
        const val = validateExperienceBullet(bullet, rawText, "", "id");
        expect(val.errors).toEqual([]);
        expect(val.valid).toBe(true);
      }
    }
  });
});
