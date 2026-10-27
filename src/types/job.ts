import { z } from "zod";

export type EmploymentType = "Full-time" | "Magang / Internship" | "Kontrak" | "Part-time";
export type WorkplaceType = "Hybrid" | "On-site" | "Remote";
export type ExperienceLevel = "Fresh Graduate / Entry Level" | "Magang" | "1-2 Tahun";
export type JobSource = "LinkedIn" | "Jobstreet" | "Glints" | "Kalibrr" | "Dealls" | "BUMN Karir";

export interface JobListing {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  location: string;
  employmentType: EmploymentType;
  workplaceType: WorkplaceType;
  experienceLevel: ExperienceLevel;
  salary: string | null;
  postedAt: string;
  skillsRequired: string[];
  description: string;
  url: string;
  source: JobSource;
  matchScore?: number;
  matchedSkills?: string[];
}

export const jobSearchQuerySchema = z.object({
  q: z.string().optional().default(""),
  location: z.string().optional().default("ALL"),
  level: z.string().optional().default("ALL"),
  workplace: z.string().optional().default("ALL"),
  cvId: z.string().optional(),
});

export type JobSearchQuery = z.infer<typeof jobSearchQuerySchema>;
