import { CvData, initialCvData, cvDraftSchema } from "@/types/cv";

export interface NormalizedCvModel {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    city: string;
    linkedinUrl: string;
    portfolioUrl: string;
    summary: string;
    photoUrl: string;
  };
  educations: Array<{
    id: string;
    institution: string;
    degree: string;
    fieldOfStudy: string;
    gpa: string;
    startDate: string;
    endDate: string;
    city: string;
    current: boolean;
    description: string;
  }>;
  experiences: Array<{
    id: string;
    category: "magang" | "organisasi" | "proyek" | "kerja";
    role: string;
    organization: string;
    startDate: string;
    endDate: string;
    city: string;
    current: boolean;
    bullets: string[];
  }>;
  skills: {
    technical: string[];
    tools: string[];
    languages: string[];
  };
  certifications: Array<{
    id: string;
    name: string;
    issuer: string;
    issueDate: string;
    credentialId: string;
    url: string;
  }>;
  awards: Array<{
    id: string;
    title: string;
    issuer: string;
    year: string;
    description: string;
  }>;
  metadata: {
    language: "id" | "en";
    targetPosition: string;
    targetCompany: string;
    jobDescription: string;
    template: "ats-harvard" | "with-photo";
  };
}

/**
 * Single source of truth model normalizer.
 * Consumed identically by:
 * 1. Web Preview (HarvardCvPreview, PhotoCvPreview)
 * 2. PDF Generator (HarvardPdfDocument, PhotoPdfDocument)
 * 3. Word Generator (harvardDocxGenerator)
 */
export function buildCvModel(raw: unknown): NormalizedCvModel {
  let base: CvData;

  const parsed = cvDraftSchema.safeParse(raw);
  if (parsed.success) {
    base = parsed.data as CvData;
  } else if (typeof raw === "object" && raw !== null) {
    const r = raw as Record<string, unknown>;
    base = {
      ...initialCvData,
      ...(r.personalInfo ? { personalInfo: r.personalInfo as any } : {}),
      ...(Array.isArray(r.educations) ? { educations: r.educations as any } : {}),
      ...(Array.isArray(r.experiences) ? { experiences: r.experiences as any } : {}),
      ...(r.skills ? { skills: r.skills as any } : {}),
      ...(Array.isArray(r.certifications) ? { certifications: r.certifications as any } : {}),
      ...(Array.isArray(r.awards) ? { awards: r.awards as any } : {}),
      ...(r.metadata ? { metadata: r.metadata as any } : {}),
    };
  } else {
    base = initialCvData;
  }

  const p = base.personalInfo || initialCvData.personalInfo;
  const m = base.metadata || initialCvData.metadata;

  return {
    personalInfo: {
      fullName: (p.fullName || "").trim(),
      email: (p.email || "").trim(),
      phone: (p.phone || "").trim(),
      city: (p.city || "").trim(),
      linkedinUrl: (p.linkedinUrl || "").trim(),
      portfolioUrl: (p.portfolioUrl || "").trim(),
      summary: (p.summary || "").trim(),
      photoUrl: (p.photoUrl || "").trim(),
    },
    educations: (base.educations || []).map((edu) => ({
      id: edu.id || `edu-${Math.random()}`,
      institution: (edu.institution || "").trim(),
      degree: (edu.degree || "").trim(),
      fieldOfStudy: (edu.fieldOfStudy || "").trim(),
      gpa: (edu.gpa || "").trim(),
      startDate: (edu.startDate || "").trim(),
      endDate: (edu.endDate || "").trim(),
      city: (edu.city || "").trim(),
      current: Boolean(edu.current),
      description: (edu.description || "").trim(),
    })),
    experiences: (base.experiences || []).map((exp) => ({
      id: exp.id || `exp-${Math.random()}`,
      category: exp.category || "kerja",
      role: (exp.role || "").trim(),
      organization: (exp.organization || "").trim(),
      startDate: (exp.startDate || "").trim(),
      endDate: (exp.endDate || "").trim(),
      city: (exp.city || "").trim(),
      current: Boolean(exp.current),
      bullets: (exp.bullets || [])
        .map((b) => (typeof b === "string" ? b.trim() : ""))
        .filter((b) => b.length > 0),
    })),
    skills: {
      technical: Array.from(new Set((base.skills?.technical || []).map((s) => s.trim()).filter(Boolean))),
      tools: Array.from(new Set((base.skills?.tools || []).map((s) => s.trim()).filter(Boolean))),
      languages: Array.from(new Set((base.skills?.languages || []).map((s) => s.trim()).filter(Boolean))),
    },
    certifications: (base.certifications || []).map((c) => ({
      id: c.id || `cert-${Math.random()}`,
      name: (c.name || "").trim(),
      issuer: (c.issuer || "").trim(),
      issueDate: (c.issueDate || "").trim(),
      credentialId: (c.credentialId || "").trim(),
      url: (c.url || "").trim(),
    })),
    awards: (base.awards || []).map((a) => ({
      id: a.id || `award-${Math.random()}`,
      title: (a.title || "").trim(),
      issuer: (a.issuer || "").trim(),
      year: (a.year || "").trim(),
      description: (a.description || "").trim(),
    })),
    metadata: {
      language: m.language === "en" ? "en" : "id",
      targetPosition: (m.targetPosition || "").trim(),
      targetCompany: (m.targetCompany || "").trim(),
      jobDescription: (m.jobDescription || "").trim(),
      template: m.template === "with-photo" ? "with-photo" : "ats-harvard",
    },
  };
}
