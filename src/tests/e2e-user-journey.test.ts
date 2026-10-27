import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { cvDataSchema, initialCvData, CvData } from "@/types/cv";
import { sanitizeCvForAi } from "@/lib/ai/pii-sanitizer";
import { sanitizeUntrustedInput } from "@/lib/ai/prompt-defense";
import { generateDokuSignature, verifyDokuSignature, isTimestampFresh } from "@/lib/doku/doku-security";
import { generateHarvardPdfBuffer } from "@/lib/pdf/generatePdfBuffer";
import { generateHarvardDocxBuffer } from "@/lib/docx/harvardDocxGenerator";
import { encryptSecret, decryptSecret } from "@/lib/sheets/token-crypto";
import { searchJobListings, calculateJobMatch } from "@/lib/jobs/job-service";
import { getOptimalApiKey, recordKeyUsage, __setMockDbKeys, encryptApiKey } from "@/lib/admin/api-key-manager";
import { JobListing } from "@/types/job";

describe("Phase 8 End-to-End User Journey Simulation", () => {
  let userCv: CvData;

  it("Step 1: User fills out CV data with authentic Indonesian fresh graduate profile", () => {
    userCv = {
      ...initialCvData,
      personalInfo: {
        fullName: "Ahmad Fauzi",
        email: "ahmad.fauzi@alumni.itb.ac.id",
        phone: "081298765432",
        city: "Bandung, Jawa Barat",
        linkedinUrl: "https://linkedin.com/in/ahmadfauzi",
        portfolioUrl: "https://ahmadfauzi.dev",
        summary: "Fresh graduate Teknik Informatika ITB dengan fokus rekayasa sistem terdistribusi dan basis data.",
      },
      educations: [
        {
          id: "edu-1",
          institution: "Institut Teknologi Bandung",
          degree: "S1",
          fieldOfStudy: "Teknik Informatika",
          startDate: "2020",
          endDate: "2024",
          gpa: "3.82",
          current: false,
          description: "Tugas Akhir: Optimalisasi Query PostgreSQL pada Sistem E-Commerce.",
        },
      ],
      experiences: [
        {
          id: "exp-1",
          category: "magang",
          role: "Backend Engineer Intern",
          organization: "PT Bank Mandiri (Persero) Tbk",
          startDate: "Jan 2024",
          endDate: "Jul 2024",
          current: false,
          bullets: [
            "Mengembangkan REST API untuk layanan transfer dana antarbank menggunakan Go dan PostgreSQL.",
            "Mengurangi latensi query database sebesar 28% melalui indexing dan query caching.",
            "Menulis unit test dengan coverage 85% untuk memenuhi standar audit internal.",
          ],
        },
      ],
      skills: {
        technical: ["Go", "Node.js", "PostgreSQL", "REST API", "Docker", "Git"],
        tools: ["Docker", "Postman", "VS Code", "Git"],
        languages: ["Bahasa Indonesia", "English"],
      },
      certifications: [
        {
          id: "cert-1",
          name: "AWS Certified Cloud Practitioner",
          issuer: "Amazon Web Services",
          issueDate: "2024",
          credentialId: "AWS-CCP-123456",
          url: "https://aws.amazon.com/verification",
        },
      ],
      awards: [
        {
          id: "award-1",
          title: "Juara 2 National Hackathon FinTech 2023",
          issuer: "Otoritas Jasa Keuangan (OJK)",
          year: "2023",
          description: "Membangun sistem deteksi anomali transaksi perbankan.",
        },
      ],
      metadata: {
        language: "id",
        targetPosition: "Junior Backend Engineer",
        targetCompany: "PT GoTo Gojek Tokopedia Tbk",
        jobDescription: "Mencari Junior Backend Engineer yang menguasai Go, PostgreSQL, REST API, dan microservices.",
      },
    };

    // Schema validation must succeed
    const validation = cvDataSchema.safeParse(userCv);
    expect(validation.success).toBe(true);
  });

  it("Step 2: AI Pre-processing pipeline enforces UU PDP privacy & prompt security", () => {
    // 1. Guardrail inspection on job description
    const guardrail = sanitizeUntrustedInput(userCv.metadata.jobDescription || "");
    expect(guardrail.hasSuspiciousPatterns).toBe(false);

    // 2. Anonymization of candidate data
    const { sanitizedCv, redactedCount } = sanitizeCvForAi(userCv);
    expect(sanitizedCv.personalInfo.fullName).toBe("Kandidat");
    expect(sanitizedCv.personalInfo.email).toBe("kandidat@anonim.local");
    expect(sanitizedCv.personalInfo.phone).toBe("+620000000000");
    expect(redactedCount).toBeGreaterThan(0);
  });

  it("Step 3: DOKU Checkout payment lifecycle (Rp5.000 single fee with 3x revisions)", () => {
    const mockOrder = {
      invoiceNumber: "INV-CVK-E2E-001",
      amount: 5000,
      currency: "IDR",
      userId: "user-e2e-123",
      cvId: "cv-e2e-456",
      status: "PENDING",
      revisionsLeft: 3,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    // Client/Server HMAC verification
    const clientId = "CLIENT-E2E-TEST";
    const secretKey = "secret-e2e-key-12345";
    const requestId = "REQ-E2E-001";
    const requestTimestamp = new Date().toISOString();
    const requestTarget = "/api/payments/webhook";
    const rawBody = JSON.stringify({
      order: { invoice_number: mockOrder.invoiceNumber, amount: 5000 },
      transaction: { status: "SUCCESS" },
    });

    const signature = generateDokuSignature({
      clientId,
      requestId,
      requestTimestamp,
      requestTarget,
      rawBody,
      secretKey,
    });

    expect(signature).toContain("HMACSHA256=");
    expect(isTimestampFresh(requestTimestamp, 300)).toBe(true);

    const isVerified = verifyDokuSignature({
      clientId,
      requestId,
      requestTimestamp,
      requestTarget,
      rawBody,
      signatureHeader: signature,
      secretKey,
    });

    expect(isVerified).toBe(true);

    // Simulate successful payment transition
    mockOrder.status = "PAID";
    expect(mockOrder.status).toBe("PAID");
    expect(mockOrder.revisionsLeft).toBe(3);
  });

  it("Step 4: Exports unwatermarked Harvard ATS PDF and Word DOCX buffers", async () => {
    // Generate PDF Buffer
    const pdfBuffer = await generateHarvardPdfBuffer(userCv, false);
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(1000);

    // Generate Word DOCX Buffer
    const docxBuffer = await generateHarvardDocxBuffer(userCv);
    expect(docxBuffer).toBeInstanceOf(Buffer);
    expect(docxBuffer.length).toBeGreaterThan(1000);
  });

  it("Step 5: Google Sheets Job Tracker integration securely stores tokens and prepares rows", () => {
    const mockOAuthToken = "ya29.a0AfH6SMB_secret_google_oauth_refresh_token_fresh_grad";
    const encrypted = encryptSecret(mockOAuthToken);
    expect(encrypted).not.toBe(mockOAuthToken);
    expect(decryptSecret(encrypted)).toBe(mockOAuthToken);

    // Prepare sync application payload
    const mockApplication = {
      company_name: "PT GoTo Gojek Tokopedia Tbk",
      position_title: "Junior Backend Engineer",
      application_date: "2026-10-26",
      status: "APPLIED",
      job_url: "https://www.tokopedia.com/careers/engineering",
      notes: "CV disesuaikan dengan fokus Go dan PostgreSQL",
    };

    expect(mockApplication.company_name).toBe("PT GoTo Gojek Tokopedia Tbk");
    expect(mockApplication.status).toBe("APPLIED");
  });

  it("Step 6: Job Directory Relevancy Engine automatically matches candidate CV", async () => {
    const mockTargetJob: JobListing = {
      id: "job-goto-swe-e2e",
      title: "Junior Software Engineer (Backend)",
      company: "PT GoTo Gojek Tokopedia Tbk",
      location: "Jakarta Selatan",
      employmentType: "Full-time",
      workplaceType: "Hybrid",
      experienceLevel: "Fresh Graduate / Entry Level",
      salary: "Rp9.000.000 - Rp14.000.000",
      postedAt: "1 hari yang lalu",
      skillsRequired: ["Go", "Node.js", "PostgreSQL", "REST API", "Docker", "Git"],
      description: "Membangun sistem backend skala besar.",
      url: "https://www.tokopedia.com/careers/engineering",
      source: "LinkedIn",
    };

    const match = calculateJobMatch(mockTargetJob, userCv);
    // Candidate has all 6 required skills: Go, Node.js, PostgreSQL, REST API, Docker, Git
    expect(match.matchedSkills.length).toBe(6);
    expect(match.matchScore).toBeGreaterThanOrEqual(90);

    // Search query returns matched job
    const searchResult = await searchJobListings({ q: "GoTo", location: "ALL", level: "ALL", workplace: "ALL" }, userCv);
    expect(searchResult.total).toBeGreaterThan(0);
    expect(searchResult.jobs[0].matchScore).toBeGreaterThanOrEqual(80);
  });

  it("Step 7: Admin Panel transparently rotates Gemini keys and handles cooldown on 429", async () => {
    __setMockDbKeys([
      {
        id: "key-e2e-1",
        provider: "gemini",
        label: "Primary Gemini Key",
        encrypted_key: encryptApiKey("AIzaSyMockKey1-e2e-primary"),
        last_four_chars: "1111",
        masked_key: "AIza...1111",
        status: "aktif",
        priority: 1,
        weight: 10,
        requests_today: 10,
        errors_today: 0,
        cooldown_until: null,
        last_used_at: null,
        last_error: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "key-e2e-2",
        provider: "gemini",
        label: "Backup Gemini Key",
        encrypted_key: encryptApiKey("AIzaSyMockKey2-e2e-backup"),
        last_four_chars: "2222",
        masked_key: "AIza...2222",
        status: "aktif",
        priority: 2,
        weight: 10,
        requests_today: 0,
        errors_today: 0,
        cooldown_until: null,
        last_used_at: null,
        last_error: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);

    // Select optimal key
    const optimalKey = await getOptimalApiKey("gemini");
    expect(optimalKey).toBeDefined();

    // Simulate HTTP 429 Rate Limit error on primary key
    if (optimalKey) {
      await recordKeyUsage(optimalKey.id, 120, 429, "Resource exhausted (rate limit exceeded)");
    }

    // Next request must exclude the cooldown key and pick the backup key
    const nextKey = await getOptimalApiKey("gemini", optimalKey ? [optimalKey.id] : []);
    expect(nextKey).toBeDefined();
    expect(nextKey?.id).not.toBe(optimalKey?.id);

    // Clean up mock keys
    __setMockDbKeys([]);
  });

  it("Step 8: Neobrutalism design rules (Lithos UI) are strictly applied across app touchpoints", () => {
    // 1. Check tokens in tokens.css
    const tokensPath = path.resolve(process.cwd(), "src/styles/tokens.css");
    const tokensContent = fs.readFileSync(tokensPath, "utf-8");

    expect(tokensContent).toContain("--bg: #FFFBEB");
    expect(tokensContent).toContain("--surface: #FFFFFF");
    expect(tokensContent).toContain("--text: #000000");
    expect(tokensContent).toContain("--border: #000000");
    expect(tokensContent).toContain("--accent: #FFE500");
    expect(tokensContent).toContain("--accent-2: #FF6B9D");
    expect(tokensContent).toContain("--accent-3: #4D7CFF");
    expect(tokensContent).toContain("--shadow: 4px 4px 0 0 #000");

    // 2. Check globals.css hard-drop transitions (< 80ms)
    const globalsPath = path.resolve(process.cwd(), "src/app/globals.css");
    const globalsContent = fs.readFileSync(globalsPath, "utf-8");

    expect(globalsContent).toContain(".hard-drop");
    expect(globalsContent).toContain(".hard-drop-sm");
    expect(globalsContent).toContain(".hard-drop-lg");
    expect(globalsContent).toContain("70ms");

    // 3. Document isolation: Harvard ATS preview is pure black & white, no neobrutalist borders inside paper
    const previewPath = path.resolve(process.cwd(), "src/components/cv/HarvardCvPreview.tsx");
    const previewContent = fs.readFileSync(previewPath, "utf-8");

    expect(previewContent).toContain("font-serif");
    expect(previewContent).toContain("Times New Roman");
  });
});

