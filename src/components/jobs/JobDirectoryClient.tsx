"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { JobListing, WorkplaceType, ExperienceLevel, JobSource } from "@/types/job";
import {
  Briefcase,
  Search,
  MapPin,
  Building,
  DollarSign,
  ExternalLink,
  Sparkles,
  BookmarkPlus,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  RotateCw,
  Filter,
  X,
  AlertCircle,
  Layers,
  FileText,
  UploadCloud,
  Check,
  FileCheck,
  Zap,
} from "lucide-react";

interface UserCvOption {
  id: string;
  title: string;
}

interface JobDirectoryClientProps {
  initialJobs: JobListing[];
  userCvs: UserCvOption[];
}

type SortOption = "relevance" | "newest" | "salary" | "company";

/**
 * Career-Ops inspired canonical key generator for duplicate vacancy detection.
 * Identifies duplicate postings of the same role across aggregators.
 */
function getCanonicalJobKey(job: JobListing): string {
  const normCompany = (job.company || "")
    .toLowerCase()
    .replace(/\b(pt|tbk|persero|indonesia|corp|group)\b/gi, "")
    .replace(/[^a-z0-9]/g, "");

  const normTitle = (job.title || "")
    .toLowerCase()
    .replace(/\b(junior|senior|intern|magang|staff|lead)\b/gi, "")
    .replace(/[^a-z0-9]/g, "");

  return `${normCompany}::${normTitle}`;
}

/**
 * Comprehensive dictionary of known competencies and industry keywords
 * used to scan uploaded / pasted candidate CVs and match them to job listings.
 */
const KNOWN_INDUSTRY_SKILLS: { name: string; aliases: string[] }[] = [
  // Tech & Programming
  { name: "Go", aliases: ["golang", "go programming", "backend go"] },
  { name: "Node.js", aliases: ["nodejs", "node js", "express", "nest", "typescript"] },
  { name: "PostgreSQL", aliases: ["postgres", "postgresql", "psql", "relational db"] },
  { name: "REST API", aliases: ["rest api", "restful", "api integration", "microservices"] },
  { name: "Docker", aliases: ["docker", "containerization", "containers", "devops"] },
  { name: "Git", aliases: ["git", "github", "gitlab", "version control"] },
  { name: "Python", aliases: ["python", "django", "flask", "fastapi"] },
  { name: "SQL", aliases: ["sql", "mysql", "database query", "relational database"] },
  { name: "Tableau", aliases: ["tableau", "power bi", "powerbi", "looker", "dashboard"] },
  { name: "Data Cleansing", aliases: ["data cleansing", "data cleaning", "etl", "data preparation"] },
  { name: "Statistika", aliases: ["statistika", "statistics", "statistical analysis", "regresi"] },
  { name: "Analisis Data", aliases: ["analisis data", "data analysis", "data analytics", "data analyst"] },

  // Banking & Finance
  { name: "Banking Operations", aliases: ["banking operations", "operasional perbankan", "bank", "teller", "customer service perbankan"] },
  { name: "Analisis Finansial", aliases: ["analisis finansial", "financial analysis", "analisa kredit", "keuangan"] },
  { name: "Akuntansi", aliases: ["akuntansi", "accounting", "laporan keuangan", "neraca", "jurnal"] },
  { name: "Risk Assessment", aliases: ["risk assessment", "manajemen risiko", "mitigasi risiko", "credit risk"] },
  { name: "Pelayanan Nasabah", aliases: ["pelayanan nasabah", "customer service", "layanan nasabah", "frontliner"] },

  // Business & Leadership
  { name: "Komunikasi", aliases: ["komunikasi", "communication", "interpersonal", "public speaking"] },
  { name: "Komunikasi Ramah", aliases: ["komunikasi ramah", "hospitality", "ramah", "service excellence"] },
  { name: "Kepemimpinan", aliases: ["kepemimpinan", "leadership", "ketua", "koordinator", "lead"] },
  { name: "Problem Solving", aliases: ["problem solving", "pemecahan masalah", "critical thinking", "analitis"] },
  { name: "Bahasa Inggris", aliases: ["bahasa inggris", "english", "toefl", "ielts", "fluent english"] },
  { name: "Strategic Thinking", aliases: ["strategic thinking", "strategi bisnis", "business planning"] },
  { name: "Presentasi", aliases: ["presentasi", "presentation", "pitching"] },
  { name: "Kerjasama", aliases: ["kerjasama", "teamwork", "kolaborasi", "collaboration"] },
  { name: "Negosiasi", aliases: ["negosiasi", "negotiation", "tawar menawar", "deal closing"] },

  // Logistics & Operations
  { name: "Microsoft Excel", aliases: ["microsoft excel", "excel", "spreadsheet", "vlookup", "pivot table"] },
  { name: "Microsoft Office", aliases: ["microsoft office", "ms office", "word", "powerpoint"] },
  { name: "Logistik", aliases: ["logistik", "logistics", "supply chain", "pergudangan", "warehouse"] },
  { name: "Manajemen Waktu", aliases: ["manajemen waktu", "time management", "prioritas kerja"] },
  { name: "Koordinasi Tim", aliases: ["koordinasi tim", "team coordination", "cross-functional"] },
  { name: "Analisis Operasional", aliases: ["analisis operasional", "operational analysis", "sla", "sop"] },
  { name: "Product Operations", aliases: ["product operations", "operasional produk", "product support"] },
  { name: "Ketelitian", aliases: ["ketelitian", "teliti", "detail oriented", "attention to detail"] },
  { name: "Administrasi", aliases: ["administrasi", "administration", "arsip", "surat menyurat"] },

  // Digital Marketing & E-Commerce
  { name: "Copywriting", aliases: ["copywriting", "copywriter", "penulisan konten", "content writing"] },
  { name: "SEO Dasar", aliases: ["seo", "search engine optimization", "kata kunci", "organic traffic"] },
  { name: "Meta Ads", aliases: ["meta ads", "facebook ads", "instagram ads", "paid ads", "tiktok ads"] },
  { name: "Google Analytics", aliases: ["google analytics", "ga4", "analytics", "traffic analysis"] },
  { name: "Content Planning", aliases: ["content planning", "jadwal konten", "social media strategy"] },
  { name: "Business Development", aliases: ["business development", "bizdev", "kemitraan", "partnership"] },
  { name: "E-Commerce", aliases: ["e-commerce", "ecommerce", "marketplace", "toko online"] },
  { name: "Analisis Pasar", aliases: ["analisis pasar", "market analysis", "riset pasar", "market research"] },
];

/**
 * Extracts skills and keywords from raw CV text.
 */
function extractSkillsFromCvText(text: string): string[] {
  const lower = text.toLowerCase();
  const matched = new Set<string>();

  for (const item of KNOWN_INDUSTRY_SKILLS) {
    // Check main name
    if (lower.includes(item.name.toLowerCase())) {
      matched.add(item.name);
      continue;
    }
    // Check aliases
    for (const alias of item.aliases) {
      if (lower.includes(alias.toLowerCase())) {
        matched.add(item.name);
        break;
      }
    }
  }

  return Array.from(matched);
}

export function JobDirectoryClient({
  initialJobs,
  userCvs,
}: JobDirectoryClientProps) {
  const router = useRouter();
  const [jobs, setJobs] = React.useState<JobListing[]>(initialJobs);
  const [selectedJob, setSelectedJob] = React.useState<JobListing | null>(initialJobs[0] || null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedLocation, setSelectedLocation] = React.useState("ALL");
  const [selectedWorkplace, setSelectedWorkplace] = React.useState("ALL");
  const [selectedSource, setSelectedSource] = React.useState<string>("ALL");
  const [selectedCvId, setSelectedCvId] = React.useState<string>(userCvs[0]?.id || "");
  const [sortBy, setSortBy] = React.useState<SortOption>("relevance");
  const [enableDeduplication, setEnableDeduplication] = React.useState(true);

  const [isLoading, setIsLoading] = React.useState(false);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [isApplyingToCv, setIsApplyingToCv] = React.useState(false);
  const [isAddingToTracker, setIsAddingToTracker] = React.useState(false);
  const [searchError, setSearchError] = React.useState<string | null>(null);

  // CV Scanner State
  const [isScanModalOpen, setIsScanModalOpen] = React.useState(false);
  const [scanTab, setScanTab] = React.useState<"upload" | "paste" | "saved">("upload");
  const [manualCvText, setManualCvText] = React.useState("");
  const [uploadedFileName, setUploadedFileName] = React.useState<string | null>(null);
  const [activeCvSource, setActiveCvSource] = React.useState<"uploaded" | "pasted" | "account" | null>(null);
  const [activeCvLabel, setActiveCvLabel] = React.useState<string>("");
  const [detectedSkills, setDetectedSkills] = React.useState<string[]>([]);
  const [isScanningCv, setIsScanningCv] = React.useState(false);

  // In-app notification toast
  const [notification, setNotification] = React.useState<{
    type: "success" | "error";
    message: string;
    actionUrl?: string;
    actionLabel?: string;
  } | null>(null);

  // Auto-dismiss notification after 6 seconds
  React.useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 6000);
    return () => clearTimeout(timer);
  }, [notification]);

  // Re-fetch or filter jobs from server API
  const handleSearch = React.useCallback(
    async (e?: React.FormEvent, customQuery?: string) => {
      if (e) e.preventDefault();
      setIsLoading(true);
      setSearchError(null);

      try {
        const queryToUse = customQuery !== undefined ? customQuery : searchQuery;
        const params = new URLSearchParams();
        if (queryToUse) params.set("q", queryToUse);
        if (selectedLocation !== "ALL") params.set("location", selectedLocation);
        if (selectedWorkplace !== "ALL") params.set("workplace", selectedWorkplace);
        if (selectedCvId && !activeCvSource) params.set("cvId", selectedCvId);

        const res = await fetch(`/api/jobs?${params.toString()}`);
        if (!res.ok) {
          throw new Error(`Gagal memuat lowongan (Status ${res.status})`);
        }
        const json = await res.json();

        if (json.jobs) {
          setJobs(json.jobs);
        }
      } catch (err) {
        console.error("Search error:", err);
        setSearchError(
          err instanceof Error ? err.message : "Terjadi kendala saat memuat data lowongan."
        );
      } finally {
        setIsLoading(false);
      }
    },
    [searchQuery, selectedLocation, selectedWorkplace, selectedCvId, activeCvSource]
  );

  // Manual Sync/Refresh with server
  const handleSyncJobs = async () => {
    setIsSyncing(true);
    setSearchError(null);
    try {
      const params = new URLSearchParams();
      params.set("t", String(Date.now()));
      if (searchQuery) params.set("q", searchQuery);
      if (selectedLocation !== "ALL") params.set("location", selectedLocation);
      if (selectedWorkplace !== "ALL") params.set("workplace", selectedWorkplace);
      if (selectedCvId && !activeCvSource) params.set("cvId", selectedCvId);

      const res = await fetch(`/api/jobs?${params.toString()}`);
      if (!res.ok) throw new Error("Gagal menyinkronkan data.");
      const json = await res.json();
      if (json.jobs) {
        setJobs(json.jobs);
        setNotification({
          type: "success",
          message: "Data lowongan kerja berhasil diperbarui dari sumber resmi terverifikasi.",
        });
      }
    } catch (err) {
      console.error("Sync error:", err);
      setSearchError("Gagal memperbarui data lowongan. Silakan coba lagi.");
    } finally {
      setIsSyncing(false);
    }
  };

  // Re-trigger search when user changes matched CV from account
  React.useEffect(() => {
    if (selectedCvId && !activeCvSource) {
      handleSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCvId]);

  // CV File Upload Handler
  const handleCvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === "string") {
        // Strip non-printable / binary junk characters for safe keyword matching
        const cleaned = content.replace(/[^\x20-\x7E\t\n\r]/g, " ").replace(/\s+/g, " ");
        setManualCvText(cleaned);
      }
    };
    reader.readAsText(file);
  };

  // Process CV analysis and re-score directory
  const handleAnalyzeCv = () => {
    if (!manualCvText.trim() && scanTab !== "saved") {
      alert("Silakan unggah file CV atau tempel teks CV Anda terlebih dahulu.");
      return;
    }

    setIsScanningCv(true);

    try {
      let extracted: string[] = [];
      let label = "";

      if (scanTab === "saved") {
        const found = userCvs.find((c) => c.id === selectedCvId);
        label = found?.title || "CV Tersimpan";
        setActiveCvSource("account");
        setActiveCvLabel(label);
        setIsScanModalOpen(false);
        setIsScanningCv(false);
        handleSearch();
        return;
      }

      if (scanTab === "upload") {
        label = uploadedFileName || "File CV yang Diunggah";
        setActiveCvSource("uploaded");
      } else {
        label = "Teks CV yang Ditempel";
        setActiveCvSource("pasted");
      }

      extracted = extractSkillsFromCvText(manualCvText);
      setDetectedSkills(extracted);
      setActiveCvLabel(label);

      // Re-calculate scores for all jobs based on detected skills
      const updatedJobs = jobs.map((job) => {
        const matched: string[] = [];
        for (const req of job.skillsRequired) {
          const reqLower = req.toLowerCase();
          const isMatch =
            extracted.some((s) => s.toLowerCase().includes(reqLower) || reqLower.includes(s.toLowerCase())) ||
            manualCvText.toLowerCase().includes(reqLower);

          if (isMatch) {
            matched.push(req);
          }
        }

        const totalReq = job.skillsRequired.length;
        let score = 55;
        if (totalReq > 0) {
          score = Math.min(98, Math.max(50, Math.round(55 + (matched.length / totalReq) * 43)));
        }

        return {
          ...job,
          matchScore: score,
          matchedSkills: matched,
        };
      });

      // Sort by highest match score
      updatedJobs.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

      setJobs(updatedJobs);
      setSortBy("relevance");
      if (updatedJobs.length > 0) {
        setSelectedJob(updatedJobs[0]);
      }

      setIsScanModalOpen(false);
      setNotification({
        type: "success",
        message: `✓ Berhasil menganalisis CV! Ditemukan ${extracted.length} keahlian cocok. Lowongan kerja diurutkan berdasarkan keselarasan tertinggi.`,
      });
    } catch (err) {
      console.error("Scan error:", err);
      alert("Gagal menganalisis CV. Pastikan format teks terbaca.");
    } finally {
      setIsScanningCv(false);
    }
  };

  const handleClearCvAnalysis = () => {
    setActiveCvSource(null);
    setActiveCvLabel("");
    setDetectedSkills([]);
    setManualCvText("");
    setUploadedFileName(null);
    handleSearch();
  };

  // Sample CV presets for quick test
  const handleLoadSample = (type: "tech" | "banking" | "marketing") => {
    if (type === "tech") {
      setManualCvText(`Pengalaman: Magang Software Engineer di startup teknologi.
Keahlian: Go, Node.js, PostgreSQL, Docker, REST API, Git, Python, SQL, Linux.
Pendidikan: S1 Teknik Informatika, IPK 3.82.`);
      setUploadedFileName("CV_Software_Engineer.pdf");
    } else if (type === "banking") {
      setManualCvText(`Pengalaman: Internship Staff Operasional Bank & Ketua Himpunan Manajemen.
Keahlian: Banking Operations, Analisis Finansial, Akuntansi, Risk Assessment, Pelayanan Nasabah, Komunikasi, Kepemimpinan, Microsoft Excel, Bahasa Inggris.
Pendidikan: S1 Akuntansi / Manajemen Keuangan, IPK 3.75.`);
      setUploadedFileName("CV_Management_Trainee_Bank.pdf");
    } else {
      setManualCvText(`Pengalaman: Digital Marketing Associate di agensi kreatif.
Keahlian: Copywriting, SEO Dasar, Meta Ads, Google Analytics, Content Planning, Business Development, E-Commerce, Analisis Pasar.
Pendidikan: S1 Ilmu Komunikasi / Pemasaran, IPK 3.65.`);
      setUploadedFileName("CV_Digital_Marketing.pdf");
    }
  };

  // Processed jobs: filter by source, deduplicate, and sort
  const processedJobs = React.useMemo(() => {
    let list = [...jobs];

    // Filter by Source
    if (selectedSource !== "ALL") {
      list = list.filter((j) => j.source === selectedSource);
    }

    // Deduplicate (Career-Ops style)
    if (enableDeduplication) {
      const seen = new Set<string>();
      const deduped: JobListing[] = [];
      for (const item of list) {
        const key = getCanonicalJobKey(item);
        if (!seen.has(key)) {
          seen.add(key);
          deduped.push(item);
        }
      }
      list = deduped;
    }

    // Sort
    if (sortBy === "relevance") {
      list.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    } else if (sortBy === "newest") {
      const getFreshnessWeight = (p: string) => {
        const lower = (p || "").toLowerCase();
        if (lower.includes("hari ini")) return 100;
        if (lower.includes("kemarin")) return 90;
        if (lower.includes("1 hari")) return 80;
        if (lower.includes("2 hari")) return 70;
        if (lower.includes("3 hari")) return 60;
        return 50;
      };
      list.sort((a, b) => getFreshnessWeight(b.postedAt) - getFreshnessWeight(a.postedAt));
    } else if (sortBy === "company") {
      list.sort((a, b) => a.company.localeCompare(b.company));
    } else if (sortBy === "salary") {
      list.sort((a, b) => (b.salary ? 1 : 0) - (a.salary ? 1 : 0));
    }

    return list;
  }, [jobs, selectedSource, enableDeduplication, sortBy]);

  // Keep selected job synchronized with processed list
  React.useEffect(() => {
    if (processedJobs.length > 0) {
      if (!selectedJob || !processedJobs.some((j) => j.id === selectedJob.id)) {
        setSelectedJob(processedJobs[0]);
      }
    } else {
      setSelectedJob(null);
    }
  }, [processedJobs, selectedJob]);

  // 1-Click Apply to CV Target
  const handleApplyToCv = async () => {
    if (!selectedJob) return;
    if (!selectedCvId) {
      alert("Silakan buat atau pilih dokumen CV terlebih dahulu.");
      router.push("/cv/new");
      return;
    }

    setIsApplyingToCv(true);
    try {
      const res = await fetch(`/api/jobs/${selectedJob.id}/apply-to-cv`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvId: selectedCvId }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Gagal menyalin data lowongan");
      }

      router.push(`/cv/${selectedCvId}`);
    } catch (err: unknown) {
      console.error("Apply to CV error:", err);
      alert(err instanceof Error ? err.message : "Gagal menyesuaikan lowongan ke CV");
    } finally {
      setIsApplyingToCv(false);
    }
  };

  // 1-Click Save to Application Tracker
  const handleAddToTracker = async () => {
    if (!selectedJob) return;
    setIsAddingToTracker(true);
    try {
      const res = await fetch("/api/tracker/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: selectedJob.company,
          position: selectedJob.title,
          status: "Belum dikirim",
          job_url: selectedJob.url,
          cv_id: selectedCvId || null,
          notes: `Sumber: ${selectedJob.source}. Gaji: ${selectedJob.salary || "N/A"}. Lokasi: ${selectedJob.location}.`,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Gagal mencatat ke pelacak lamaran");
      }

      setNotification({
        type: "success",
        message: `Lowongan ${selectedJob.company} berhasil dicatat ke Pelacak Lamaran!`,
        actionUrl: "/tracker",
        actionLabel: "Buka Pelacak Lamaran →",
      });
    } catch (err: unknown) {
      console.error("Tracker save error:", err);
      alert(err instanceof Error ? err.message : "Gagal menyimpan ke Tracker");
    } finally {
      setIsAddingToTracker(false);
    }
  };

  const handleSkillClick = (skill: string) => {
    setSearchQuery(skill);
    handleSearch(undefined, skill);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedLocation("ALL");
    setSelectedWorkplace("ALL");
    setSelectedSource("ALL");
    setSortBy("relevance");
    handleSearch(undefined, "");
  };

  const hasActiveFilters =
    searchQuery !== "" ||
    selectedLocation !== "ALL" ||
    selectedWorkplace !== "ALL" ||
    selectedSource !== "ALL" ||
    sortBy !== "relevance";

  const getSourceBadge = (source: JobSource) => {
    switch (source) {
      case "LinkedIn":
        return "bg-[#4D7CFF] text-white border border-black";
      case "Jobstreet":
        return "bg-[#FF6B9D] text-black border border-black";
      case "Glints":
        return "bg-[#FFE500] text-black border border-black";
      case "BUMN Karir":
        return "bg-[#10B981] text-black border border-black";
      case "Kalibrr":
        return "bg-[#00D2D3] text-black border border-black";
      case "Dealls":
        return "bg-[#9B51E0] text-white border border-black";
      default:
        return "bg-white text-black border border-black";
    }
  };

  const isFresh = (postedAt: string) => {
    const p = (postedAt || "").toLowerCase();
    return p.includes("hari ini") || p.includes("kemarin") || p.includes("1 hari");
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-black flex flex-col">
      {/* Toast Notification Banner */}
      {notification && (
        <div className="sticky top-0 z-50 bg-[#10B981] border-b-[3px] border-black px-4 py-3 shadow-[0_4px_0_0_#000]">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 text-xs font-black text-black">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 stroke-[3]" />
              <span>{notification.message}</span>
              {notification.actionUrl && (
                <Link
                  href={notification.actionUrl}
                  className="underline underline-offset-2 ml-2 hover:opacity-80"
                >
                  {notification.actionLabel}
                </Link>
              )}
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="p-1 hover:bg-black/10 rounded-[2px]"
              aria-label="Tutup notifikasi"
            >
              <X className="h-4 w-4 stroke-[3]" />
            </button>
          </div>
        </div>
      )}

      {/* Search Header */}
      <div className="bg-white border-b-[3px] border-black py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-block border-2 border-black bg-[#FFE500] text-black px-2.5 py-0.5 rounded-[2px] font-mono text-[11px] font-black uppercase tracking-wider mb-2 shadow-[2px_2px_0_0_#000]">
                Indonesian Fresh Graduate Careers
              </div>
              <h1 className="text-2xl sm:text-3xl font-black font-[family-name:var(--font-display)] tracking-tight">
                Eksplorasi Lowongan Kerja Relevan
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-stone-700 mt-1 max-w-xl">
                Temukan lowongan dari BUMN, unicorn tech, dan perbankan yang kualifikasinya selaras dengan kata kunci CV ATS Harvard Anda.
              </p>
            </div>

            {/* Sync Button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSyncJobs}
                disabled={isSyncing || isLoading}
                title="Perbarui data lowongan dari server resmi"
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white hover:bg-stone-50 border-2 border-black rounded-[3px] text-xs font-black shadow-[2px_2px_0_0_#000] transition-all cursor-pointer disabled:opacity-60"
              >
                <RotateCw
                  className={`h-4 w-4 stroke-[2.5] ${isSyncing ? "animate-spin" : ""}`}
                />
                <span className="hidden sm:inline">
                  {isSyncing ? "Menyinkronkan..." : "Sinkronkan"}
                </span>
              </button>
            </div>
          </div>

          {/* CV SCANNER & MATCHING HERO CALLOUT (Upload / Input CV feature) */}
          <div className="bg-[#FFFBEB] border-[3px] border-black rounded-[3px] p-4 sm:p-5 shadow-[4px_4px_0_0_#000] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="h-11 w-11 shrink-0 bg-[#FFE500] border-2 border-black rounded-[2px] flex items-center justify-center shadow-[2px_2px_0_0_#000]">
                <Sparkles className="h-5 w-5 stroke-[2.5] text-black" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm sm:text-base font-black text-black">
                    {activeCvSource
                      ? `CV Aktif: ${activeCvLabel}`
                      : "Punya CV yang Sudah Jadi? Scan & Cari Lowongan yang Cocok"}
                  </h3>
                  {activeCvSource && (
                    <span className="bg-[#10B981] text-black text-[10px] font-black px-2 py-0.5 border border-black rounded-[2px] shadow-[1px_1px_0_0_#000]">
                      {detectedSkills.length} Keahlian Terdeteksi
                    </span>
                  )}
                </div>
                <p className="text-xs font-semibold text-stone-700 mt-1 max-w-2xl leading-relaxed">
                  {activeCvSource
                    ? "Sistem telah membaca kata kunci keahlian dari CV Anda. Seluruh lowongan di LinkedIn, Jobstreet, BUMN, Glints & Kalibrr telah diurutkan berdasarkan kesesuaian profil Anda."
                    : "Masukkan atau unggah file CV Anda (PDF / DOCX / Teks). Sistem akan membaca kompetensi kualifikasi Anda dan mencarikan lowongan yang paling selaras dari portal karir resmi."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
              {activeCvSource ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsScanModalOpen(true)}
                    className="px-3.5 py-2 bg-white hover:bg-stone-50 border-2 border-black rounded-[2px] text-xs font-black shadow-[2px_2px_0_0_#000] cursor-pointer"
                  >
                    Ganti CV
                  </button>
                  <button
                    type="button"
                    onClick={handleClearCvAnalysis}
                    className="px-3.5 py-2 bg-[#FF6B9D] hover:bg-[#ff528c] text-black border-2 border-black rounded-[2px] text-xs font-black shadow-[2px_2px_0_0_#000] cursor-pointer"
                  >
                    Hapus
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsScanModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#FFE500] hover:bg-[#FDD835] text-black border-[3px] border-black rounded-[2px] text-xs font-black hard-drop cursor-pointer shadow-[3px_3px_0_0_#000] transition-colors"
                >
                  <UploadCloud className="h-4 w-4 stroke-[2.5]" />
                  <span>Scan &amp; Cocokkan CV</span>
                </button>
              )}
            </div>
          </div>

          {/* Search Bar & Filters Form */}
          <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
            <div className="sm:col-span-4 relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-stone-500 stroke-[2.5]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari posisi, perusahaan, atau keahlian (e.g. Data, BCA, React)..."
                className="w-full pl-9 pr-3 py-2.5 text-xs font-bold text-black bg-white border-2 border-black rounded-[3px] shadow-[2px_2px_0_0_#000] focus:shadow-[2px_2px_0_0_#FFE500] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full px-3 py-2.5 text-xs font-bold text-black bg-white border-2 border-black rounded-[3px] shadow-[2px_2px_0_0_#000] focus:outline-none cursor-pointer"
              >
                <option value="ALL">Semua Kota</option>
                <option value="Jakarta">DKI Jakarta</option>
                <option value="Bandung">Bandung</option>
                <option value="Surabaya">Surabaya</option>
                <option value="Remote">Remote (Indonesia)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <select
                value={selectedWorkplace}
                onChange={(e) => setSelectedWorkplace(e.target.value)}
                className="w-full px-3 py-2.5 text-xs font-bold text-black bg-white border-2 border-black rounded-[3px] shadow-[2px_2px_0_0_#000] focus:outline-none cursor-pointer"
              >
                <option value="ALL">Semua Cara Kerja</option>
                <option value="On-site">On-site</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Remote">Remote</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="w-full px-3 py-2.5 text-xs font-bold text-black bg-white border-2 border-black rounded-[3px] shadow-[2px_2px_0_0_#000] focus:outline-none cursor-pointer"
              >
                <option value="ALL">Semua Portal</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Jobstreet">Jobstreet</option>
                <option value="Glints">Glints</option>
                <option value="BUMN Karir">BUMN Karir</option>
                <option value="Kalibrr">Kalibrr</option>
                <option value="Dealls">Dealls</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 text-xs font-black bg-[#FFE500] hover:bg-[#FDD835] text-black border-[3px] border-black rounded-[3px] hard-drop cursor-pointer shadow-[3px_3px_0_0_#000] transition-colors disabled:opacity-60"
              >
                {isLoading ? "Mencari..." : "Cari Lowongan"}
              </button>
            </div>
          </form>

          {/* Active Filter Chips & Career-Ops Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-stone-200">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-stone-600 flex items-center gap-1">
                <Filter className="h-3 w-3 stroke-[2.5]" />
                Urutkan:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="text-[11px] font-bold bg-white border border-black rounded-[2px] px-2 py-1 shadow-[1px_1px_0_0_#000] cursor-pointer"
              >
                <option value="relevance">Relevansi ATS (Tertinggi)</option>
                <option value="newest">Lowongan Paling Baru</option>
                <option value="salary">Gaji Terbuka</option>
                <option value="company">Nama Perusahaan (A-Z)</option>
              </select>

              {/* Deduplication Toggle (Career-Ops style) */}
              <button
                type="button"
                onClick={() => setEnableDeduplication(!enableDeduplication)}
                title="Deduplikasi otomatis menghapus postingan lowongan ganda di multi-portal"
                className={`text-[11px] font-bold px-2 py-1 rounded-[2px] border border-black transition-all flex items-center gap-1 cursor-pointer ${
                  enableDeduplication
                    ? "bg-[#10B981]/20 text-black border-black font-black"
                    : "bg-white text-stone-600"
                }`}
              >
                <Layers className="h-3 w-3" />
                <span>Deduplikasi: {enableDeduplication ? "Aktif" : "Nonaktif"}</span>
              </button>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-[11px] font-bold text-red-600 hover:text-red-800 underline ml-2"
                >
                  Reset Semua Filter
                </button>
              )}
            </div>

            <div className="text-[11px] font-mono text-stone-600 font-semibold">
              Terverifikasi &amp; Aman • Direct Application Links
            </div>
          </div>
        </div>
      </div>

      {/* Main Jobs Layout */}
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-8 w-full">
        {/* Error State Banner */}
        {searchError && (
          <div className="mb-6 p-4 rounded-[3px] bg-[#FF6B9D]/20 border-[3px] border-black shadow-[4px_4px_0_0_#000] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 stroke-[2.5] text-black shrink-0" />
              <div>
                <p className="text-xs font-black text-black">Terjadi Kendala Pencarian</p>
                <p className="text-[11px] font-semibold text-stone-800">{searchError}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleSearch()}
              className="px-3 py-1.5 bg-white border-2 border-black text-xs font-black rounded-[2px] shadow-[2px_2px_0_0_#000] hover:bg-stone-50 cursor-pointer self-start sm:self-auto"
            >
              Coba Lagi
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Job Cards List */}
          <div className="lg:col-span-5 space-y-3.5">
            <div className="flex items-center justify-between text-xs font-bold text-stone-700 px-1">
              <span>Menampilkan {processedJobs.length} lowongan</span>
              <span className="font-mono">
                {sortBy === "relevance"
                  ? "Urut: Relevansi ATS"
                  : sortBy === "newest"
                  ? "Urut: Paling Baru"
                  : sortBy === "salary"
                  ? "Urut: Gaji"
                  : "Urut: Perusahaan"}
              </span>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="p-4 rounded-[3px] border-2 border-black bg-white shadow-[2px_2px_0_0_#000] animate-pulse space-y-2"
                  >
                    <div className="h-4 bg-stone-200 rounded w-3/4" />
                    <div className="h-3 bg-stone-100 rounded w-1/2" />
                    <div className="h-3 bg-stone-100 rounded w-1/3" />
                  </div>
                ))}
              </div>
            ) : processedJobs.length === 0 ? (
              <div className="p-8 text-center bg-white border-2 border-dashed border-black rounded-[3px] shadow-[3px_3px_0_0_#000]">
                <Briefcase className="h-8 w-8 text-black stroke-[2.2] mx-auto mb-2" />
                <p className="text-xs font-black text-black">
                  Tidak ditemukan lowongan yang cocok
                </p>
                <p className="text-[11px] font-semibold text-stone-600 mt-1">
                  Coba ubah kata kunci atau filter lokasi di atas.
                </p>
              </div>
            ) : (
              processedJobs.map((job) => {
                const isSelected = selectedJob?.id === job.id;
                const fresh = isFresh(job.postedAt);
                return (
                  <div
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className={`p-4 rounded-[3px] cursor-pointer transition-all ${
                      isSelected
                        ? "border-[3px] border-black bg-[#FFFBEB] shadow-[5px_5px_0_0_#000]"
                        : "border-2 border-black bg-white hover:bg-stone-50 shadow-[2px_2px_0_0_#000]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-black text-black line-clamp-1">
                            {job.title}
                          </h3>
                          {fresh && (
                            <span className="shrink-0 bg-[#FFE500] text-black border border-black font-mono text-[9px] font-black px-1.5 py-0.2 rounded-[2px]">
                              BARU
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-stone-700">
                          {job.company}
                        </p>
                      </div>

                      {job.matchScore !== undefined && (
                        <span
                          className={`shrink-0 text-[10px] font-black px-2 py-0.5 rounded-[2px] border border-black shadow-[1px_1px_0_0_#000] font-mono ${
                            job.matchScore >= 80
                              ? "bg-[#10B981] text-black"
                              : job.matchScore >= 65
                              ? "bg-[#FFE500] text-black"
                              : "bg-[#FF6B9D] text-black"
                          }`}
                        >
                          {job.matchScore}% Cocok
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-stone-700 mb-2">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 stroke-[2.5]" />
                        {job.location}
                      </span>
                      <span>•</span>
                      <span>{job.workplaceType}</span>
                      <span>•</span>
                      <span className="font-bold text-black">{job.salary || "Kompetitif"}</span>
                    </div>

                    {/* Skill preview tags */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {job.skillsRequired.slice(0, 3).map((skill, i) => (
                        <span
                          key={i}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSkillClick(skill);
                          }}
                          className="text-[10px] font-bold px-1.5 py-0.5 bg-stone-100 hover:bg-[#FFE500] border border-black/60 rounded-[2px] transition-colors"
                        >
                          {skill}
                        </span>
                      ))}
                      {job.skillsRequired.length > 3 && (
                        <span className="text-[10px] font-mono font-bold text-stone-500 self-center">
                          +{job.skillsRequired.length - 3} lainnya
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-black">
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-[2px] font-mono ${getSourceBadge(
                          job.source
                        )}`}
                      >
                        {job.source}
                      </span>
                      <span className="text-[11px] font-semibold text-stone-600 font-mono">
                        {job.postedAt}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Sticky Job Detail Preview */}
          {selectedJob ? (
            <div className="lg:col-span-7 sticky top-20 bg-white border-[3px] border-black rounded-[3px] p-6 sm:p-8 shadow-[6px_6px_0_0_#000] space-y-6">
              {/* Header */}
              <div className="border-b-2 border-black pb-5">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <h2 className="text-xl font-black font-[family-name:var(--font-display)] text-black">
                      {selectedJob.title}
                    </h2>
                    <p className="text-sm font-bold text-black mt-0.5">
                      {selectedJob.company}
                    </p>
                  </div>

                  <span
                    className={`text-xs font-black px-2.5 py-1 rounded-[2px] font-mono ${getSourceBadge(
                      selectedJob.source
                    )}`}
                  >
                    {selectedJob.source}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs font-semibold text-stone-700 mt-3">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 stroke-[2.5]" />
                    {selectedJob.location} ({selectedJob.workplaceType})
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5 stroke-[2.5]" />
                    {selectedJob.employmentType}
                  </span>
                  {selectedJob.salary && (
                    <span className="flex items-center gap-1 font-black text-black bg-[#10B981] border border-black px-2 py-0.5 rounded-[2px]">
                      <DollarSign className="h-3.5 w-3.5 stroke-[2.5]" />
                      {selectedJob.salary}
                    </span>
                  )}
                </div>

                {/* Match Relevancy Badge */}
                {selectedJob.matchScore !== undefined && (
                  <div className="mt-4 p-4 rounded-[3px] bg-[#10B981]/20 border-2 border-black shadow-[3px_3px_0_0_#000]">
                    <p className="text-xs font-black text-black flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4 stroke-[2.5]" />
                      <span>Kecocokan Kata Kunci ATS: {selectedJob.matchScore}%</span>
                    </p>
                    <p className="text-[11px] font-semibold text-stone-800 mt-1">
                      Keahlian cocok terdeteksi:{" "}
                      <span className="font-bold">
                        {selectedJob.matchedSkills && selectedJob.matchedSkills.length > 0
                          ? selectedJob.matchedSkills.join(", ")
                          : "Dasar kualifikasi relevan"}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleApplyToCv}
                  disabled={isApplyingToCv}
                  className="flex items-center justify-center gap-2 py-3 px-4 text-xs font-black bg-[#FFE500] hover:bg-[#FDD835] text-black border-[3px] border-black rounded-[3px] hard-drop cursor-pointer shadow-[3px_3px_0_0_#000] transition-colors disabled:opacity-50"
                >
                  <Sparkles className="h-4 w-4 stroke-[2.5]" />
                  <span>
                    {isApplyingToCv ? "Menyesuaikan CV..." : "Sesuaikan CV untuk Lowongan Ini"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleAddToTracker}
                  disabled={isAddingToTracker}
                  className="flex items-center justify-center gap-2 py-3 px-4 text-xs font-black bg-white hover:bg-stone-50 text-black border-[3px] border-black rounded-[3px] hard-drop cursor-pointer shadow-[3px_3px_0_0_#000] transition-colors disabled:opacity-50"
                >
                  <BookmarkPlus className="h-4 w-4 stroke-[2.5]" />
                  <span>
                    {isAddingToTracker ? "Menyimpan..." : "Catat ke Tracker Lamaran"}
                  </span>
                </button>
              </div>

              {/* Skills Required Tags with Career-Ops Gap Analysis */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h4 className="text-xs font-black uppercase tracking-wider text-black">
                    Keahlian &amp; Kata Kunci ATS yang Dicari:
                  </h4>
                  <span className="text-[10px] font-mono text-stone-500">
                    Klik keahlian untuk memfilter
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedJob.skillsRequired.map((skill, i) => {
                    const isMatched = selectedJob.matchedSkills?.some(
                      (ms) => ms.toLowerCase() === skill.toLowerCase()
                    );
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSkillClick(skill)}
                        title={
                          isMatched
                            ? "Keahlian ini cocok dengan CV Anda (Klik untuk mencari)"
                            : "Klik untuk mencari lowongan dengan keahlian ini"
                        }
                        className={`text-xs font-black px-2.5 py-1 rounded-[2px] border-2 border-black transition-all cursor-pointer ${
                          isMatched
                            ? "bg-[#10B981] text-black shadow-[2px_2px_0_0_#000] hover:bg-[#059669]"
                            : "bg-[#FFFBEB] text-black shadow-[1.5px_1.5px_0_0_#000] hover:bg-[#FFE500]"
                        }`}
                      >
                        {isMatched && <span className="mr-1">✓</span>}
                        {skill}
                      </button>
                    );
                  })}
                </div>

                {/* Career-Ops Style Gap Insight */}
                {selectedJob.matchedSkills &&
                  selectedJob.matchedSkills.length > 0 &&
                  selectedJob.skillsRequired.length > selectedJob.matchedSkills.length && (
                    <div className="mt-2.5 p-2.5 bg-amber-50 border border-black rounded-[2px] text-[11px] font-semibold text-stone-800 flex items-start gap-2">
                      <Sparkles className="h-4 w-4 shrink-0 text-black mt-0.5" />
                      <div>
                        <span className="font-bold">Tips Penyelarasan Kata Kunci (ATS Gap):</span> Tambahkan keahlian{" "}
                        <span className="font-bold text-black">
                          {selectedJob.skillsRequired
                            .filter(
                              (req) =>
                                !selectedJob.matchedSkills?.some(
                                  (ms) => ms.toLowerCase() === req.toLowerCase()
                                )
                            )
                            .join(", ")}
                        </span>{" "}
                        ke bagian Pengalaman atau Keahlian CV Anda untuk meningkatkan skor relevansi.
                      </div>
                    </div>
                  )}
              </div>

              {/* Job Description */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-black">
                  Deskripsi &amp; Kualifikasi Pekerjaan:
                </h4>
                <div className="text-xs text-stone-900 font-semibold leading-relaxed whitespace-pre-line p-4 rounded-[3px] bg-[#FFFBEB]/70 border-2 border-black shadow-[2px_2px_0_0_#000]">
                  {selectedJob.description}
                </div>
              </div>

              {/* Direct Job Application External Link */}
              <div className="pt-3 flex items-center justify-between text-xs font-bold text-stone-700 border-t-2 border-black">
                <span>Diposting via {selectedJob.source}</span>
                <a
                  href={selectedJob.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[2px] border-2 border-black bg-white hover:bg-[#FFE500] text-black text-xs font-black hard-drop-sm transition-all"
                >
                  <span>Buka Portal Resmi Lowongan</span>
                  <ExternalLink className="h-3.5 w-3.5 stroke-[2.5]" />
                </a>
              </div>
            </div>
          ) : (
            <div className="lg:col-span-7 bg-white border-2 border-dashed border-black rounded-[3px] p-8 text-center text-xs font-bold text-stone-600">
              Pilih salah satu lowongan di sebelah kiri untuk melihat detail kualifikasi dan kata kunci ATS.
            </div>
          )}
        </div>
      </main>

      {/* CV SCANNER MODAL DIALOG */}
      {isScanModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border-[3px] border-black rounded-[4px] shadow-[8px_8px_0_0_#000] w-full max-w-xl p-6 sm:p-7 space-y-5 my-8">
            <div className="flex items-start justify-between gap-4 border-b-2 border-black pb-4">
              <div>
                <div className="inline-block border border-black bg-[#FFE500] text-black px-2 py-0.5 rounded-[2px] font-mono text-[10px] font-black uppercase tracking-wider mb-1 shadow-[1.5px_1.5px_0_0_#000]">
                  CV Scanner &amp; AI Relevancy Matcher
                </div>
                <h3 className="text-lg sm:text-xl font-black font-[family-name:var(--font-display)] text-black">
                  Scan CV &amp; Cari Lowongan Sesuai
                </h3>
                <p className="text-xs font-semibold text-stone-600 mt-1">
                  Sistem akan membaca keahlian &amp; pengalaman Anda, lalu mencocokkannya ke lowongan di LinkedIn, Jobstreet, BUMN, Glints, dll.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsScanModalOpen(false)}
                className="p-1.5 hover:bg-stone-100 rounded-[2px] border border-black cursor-pointer"
                aria-label="Tutup modal"
              >
                <X className="h-5 w-5 stroke-[2.5]" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-2 border-black rounded-[2px] p-1 bg-stone-100 text-xs font-black">
              <button
                type="button"
                onClick={() => setScanTab("upload")}
                className={`flex-1 py-1.5 px-2 rounded-[2px] transition-all cursor-pointer ${
                  scanTab === "upload" ? "bg-white border border-black shadow-[1px_1px_0_0_#000]" : "text-stone-600"
                }`}
              >
                Unggah File (PDF/DOCX)
              </button>
              <button
                type="button"
                onClick={() => setScanTab("paste")}
                className={`flex-1 py-1.5 px-2 rounded-[2px] transition-all cursor-pointer ${
                  scanTab === "paste" ? "bg-white border border-black shadow-[1px_1px_0_0_#000]" : "text-stone-600"
                }`}
              >
                Tempel Teks CV
              </button>
              {userCvs.length > 0 && (
                <button
                  type="button"
                  onClick={() => setScanTab("saved")}
                  className={`flex-1 py-1.5 px-2 rounded-[2px] transition-all cursor-pointer ${
                    scanTab === "saved" ? "bg-white border border-black shadow-[1px_1px_0_0_#000]" : "text-stone-600"
                  }`}
                >
                  CV Tersimpan ({userCvs.length})
                </button>
              )}
            </div>

            {/* Tab 1: Upload File */}
            {scanTab === "upload" && (
              <div className="space-y-3">
                <div className="border-2 border-dashed border-black bg-[#FFFBEB]/70 rounded-[3px] p-6 text-center space-y-2">
                  <UploadCloud className="h-8 w-8 stroke-[2.5] text-black mx-auto" />
                  <p className="text-xs font-black text-black">
                    Pilih File CV Anda (PDF, DOCX, TXT)
                  </p>
                  <p className="text-[11px] font-semibold text-stone-600">
                    Sistem akan mengekstrak kata kunci kompetensi untuk dicocokkan ke lowongan kerja.
                  </p>
                  <label className="inline-block mt-2 px-4 py-2 bg-white hover:bg-[#FFE500] text-black border-2 border-black rounded-[2px] text-xs font-black shadow-[2px_2px_0_0_#000] cursor-pointer transition-colors">
                    Pilih File dari Komputer/HP
                    <input
                      type="file"
                      accept=".pdf,.docx,.txt,.doc"
                      onChange={handleCvFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {uploadedFileName && (
                  <div className="p-3 bg-[#10B981]/20 border-2 border-black rounded-[2px] flex items-center justify-between text-xs font-black">
                    <div className="flex items-center gap-2">
                      <FileCheck className="h-4 w-4 stroke-[2.5] text-black" />
                      <span>{uploadedFileName}</span>
                    </div>
                    <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-black">Siap di-scan</span>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Paste Text */}
            {scanTab === "paste" && (
              <div className="space-y-3">
                <label className="block text-xs font-black text-black">
                  Tempel Ringkasan Pengalaman &amp; Keahlian CV Anda:
                </label>
                <textarea
                  rows={6}
                  value={manualCvText}
                  onChange={(e) => setManualCvText(e.target.value)}
                  placeholder="Contoh: Pengalaman kerja, tools yang dikuasai (Python, SQL, React), jurusan kuliah, sertifikasi..."
                  className="w-full p-3 text-xs font-semibold text-black bg-white border-2 border-black rounded-[3px] shadow-[2px_2px_0_0_#000] focus:outline-none focus:shadow-[2px_2px_0_0_#FFE500]"
                />

                <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-stone-700">
                  <span className="font-bold">Gunakan Contoh Cepat:</span>
                  <button
                    type="button"
                    onClick={() => handleLoadSample("tech")}
                    className="px-2 py-0.5 bg-white hover:bg-stone-100 border border-black rounded-[2px] text-[10px] font-bold"
                  >
                    Tech / IT
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadSample("banking")}
                    className="px-2 py-0.5 bg-white hover:bg-stone-100 border border-black rounded-[2px] text-[10px] font-bold"
                  >
                    Perbankan / BUMN
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadSample("marketing")}
                    className="px-2 py-0.5 bg-white hover:bg-stone-100 border border-black rounded-[2px] text-[10px] font-bold"
                  >
                    Marketing
                  </button>
                </div>
              </div>
            )}

            {/* Tab 3: Saved CV in Account */}
            {scanTab === "saved" && userCvs.length > 0 && (
              <div className="space-y-3">
                <label className="block text-xs font-black text-black">
                  Pilih Dokumen CV dari Akun Anda:
                </label>
                <select
                  value={selectedCvId}
                  onChange={(e) => setSelectedCvId(e.target.value)}
                  className="w-full p-2.5 text-xs font-bold bg-white border-2 border-black rounded-[3px] shadow-[2px_2px_0_0_#000] focus:outline-none cursor-pointer"
                >
                  {userCvs.map((cv) => (
                    <option key={cv.id} value={cv.id}>
                      {cv.title}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] font-semibold text-stone-600">
                  Sistem akan mengambil data kualifikasi dari dokumen ini untuk mencocokkan skor relevansi ATS.
                </p>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-3 border-t-2 border-black flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsScanModalOpen(false)}
                className="px-4 py-2.5 bg-white hover:bg-stone-50 border-2 border-black rounded-[2px] text-xs font-black cursor-pointer shadow-[2px_2px_0_0_#000]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleAnalyzeCv}
                disabled={isScanningCv}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#FFE500] hover:bg-[#FDD835] text-black border-[3px] border-black rounded-[2px] text-xs font-black hard-drop cursor-pointer shadow-[3px_3px_0_0_#000] transition-colors disabled:opacity-50"
              >
                <Zap className="h-4 w-4 stroke-[2.5]" />
                <span>{isScanningCv ? "Memindai..." : "Scan & Cari Lowongan Cocok"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
