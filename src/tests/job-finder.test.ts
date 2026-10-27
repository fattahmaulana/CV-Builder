import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  computeJobQueryHash,
  calculateJobMatch,
  searchJobListings,
  SEED_JOB_LISTINGS,
} from "@/lib/jobs/job-service";
import { JobListing, jobSearchQuerySchema } from "@/types/job";
import { initialCvData, CvData } from "@/types/cv";
import { JobDirectoryClient } from "@/components/jobs/JobDirectoryClient";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => "/lowongan",
  useSearchParams: () => new URLSearchParams(),
}));

describe("Job Finder Service & Relevancy Engine", () => {
  describe("jobSearchQuerySchema", () => {
    it("validates and applies defaults correctly", () => {
      const parsed = jobSearchQuerySchema.parse({});
      expect(parsed.q).toBe("");
      expect(parsed.location).toBe("ALL");
      expect(parsed.level).toBe("ALL");
      expect(parsed.workplace).toBe("ALL");
      expect(parsed.cvId).toBeUndefined();
    });

    it("parses valid search filters", () => {
      const parsed = jobSearchQuerySchema.parse({
        q: "Software Engineer",
        location: "Jakarta",
        level: "Fresh Graduate / Entry Level",
        workplace: "Hybrid",
        cvId: "cv-test-123",
      });
      expect(parsed.q).toBe("Software Engineer");
      expect(parsed.location).toBe("Jakarta");
      expect(parsed.level).toBe("Fresh Graduate / Entry Level");
      expect(parsed.workplace).toBe("Hybrid");
      expect(parsed.cvId).toBe("cv-test-123");
    });
  });

  describe("computeJobQueryHash", () => {
    it("produces deterministic SHA-256 hash for identical queries", () => {
      const hash1 = computeJobQueryHash({ q: "backend", location: "jakarta", level: "ALL", workplace: "ALL" });
      const hash2 = computeJobQueryHash({ q: "backend", location: "jakarta", level: "ALL", workplace: "ALL" });
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
    });

    it("normalizes casing for deterministic caching", () => {
      const hashLower = computeJobQueryHash({ q: "frontend developer", location: "JAKARTA", level: "ALL", workplace: "ALL" });
      const hashUpper = computeJobQueryHash({ q: "Frontend Developer", location: "jakarta", level: "ALL", workplace: "ALL" });
      expect(hashLower).toBe(hashUpper);
    });

    it("produces different hashes for distinct search parameters", () => {
      const hashA = computeJobQueryHash({ q: "Golang", location: "ALL", level: "ALL", workplace: "ALL" });
      const hashB = computeJobQueryHash({ q: "Python", location: "ALL", level: "ALL", workplace: "ALL" });
      expect(hashA).not.toBe(hashB);
    });
  });

  describe("calculateJobMatch (Live CV Relevancy Matching)", () => {
    const mockJob: JobListing = {
      id: "job-test-swe",
      title: "Junior Backend Engineer",
      company: "Tech Corp",
      location: "Jakarta Selatan",
      employmentType: "Full-time",
      workplaceType: "Hybrid",
      experienceLevel: "Fresh Graduate / Entry Level",
      salary: "Rp8.000.000",
      postedAt: "Hari ini",
      skillsRequired: ["PostgreSQL", "Go", "Docker", "REST API", "Git"],
      description: "Membangun sistem microservices skala tinggi.",
      url: "https://example.com",
      source: "LinkedIn",
    };

    it("returns baseline score (70) and empty matches when cvData is null or undefined", () => {
      const resultNull = calculateJobMatch(mockJob, null);
      expect(resultNull.matchScore).toBe(70);
      expect(resultNull.matchedSkills).toEqual([]);

      const resultUndefined = calculateJobMatch(mockJob, undefined);
      expect(resultUndefined.matchScore).toBe(70);
      expect(resultUndefined.matchedSkills).toEqual([]);
    });

    it("calculates high relevancy score when candidate skills closely match job requirements", () => {
      const candidateCv: CvData = {
        ...initialCvData,
        skills: {
          technical: ["Go", "PostgreSQL", "Docker", "REST API"],
          tools: ["Git", "Linux"],
          languages: ["Bahasa Indonesia", "English"],
        },
      };

      const result = calculateJobMatch(mockJob, candidateCv);
      // All 5 required skills matched
      expect(result.matchedSkills.length).toBe(5);
      expect(result.matchedSkills).toContain("PostgreSQL");
      expect(result.matchedSkills).toContain("Go");
      expect(result.matchedSkills).toContain("Docker");
      expect(result.matchedSkills).toContain("REST API");
      expect(result.matchedSkills).toContain("Git");
      expect(result.matchScore).toBeGreaterThanOrEqual(90);
    });

    it("matches skills from candidate education field of study", () => {
      const jobAccounting: JobListing = {
        id: "job-test-acc",
        title: "Junior Auditor",
        company: "KAP Tanubrata",
        location: "Jakarta",
        employmentType: "Full-time",
        workplaceType: "On-site",
        experienceLevel: "Fresh Graduate / Entry Level",
        salary: "Rp7.000.000",
        postedAt: "Hari ini",
        skillsRequired: ["Akuntansi", "Audit", "Pajak"],
        description: "Melakukan audit keuangan.",
        url: "https://example.com",
        source: "Jobstreet",
      };

      const candidateCv: CvData = {
        ...initialCvData,
        educations: [
          {
            id: "edu-1",
            institution: "Universitas Indonesia",
            degree: "S1",
            fieldOfStudy: "Akuntansi Keuangan",
            startDate: "2020",
            endDate: "2024",
            gpa: "3.75",
            current: false,
          },
        ],
        skills: {
          technical: ["Pajak"],
          tools: ["Excel"],
          languages: ["Bahasa Indonesia"],
        },
      };

      const result = calculateJobMatch(jobAccounting, candidateCv);
      expect(result.matchedSkills).toContain("Akuntansi");
      expect(result.matchedSkills).toContain("Pajak");
      expect(result.matchScore).toBeGreaterThan(65);
    });

    it("bounds score properly when there are no matching skills", () => {
      const candidateCv: CvData = {
        ...initialCvData,
        skills: {
          technical: ["Fashion Design", "Sewing"],
          tools: ["Photoshop"],
          languages: ["Bahasa Indonesia"],
        },
      };

      const result = calculateJobMatch(mockJob, candidateCv);
      expect(result.matchedSkills.length).toBe(0);
      expect(result.matchScore).toBeLessThanOrEqual(65);
      expect(result.matchScore).toBeGreaterThanOrEqual(50);
    });
  });

  describe("searchJobListings (Multi-attribute filtering & dataset integrity)", () => {
    it("contains rich curated Indonesian fresh graduate listings", () => {
      expect(SEED_JOB_LISTINGS.length).toBeGreaterThanOrEqual(8);
      for (const job of SEED_JOB_LISTINGS) {
        expect(job.id).toBeTruthy();
        expect(job.title).toBeTruthy();
        expect(job.company).toBeTruthy();
        expect(job.location).toBeTruthy();
        expect(job.skillsRequired.length).toBeGreaterThan(0);
      }
    });

    it("filters listings by keyword (title / company / description / skill)", async () => {
      const query = { q: "BCA", location: "ALL", level: "ALL", workplace: "ALL" };
      const { jobs, total } = await searchJobListings(query);

      expect(total).toBeGreaterThan(0);
      const bcaJob = jobs.find((j) => j.title.includes("BCA") || j.company.includes("BCA"));
      expect(bcaJob).toBeDefined();
    });

    it("filters listings by location (e.g. Bandung)", async () => {
      const query = { q: "", location: "Bandung", level: "ALL", workplace: "ALL" };
      const { jobs } = await searchJobListings(query);

      expect(jobs.length).toBeGreaterThan(0);
      for (const job of jobs) {
        expect(job.location.toLowerCase()).toContain("bandung");
      }
    });

    it("filters listings by workplace type (e.g. Remote / Hybrid)", async () => {
      const query = { q: "", location: "ALL", level: "ALL", workplace: "Hybrid" };
      const { jobs } = await searchJobListings(query);

      expect(jobs.length).toBeGreaterThan(0);
      for (const job of jobs) {
        expect(job.workplaceType).toBe("Hybrid");
      }
    });

    it("returns sorted results by match score in descending order", async () => {
      const techCv: CvData = {
        ...initialCvData,
        skills: {
          technical: ["Go", "Node.js", "PostgreSQL", "REST API", "Docker", "Git"],
          tools: ["Git"],
          languages: ["Bahasa Indonesia"],
        },
      };

      const { jobs } = await searchJobListings(
        { q: "", location: "ALL", level: "ALL", workplace: "ALL" },
        techCv
      );

      expect(jobs.length).toBeGreaterThan(1);
      for (let i = 0; i < jobs.length - 1; i++) {
        expect(jobs[i].matchScore!).toBeGreaterThanOrEqual(jobs[i + 1].matchScore!);
      }
    });
  });

  describe("Neobrutalist UI Rendering for JobDirectoryClient", () => {
    it("renders Neobrutalist tokens: 3px black borders, hard-drop buttons, and high-contrast badges", () => {
      const html = renderToStaticMarkup(
        React.createElement(JobDirectoryClient, {
          initialJobs: SEED_JOB_LISTINGS,
          userCvs: [{ id: "cv-test-1", title: "CV Fresh Graduate Software Engineer" }],
        })
      );

      // Verify Neobrutalism tokens
      expect(html).toContain("border-[3px]");
      expect(html).toContain("border-black");
      expect(html).toContain("hard-drop");
      expect(html).toContain("hard-drop-sm");

      // Verify Header & Stikers
      expect(html).toContain("Indonesian Fresh Graduate Careers");
      expect(html).toContain("Eksplorasi Lowongan Kerja Relevan");

      // Verify Action buttons
      expect(html).toContain("Sesuaikan CV untuk Lowongan Ini");
      expect(html).toContain("Catat ke Tracker Lamaran");

      // Verify Search form
      expect(html).toContain("Cari Lowongan");

      // Verify Claims policy: strictly NO "pasti lolos" or "auto lolos"
      expect(html).not.toContain("pasti lolos");
      expect(html).not.toContain("auto lolos");
      expect(html).not.toContain("100% lolos");
    });

    it("renders empty state correctly when zero jobs match", () => {
      const html = renderToStaticMarkup(
        React.createElement(JobDirectoryClient, {
          initialJobs: [],
          userCvs: [],
        })
      );

      expect(html).toContain("Tidak ditemukan lowongan yang cocok");
      expect(html).toContain("border-dashed");
    });
  });
});

