import {
  EXPERIENCE_ASSIST_SYSTEM_PROMPT_V1,
  buildExperienceAssistUserPromptV1,
} from "./prompts/experience-v1";
import {
  SUMMARY_ASSIST_SYSTEM_PROMPT_V1,
  buildSummaryAssistUserPromptV1,
} from "./prompts/summary-v1";
import {
  validateExperienceBullet,
  validateProfessionalSummary,
} from "./hallucination-detector";
import { GoogleGenAI, Type } from "@google/genai";
import {
  getOptimalApiKey,
  recordKeyUsage,
  getKeyPoolCooldownStatus,
  AiQueueFullError,
  AiUnavailableError,
} from "@/lib/admin/api-key-manager";

export interface ExperienceAssistResult {
  needsClarification: boolean;
  questions?: string[];
  variants?: Array<{
    variantName: string;
    bullets: string[];
  }>;
}

export interface SummaryAssistResult {
  variants: string[];
}

/**
 * Heuristic fallback for experience assistance
 */
export function generateHeuristicExperience(params: {
  rawText: string;
  role?: string;
  organization?: string;
  category?: string;
  language?: "id" | "en";
}): ExperienceAssistResult {
  const isEn = params.language === "en";
  const rawWords = params.rawText.trim().split(/\s+/).filter(Boolean);

  // Check if text is too sparse (< 6 words)
  if (rawWords.length < 6) {
    return {
      needsClarification: true,
      questions: isEn
        ? [
            "What were your main daily duties or key tasks in this role?",
            "Which software tools, programming languages, or methodologies did you use?",
            "What quantifiable achievements, numbers, or positive outcomes resulted from your work?",
          ]
        : [
            "Apa tugas atau tanggung jawab harian utamamu dalam peran ini?",
            "Aplikasi, bahasa pemrograman, atau metode apa yang kamu gunakan?",
            "Apa hasil atau dampak nyata (angka jika ada) dari pekerjaanmu?",
          ],
    };
  }

  const role = params.role || (isEn ? "Role" : "Posisi");
  let cleanInput = params.rawText
    .replace(/^(tugas\s+saya|tugasnya|bantu|ikut|membantu|ngerjain|saya|aku|kami|sebagai|menjabat\s+sebagai)\s+/gi, "")
    .replace(/\b(saya|aku|kami)\b/gi, "")
    .replace(/[.]+$/, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleanInput) {
    cleanInput = role;
  }

  // Extract user numbers only if not an unqualified duration (like '1 tahun', '3 bulan')
  const isDurationNumber = /\b\d+\s*(?:tahun|thn|bulan|bln|hari|minggu|jam|year|month|day|week)\b/i.test(params.rawText);
  const userNumbers = params.rawText.match(/\b\d+(?:[.,]\d+)?%?\b/g) || [];
  const metricSnippet = (!isDurationNumber && userNumbers.length > 0) ? ` sebanyak ${userNumbers[0]}` : "";
  const metricSnippetEn = (!isDurationNumber && userNumbers.length > 0) ? ` handling ${userNumbers[0]}` : "";

  if (isEn) {
    return {
      needsClarification: false,
      variants: [
        {
          variantName: "Variant A (Technical & Process Focus)",
          bullets: [
            `Managed end-to-end execution of ${cleanInput.toLowerCase()}${metricSnippetEn} following industry-standard operational procedures to achieve target milestones.`,
            `Analyzed core workflows and resolved issues promptly to ensure high quality standards across all designated project deliverables.`,
            `Collaborated with cross-functional team members to streamline daily execution and maintain consistent operational performance across initiatives.`,
          ],
        },
        {
          variantName: "Variant B (Execution & Impact Focus)",
          bullets: [
            `Developed and organized systematic approaches for ${cleanInput.toLowerCase()}${metricSnippetEn} to support strategic organizational objectives effectively.`,
            `Coordinated daily project activities, verifying technical accuracy and ensuring timely completion of all scheduled team deliverables.`,
            `Optimized standard operational procedures across departmental workflows to maintain seamless productivity and enhance team collaboration.`,
          ],
        },
      ],
    };
  }

  return {
    needsClarification: false,
    variants: [
      {
        variantName: "Varian A (Fokus Teknis & Proses)",
        bullets: [
          `Mengembangkan alur kerja terstruktur untuk ${cleanInput.toLowerCase()}${metricSnippet} sesuai dengan prosedur standar operasional organisasi.`,
          `Menganalisis kebutuhan harian dan menyelesaikan kendala teknis secara teliti guna menjaga mutu keluaran tugas divisi.`,
          `Mengkoordinasikan pelaksanaan program bersama tim lintas fungsi untuk mencapai target penyelesaian proyek tepat waktu.`,
        ],
      },
      {
        variantName: "Varian B (Fokus Eksekusi & Solusi)",
        bullets: [
          `Menyusun rencana kerja dan mengeksekusi ${cleanInput.toLowerCase()}${metricSnippet} secara konsisten dengan standar akurasi tinggi perusahaan.`,
          `Mengelola dokumentasi teknis dan alur komunikasi antaranggota tim guna mendukung efektivitas penyelesaian operasional harian.`,
          `Mengevaluasi hasil kegiatan serta memberikan rekomendasi perbaikan berkala untuk meningkatkan efisiensi proses kerja operasional.`,
        ],
      },
    ],
  };
}

/**
 * Heuristic fallback for professional summary
 */
export function generateHeuristicSummary(params: {
  targetPosition?: string;
  targetCompany?: string;
  educations?: Array<{ institution: string; degree: string; fieldOfStudy: string }>;
  skills?: { technical?: string[]; tools?: string[] };
  experiences?: Array<{ role: string; organization: string }>;
  language?: "id" | "en";
}): SummaryAssistResult {
  const isEn = params.language === "en";
  const pos = params.targetPosition || (isEn ? "Target Role" : "Posisi Target");
  const comp = params.targetCompany ? (isEn ? ` at ${params.targetCompany}` : ` di ${params.targetCompany}`) : "";

  const edu = params.educations?.[0];
  const eduStr = edu
    ? `${edu.degree} ${edu.fieldOfStudy} dari ${edu.institution}`
    : "Lulusan sarjana berprestasi";
  const eduStrEn = edu
    ? `${edu.degree} graduate in ${edu.fieldOfStudy} from ${edu.institution}`
    : "Distinguished university graduate";

  const topSkills = (params.skills?.technical || []).slice(0, 3).join(", ") || (isEn ? "analytical methods" : "analisis data");

  if (isEn) {
    return {
      variants: [
        // Variant 1: Skills-forward (40-60 words)
        `Dedicated ${eduStrEn} pursuing an impactful ${pos} opportunity${comp}. Possesses strong technical proficiency in ${topSkills} combined with solid analytical and problem-solving abilities demonstrated through hands-on coursework and team projects. Prepared to deliver high-quality contributions and adapt quickly to accelerate company milestones.`,

        // Variant 2: Project-driven (40-60 words)
        `Motivated ${pos} candidate with rigorous academic background as ${eduStrEn}. Proven capability in coordinating cross-functional initiatives and applying ${topSkills} to resolve operational challenges. Ready to leverage disciplined execution and continuous learning to support team efficiency and strategic business objectives.`,

        // Variant 3: Growth & Value (40-60 words)
        `Adaptive professional with a foundation in ${eduStrEn}, focused on excelling as ${pos}${comp}. Demonstrates expertise in ${topSkills} with a strong track record of timely project completion and collaborative achievement. Eager to drive operational excellence and sustainable value for the organization.`,
      ],
    };
  }

  return {
    variants: [
      // Variant 1: Keahlian Teknis (40-60 kata)
      `Lulusan ${eduStr} dengan fokus karir terarah untuk berkontribusi sebagai ${pos}${comp}. Memiliki kompetensi solid dalam ${topSkills} serta kemampuan pemecahan masalah yang teruji melalui proyek akademik dan organisasi. Siap mendedikasikan ketelitian kerja dan adaptabilitas tinggi guna mempercepat pencapaian target operasional perusahaan.`,

      // Variant 2: Eksekusi Proyek (40-60 kata)
      `Kandidat profesional berlatar belakang ${eduStr} yang antusias mengembangkan karir di bidang ${pos}. Berpengalaman mengkoordinasikan tugas tim secara sistematis dan mengaplikasikan ${topSkills} untuk menyelesaikan tantangan operasional. Berkomitmen menghadirkan kinerja terukur serta kolaborasi positif demi mendukung produktivitas divisi kerja secara konsisten.`,

      // Variant 3: Nilai Tambah & Pertumbuhan (40-60 kata)
      `Lulusan berprestasi ${eduStr} dengan aspirasi kuat untuk memberikan dampak nyata sebagai ${pos}${comp}. Menguasai ${topSkills} yang dipadukan dengan keterampilan komunikasi efektif dan etos kerja profesional. Siap memberikan nilai tambah langsung melalui eksekusi rencana kerja yang disiplin dan berorientasi pada hasil optimal.`,
    ],
  };
}

/**
 * Main Experience Bullet Point Assistant
 */
export async function assistExperienceWithAi(params: {
  rawText: string;
  role?: string;
  organization?: string;
  category?: string;
  targetPosition?: string;
  jobDescription?: string;
  language: "id" | "en";
}): Promise<ExperienceAssistResult> {
  // If input is sparse, return questions immediately
  const rawWords = params.rawText.trim().split(/\s+/).filter(Boolean);
  if (rawWords.length < 6) {
    return generateHeuristicExperience(params);
  }

  const prompt = buildExperienceAssistUserPromptV1(params);
  const schema = {
    type: Type.OBJECT,
    properties: {
      needsClarification: { type: Type.BOOLEAN },
      questions: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
      variants: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            variantName: { type: Type.STRING },
            bullets: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ["variantName", "bullets"],
        },
      },
    },
    required: ["needsClarification"],
  };

  const MAX_RETRIES = 3;
  const attemptedKeyIds: string[] = [];

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const keyData = await getOptimalApiKey("gemini", attemptedKeyIds);
    if (!keyData) {
      break;
    }
    attemptedKeyIds.push(keyData.id);

    const isMock = !keyData.key || keyData.key.startsWith("mock-");
    if (isMock) {
      return generateHeuristicExperience(params);
    }

    const startTime = Date.now();
    try {
      const ai = new GoogleGenAI({ apiKey: keyData.key });
      const primaryModel = process.env.GEMINI_MODEL || "gemini-3.5-flash";
      const fallbackModel = process.env.GEMINI_FALLBACK_MODEL || "gemini-3.5-flash-lite";

      const callWithTimeout = (modelName: string, timeoutMs = 12000) =>
        Promise.race([
          ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              systemInstruction: EXPERIENCE_ASSIST_SYSTEM_PROMPT_V1,
              responseMimeType: "application/json",
              responseSchema: schema,
              temperature: 0.2, // low temperature for zero hallucination
            },
          }),
          new Promise<never>((_, reject) => {
            const timer = setTimeout(() => {
              reject(new Error(`Gemini API call timed out after ${Math.round(timeoutMs / 1000)} seconds`));
            }, timeoutMs);
            if (typeof timer.unref === "function") timer.unref();
          }),
        ]);

      let response;
      try {
        response = await callWithTimeout(primaryModel, 12000);
      } catch (firstErr: unknown) {
        console.warn(
          `Gemini primary model ${primaryModel} failed (${firstErr instanceof Error ? firstErr.message : "Error"}). Cascading to fallback model ${fallbackModel}...`
        );
        response = await callWithTimeout(fallbackModel, 12000);
      }

      const latencyMs = Date.now() - startTime;
      await recordKeyUsage(keyData.id, latencyMs);

      const jsonText = response.text || "{}";
      const parsed = JSON.parse(jsonText) as ExperienceAssistResult;

      if (parsed.needsClarification) {
        return parsed;
      }

      // Server-side validation against fabricated numbers
      if (parsed.variants && parsed.variants.length > 0) {
        let allValid = true;
        for (const variant of parsed.variants) {
          for (const bullet of variant.bullets) {
            const val = validateExperienceBullet(bullet, params.rawText, params.jobDescription || "", params.language);
            if (!val.valid) {
              allValid = false;
              break;
            }
          }
        }

        if (allValid) {
          return parsed;
        }
      }

      // If validation failed, return heuristic
      return generateHeuristicExperience(params);
    } catch (err: unknown) {
      const latencyMs = Date.now() - startTime;
      const errMsg = err instanceof Error ? err.message : "Unknown Gemini Error";
      const is429 = /429|quota|rate limit/i.test(errMsg);
      const statusCode = is429 ? 429 : 500;

      await recordKeyUsage(keyData.id, latencyMs, statusCode, errMsg);
      console.warn(
        `Gemini experience assist attempt ${attempt + 1} with key ${keyData.id} failed (${statusCode}): ${errMsg}. Retrying next available key...`
      );

      if (attempt < MAX_RETRIES - 1) {
        await new Promise((r) => setTimeout(r, 300));
      }
    }
  }

  // Check if keys are exhausted due to rate limit/cooldown
  const poolStatus = await getKeyPoolCooldownStatus("gemini");
  if (poolStatus.inCooldownCount > 0 && poolStatus.totalKeys > 0) {
    throw new AiQueueFullError(poolStatus.earliestCooldownSeconds);
  }
  if (poolStatus.totalKeys === 0 && !process.env.GEMINI_API_KEY) {
    throw new AiUnavailableError();
  }

  return generateHeuristicExperience(params);
}

/**
 * Main Professional Summary Assistant
 */
export async function assistSummaryWithAi(params: {
  targetPosition?: string;
  targetCompany?: string;
  educations?: Array<{ institution: string; degree: string; fieldOfStudy: string }>;
  skills?: { technical?: string[]; tools?: string[] };
  experiences?: Array<{ role: string; organization: string; bullets: string[] }>;
  language: "id" | "en";
}): Promise<SummaryAssistResult> {
  const prompt = buildSummaryAssistUserPromptV1(params);
  const schema = {
    type: Type.OBJECT,
    properties: {
      variants: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
    },
    required: ["variants"],
  };

  const MAX_RETRIES = 3;
  const attemptedKeyIds: string[] = [];

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const keyData = await getOptimalApiKey("gemini", attemptedKeyIds);
    if (!keyData) {
      break;
    }
    attemptedKeyIds.push(keyData.id);

    const isMock = !keyData.key || keyData.key.startsWith("mock-");
    if (isMock) {
      return generateHeuristicSummary(params);
    }

    const startTime = Date.now();
    try {
      const ai = new GoogleGenAI({ apiKey: keyData.key });
      const primaryModel = process.env.GEMINI_MODEL || "gemini-3.5-flash";
      const fallbackModel = process.env.GEMINI_FALLBACK_MODEL || "gemini-3.5-flash-lite";

      const callWithTimeout = (modelName: string, timeoutMs = 12000) =>
        Promise.race([
          ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              systemInstruction: SUMMARY_ASSIST_SYSTEM_PROMPT_V1,
              responseMimeType: "application/json",
              responseSchema: schema,
              temperature: 0.2,
            },
          }),
          new Promise<never>((_, reject) => {
            const timer = setTimeout(() => {
              reject(new Error(`Gemini API call timed out after ${Math.round(timeoutMs / 1000)} seconds`));
            }, timeoutMs);
            if (typeof timer.unref === "function") timer.unref();
          }),
        ]);

      let response;
      try {
        response = await callWithTimeout(primaryModel, 12000);
      } catch (firstErr: unknown) {
        console.warn(
          `Gemini primary model ${primaryModel} failed (${firstErr instanceof Error ? firstErr.message : "Error"}). Cascading to fallback model ${fallbackModel}...`
        );
        response = await callWithTimeout(fallbackModel, 12000);
      }

      const latencyMs = Date.now() - startTime;
      await recordKeyUsage(keyData.id, latencyMs);

      const jsonText = response.text || "{}";
      const parsed = JSON.parse(jsonText) as SummaryAssistResult;

      if (parsed.variants && parsed.variants.length >= 2) {
        // Validate all variants against pronouns, cliches, and length
        const validVariants = parsed.variants.filter((variant) => {
          const val = validateProfessionalSummary(variant, JSON.stringify(params));
          return val.valid;
        });

        if (validVariants.length >= 2) {
          return { variants: validVariants };
        }
      }

      return generateHeuristicSummary(params);
    } catch (err: unknown) {
      const latencyMs = Date.now() - startTime;
      const errMsg = err instanceof Error ? err.message : "Unknown Gemini Error";
      const is429 = /429|quota|rate limit/i.test(errMsg);
      const statusCode = is429 ? 429 : 500;

      await recordKeyUsage(keyData.id, latencyMs, statusCode, errMsg);
      console.warn(
        `Gemini summary assist attempt ${attempt + 1} with key ${keyData.id} failed (${statusCode}): ${errMsg}. Retrying next available key...`
      );

      if (attempt < MAX_RETRIES - 1) {
        await new Promise((r) => setTimeout(r, 300));
      }
    }
  }

  // Check if keys are exhausted due to rate limit/cooldown
  const poolStatus = await getKeyPoolCooldownStatus("gemini");
  if (poolStatus.inCooldownCount > 0 && poolStatus.totalKeys > 0) {
    throw new AiQueueFullError(poolStatus.earliestCooldownSeconds);
  }
  if (poolStatus.totalKeys === 0 && !process.env.GEMINI_API_KEY) {
    throw new AiUnavailableError();
  }

  return generateHeuristicSummary(params);
}
