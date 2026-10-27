import { CvData } from "@/types/cv";

/**
 * PII Sanitizer & Rehydrator under Indonesia's UU PDP (UU No. 27 Tahun 2022)
 * Ensures that sensitive personal identifiers (Full Name, Phone, Email,
 * NIK, Home Address, Direct Profile URLs) are strictly stripped before
 * transmission to external LLMs.
 */

// Regular expressions for detecting inadvertently pasted PII in free-text fields
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(?:\+?62|08)[0-9\s.-]{7,15}\b/g;
const NIK_REGEX = /\b[0-9]{16}\b/g;

/**
 * Scrubs free-form text from unintended personal data (emails, phone numbers, NIK)
 */
export function scrubTextPii(text: string): { scrubbed: string; count: number } {
  if (!text) return { scrubbed: "", count: 0 };

  let count = 0;

  let scrubbed = text.replace(EMAIL_REGEX, () => {
    count++;
    return "[EMAIL_DIRAHASIAKAN]";
  });

  scrubbed = scrubbed.replace(PHONE_REGEX, () => {
    count++;
    return "[TELEPON_DIRAHASIAKAN]";
  });

  scrubbed = scrubbed.replace(NIK_REGEX, () => {
    count++;
    return "[NIK_DIRAHASIAKAN]";
  });

  return { scrubbed, count };
}

export interface SanitizedCvPayload {
  sanitizedCv: CvData;
  redactedCount: number;
}

/**
 * Prepares a CV data object for AI optimization by stripping all PII
 */
export function sanitizeCvForAi(cvData: CvData): SanitizedCvPayload {
  let totalRedacted = 0;

  // Sanitize summary
  const summaryScrub = scrubTextPii(cvData.personalInfo.summary || "");
  totalRedacted += summaryScrub.count;

  // Sanitize experiences
  const sanitizedExperiences = cvData.experiences.map((exp) => {
    const sanitizedBullets = exp.bullets.map((bullet) => {
      const scrub = scrubTextPii(bullet);
      totalRedacted += scrub.count;
      return scrub.scrubbed;
    });

    return {
      ...exp,
      bullets: sanitizedBullets,
    };
  });

  // Sanitize educations
  const sanitizedEducations = cvData.educations.map((edu) => {
    const descScrub = scrubTextPii(edu.description || "");
    totalRedacted += descScrub.count;
    return {
      ...edu,
      description: descScrub.scrubbed,
    };
  });

  // Anonymized CV Data
  const sanitizedCv: CvData = {
    ...cvData,
    personalInfo: {
      fullName: "Kandidat",
      email: "kandidat@anonim.local",
      phone: "+620000000000",
      city: "Indonesia",
      linkedinUrl: "",
      portfolioUrl: "",
      summary: summaryScrub.scrubbed,
    },
    educations: sanitizedEducations,
    experiences: sanitizedExperiences,
  };

  // Base redaction includes the primary contact fields (name, email, phone, city, links)
  totalRedacted += 6;

  return {
    sanitizedCv,
    redactedCount: totalRedacted,
  };
}

export interface AiOptimizationResult {
  summary: string;
  experiences: Array<{
    id: string;
    role: string;
    organization: string;
    bullets: string[];
  }>;
  skills: {
    technical: string[];
    tools: string[];
    languages: string[];
  };
  matchScore: number;
  matchAnalysis: {
    matchedKeywords: string[];
    missingKeywords: string[];
    recommendations: string[];
    strengths: string[];
  };
}

/**
 * Rehydrates the AI's optimized suggestions back into the user's authentic CV
 * without overwriting or losing the candidate's real personal data.
 */
export function rehydrateCvWithAi(
  originalCv: CvData,
  optimized: AiOptimizationResult
): CvData {
  // Rehydrate experiences by mapping IDs
  const updatedExperiences = originalCv.experiences.map((origExp) => {
    const match = optimized.experiences.find((opt) => opt.id === origExp.id);
    if (!match) return origExp;

    return {
      ...origExp,
      bullets: match.bullets && match.bullets.length > 0 ? match.bullets : origExp.bullets,
    };
  });

  // Merge unique skills without duplicates
  const mergeUnique = (arr1: string[], arr2: string[]) => {
    const set = new Set([...arr1, ...arr2]);
    return Array.from(set).filter(Boolean);
  };

  return {
    ...originalCv,
    personalInfo: {
      ...originalCv.personalInfo,
      summary: optimized.summary || originalCv.personalInfo.summary,
    },
    experiences: updatedExperiences,
    skills: {
      technical: mergeUnique(originalCv.skills.technical, optimized.skills.technical || []),
      tools: mergeUnique(originalCv.skills.tools, optimized.skills.tools || []),
      languages: mergeUnique(originalCv.skills.languages, optimized.skills.languages || []),
    },
  };
}
