import { z } from "zod";

// Personal Info Schema
export const personalInfoSchema = z.object({
  fullName: z.string().min(2, "Nama lengkap wajib diisi"),
  email: z.string().email("Format email tidak valid"),
  phone: z.string().min(8, "Nomor telepon/WhatsApp wajib diisi"),
  city: z.string().min(2, "Kota domisili wajib diisi"),
  linkedinUrl: z.string().url("Format URL LinkedIn tidak valid").optional().or(z.literal("")),
  portfolioUrl: z.string().url("Format URL Portofolio/GitHub tidak valid").optional().or(z.literal("")),
  summary: z.string().max(600, "Ringkasan maksimal 600 karakter").optional().or(z.literal("")),
});

// Education Schema
export const educationItemSchema = z.object({
  id: z.string(),
  institution: z.string().min(2, "Nama institusi/universitas wajib diisi"),
  degree: z.string().min(2, "Gelar/jenjang pendidikan wajib diisi"), // e.g. S1, D3, SMA
  fieldOfStudy: z.string().min(2, "Jurusan/program studi wajib diisi"),
  gpa: z.string().optional().or(z.literal("")), // e.g. 3.75 / 4.00
  startDate: z.string().min(4, "Tahun mulai wajib diisi"), // e.g. "2020" or "Agu 2020"
  endDate: z.string().min(4, "Tahun selesai wajib diisi"), // e.g. "2024" or "Sekarang"
  city: z.string().optional().or(z.literal("")),
  current: z.boolean().default(false),
  description: z.string().optional().or(z.literal("")), // e.g. Mata kuliah relevan, penghargaan akademik
});

// Experience Schema (Magang, Organisasi, Proyek, Kerja)
export const experienceCategorySchema = z.enum(["magang", "organisasi", "proyek", "kerja"]);

export const experienceItemSchema = z.object({
  id: z.string(),
  category: experienceCategorySchema,
  role: z.string().min(2, "Posisi/peran wajib diisi"),
  organization: z.string().min(2, "Nama instansi/organisasi/proyek wajib diisi"),
  startDate: z.string().min(3, "Bulan/tahun mulai wajib diisi"),
  endDate: z.string().min(3, "Bulan/tahun selesai wajib diisi"),
  city: z.string().optional().or(z.literal("")),
  current: z.boolean().default(false),
  bullets: z.array(z.string().min(3, "Poin deskripsi tidak boleh kosong")).min(1, "Minimal sertakan 1 poin pencapaian"),
});

// Skills Schema
export const skillsSchema = z.object({
  technical: z.array(z.string()).default([]), // Hard skills
  tools: z.array(z.string()).default([]), // Software/tools
  languages: z.array(z.string()).default([]), // Bahasa
});

// Certification Schema
export const certificationItemSchema = z.object({
  id: z.string(),
  name: z.string().min(2, "Nama sertifikat wajib diisi"),
  issuer: z.string().min(2, "Lembaga penerbit wajib diisi"),
  issueDate: z.string().min(4, "Tahun penerbitan wajib diisi"),
  credentialId: z.string().optional().or(z.literal("")),
  url: z.string().url("Format tautan kredensial tidak valid").optional().or(z.literal("")),
});

// Award / Honor Schema
export const awardItemSchema = z.object({
  id: z.string(),
  title: z.string().min(2, "Nama penghargaan wajib diisi"),
  issuer: z.string().min(2, "Penyelenggara wajib diisi"),
  year: z.string().min(4, "Tahun perolehan wajib diisi"),
  description: z.string().optional().or(z.literal("")),
});

// Complete CV Data Schema
// Draft schemas for autosave & in-progress editing
export const personalInfoDraftSchema = z.object({
  fullName: z.string().default(""),
  email: z.string().default(""),
  phone: z.string().default(""),
  city: z.string().default(""),
  linkedinUrl: z.string().optional().default(""),
  portfolioUrl: z.string().optional().default(""),
  summary: z.string().max(1000).optional().default(""),
  photoUrl: z.string().optional().default(""),
});

export const educationItemDraftSchema = z.object({
  id: z.string(),
  institution: z.string().default(""),
  degree: z.string().default(""),
  fieldOfStudy: z.string().default(""),
  gpa: z.string().optional().default(""),
  startDate: z.string().default(""),
  endDate: z.string().default(""),
  city: z.string().optional().default(""),
  current: z.boolean().default(false),
  description: z.string().optional().default(""),
});

export const experienceItemDraftSchema = z.object({
  id: z.string(),
  category: experienceCategorySchema.default("kerja"),
  role: z.string().default(""),
  organization: z.string().default(""),
  startDate: z.string().default(""),
  endDate: z.string().default(""),
  city: z.string().optional().default(""),
  current: z.boolean().default(false),
  bullets: z.array(z.string()).default([]),
});

export const certificationItemDraftSchema = z.object({
  id: z.string(),
  name: z.string().default(""),
  issuer: z.string().default(""),
  issueDate: z.string().default(""),
  credentialId: z.string().optional().default(""),
  url: z.string().optional().default(""),
});

export const awardItemDraftSchema = z.object({
  id: z.string(),
  title: z.string().default(""),
  issuer: z.string().default(""),
  year: z.string().default(""),
  description: z.string().optional().default(""),
});

export const cvDraftSchema = z.object({
  personalInfo: personalInfoDraftSchema.default({
    fullName: "",
    email: "",
    phone: "",
    city: "",
    linkedinUrl: "",
    portfolioUrl: "",
    summary: "",
    photoUrl: "",
  }),
  educations: z.array(educationItemDraftSchema).default([]),
  experiences: z.array(experienceItemDraftSchema).default([]),
  skills: skillsSchema.default({ technical: [], tools: [], languages: [] }),
  certifications: z.array(certificationItemDraftSchema).default([]),
  awards: z.array(awardItemDraftSchema).default([]),
  metadata: z.object({
    language: z.enum(["id", "en"]).default("id"),
    targetPosition: z.string().optional().default(""),
    targetCompany: z.string().optional().default(""),
    jobDescription: z.string().max(10000).optional().default(""),
    template: z.enum(["ats-harvard", "with-photo"]).default("ats-harvard"),
  }).default({
    language: "id",
    targetPosition: "",
    targetCompany: "",
    jobDescription: "",
    template: "ats-harvard",
  }),
  ai_suggestions: z.any().optional(),
});

export type PersonalInfoDraft = z.infer<typeof personalInfoDraftSchema>;
export type EducationItemDraft = z.infer<typeof educationItemDraftSchema>;
export type ExperienceItemDraft = z.infer<typeof experienceItemDraftSchema>;
export type CertificationItemDraft = z.infer<typeof certificationItemDraftSchema>;
export type AwardItemDraft = z.infer<typeof awardItemDraftSchema>;
export type CvDraft = z.infer<typeof cvDraftSchema>;

export const cvDataSchema = z.object({
  personalInfo: personalInfoSchema.extend({
    photoUrl: z.string().optional().or(z.literal("")),
  }),
  educations: z.array(educationItemSchema).default([]),
  experiences: z.array(experienceItemSchema).default([]),
  skills: skillsSchema.default({ technical: [], tools: [], languages: [] }),
  certifications: z.array(certificationItemSchema).default([]),
  awards: z.array(awardItemSchema).default([]),
  metadata: z.object({
    language: z.enum(["id", "en"]).default("id"),
    targetPosition: z.string().optional().or(z.literal("")),
    targetCompany: z.string().optional().or(z.literal("")),
    jobDescription: z.string().max(8000).optional().or(z.literal("")),
    template: z.enum(["ats-harvard", "with-photo"]).optional(),
  }).default({ language: "id" }),
  ai_suggestions: z.any().optional(),
});

export type PersonalInfo = z.infer<typeof personalInfoSchema>;
export type EducationItem = z.infer<typeof educationItemSchema>;
export type ExperienceCategory = z.infer<typeof experienceCategorySchema>;
export type ExperienceItem = z.infer<typeof experienceItemSchema>;
export type Skills = z.infer<typeof skillsSchema>;
export type CertificationItem = z.infer<typeof certificationItemSchema>;
export type AwardItem = z.infer<typeof awardItemSchema>;
export type CvData = z.infer<typeof cvDataSchema>;

// Default Blank CV template for new documents
export const initialCvData: CvData = {
  personalInfo: {
    fullName: "",
    email: "",
    phone: "",
    city: "",
    linkedinUrl: "",
    portfolioUrl: "",
    summary: "",
    photoUrl: "",
  },
  educations: [],
  experiences: [],
  skills: {
    technical: [],
    tools: [],
    languages: [],
  },
  certifications: [],
  awards: [],
  metadata: {
    language: "id",
    targetPosition: "",
    targetCompany: "",
    jobDescription: "",
    template: "ats-harvard",
  },
};

