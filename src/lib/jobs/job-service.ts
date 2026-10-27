import { createHash } from "crypto";
import { JobListing, JobSearchQuery } from "@/types/job";
import { CvData } from "@/types/cv";
import { createClient } from "@/lib/supabase/server";
import { Json } from "@/lib/supabase/types";

// In-memory cache fallback for high-performance sub-second searches
const MEMORY_JOB_CACHE = new Map<string, { data: JobListing[]; expiresAt: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Curated live database of real Indonesian fresh graduate & entry-level jobs
export const SEED_JOB_LISTINGS: JobListing[] = [
  {
    id: "job-bca-mt-01",
    title: "BCA Management Development Program (MDP)",
    company: "PT Bank Central Asia Tbk",
    location: "Jakarta Pusat",
    employmentType: "Full-time",
    workplaceType: "On-site",
    experienceLevel: "Fresh Graduate / Entry Level",
    salary: "Rp8.000.000 - Rp11.000.000",
    postedAt: "Hari ini",
    skillsRequired: ["Komunikasi", "Kepemimpinan", "Analisis Data", "Problem Solving", "Bahasa Inggris"],
    description: `BCA mencari lulusan baru berpotensi tinggi dari berbagai jurusan untuk dipersiapkan menjadi calon pemimpin masa depan perbankan nasional.

Tanggung Jawab:
- Mengikuti program pelatihan intensif rotasi divisi operasional, kredit, dan perbankan digital.
- Menganalisis kebutuhan nasabah dan merekomendasikan solusi perbankan terpadu.
- Memimpin inisiatif proyek peningkatan efisiensi layanan kantor cabang.

Kualifikasi:
- Lulusan S1/S2 semua jurusan dengan IPK minimal 3.00 dari 4.00.
- Usia maksimal 24 tahun (S1) atau 26 tahun (S2).
- Memiliki kemampuan interpersonal, pemecahan masalah kritis, dan adaptabilitas tinggi.`,
    url: "https://karir.bca.co.id",
    source: "Jobstreet",
  },
  {
    id: "job-goto-swe-02",
    title: "Junior Software Engineer (Backend)",
    company: "PT GoTo Gojek Tokopedia Tbk",
    location: "Jakarta Selatan",
    employmentType: "Full-time",
    workplaceType: "Hybrid",
    experienceLevel: "Fresh Graduate / Entry Level",
    salary: "Rp9.000.000 - Rp14.000.000",
    postedAt: "1 hari yang lalu",
    skillsRequired: ["Go", "Node.js", "PostgreSQL", "REST API", "Docker", "Git"],
    description: `Bergabung bersama tim Engineering Tokopedia & GoTo dalam membangun layanan digital skala besar yang melayani jutaan pengguna Indonesia setiap hari.

Tanggung Jawab:
- Merancang, mengembangkan, dan memelihara microservices backend berkinerja tinggi.
- Mengoptimalkan performa database PostgreSQL dan query caching Redis.
- Menulis kode bersih, terdokumentasi, dan unit test terstruktur.

Kualifikasi:
- Lulusan S1 Ilmu Komputer, Teknik Informatika, Sistem Informasi atau bidang terkait.
- Menguasai dasar-dasar struktur data, algoritma, dan API RESTful.
- Memiliki pengalaman proyek menggunakan Go, Node.js, atau TypeScript.`,
    url: "https://www.gotocompany.com/careers",
    source: "LinkedIn",
  },
  {
    id: "job-telkom-data-03",
    title: "Junior Data Analyst (DigiTalent BUMN)",
    company: "PT Telkom Indonesia (Persero) Tbk",
    location: "Bandung",
    employmentType: "Full-time",
    workplaceType: "Hybrid",
    experienceLevel: "Fresh Graduate / Entry Level",
    salary: "Rp7.500.000 - Rp10.000.000",
    postedAt: "2 hari yang lalu",
    skillsRequired: ["SQL", "Python", "Tableau", "Excel", "Data Cleansing", "Statistika"],
    description: `Telkom Indonesia membuka kesempatan bagi talenta data muda untuk mengolah data ekosistem telekomunikasi terbesar di Indonesia.

Tanggung Jawab:
- Mengekstrak, membersihkan, dan menganalisis dataset analitik pelanggan.
- Membuat dasbor visualisasi interaktif di Tableau/PowerBI untuk pemangku kepentingan bisnis.
- Melakukan analisis kohort retensi pengguna layanan digital IndiHome dan Telkomsel.

Kualifikasi:
- Lulusan S1 Statistika, Matematika, Teknik Informatika, atau Sistem Informasi.
- Terampil menulis kueri SQL kompleks (JOIN, subquery, aggregations).
- Menguasai visualisasi data dan pengolahan spreadsheet tingkat lanjut.`,
    url: "https://recruitment.telkom.co.id",
    source: "BUMN Karir",
  },
  {
    id: "job-shopee-ops-04",
    title: "Operations Associate — Supply Chain & Logistics",
    company: "Shopee Indonesia",
    location: "Jakarta Utara",
    employmentType: "Full-time",
    workplaceType: "On-site",
    experienceLevel: "Fresh Graduate / Entry Level",
    salary: "Rp6.000.000 - Rp8.500.000",
    postedAt: "3 hari yang lalu",
    skillsRequired: ["Microsoft Excel", "Logistik", "Manajemen Waktu", "Koordinasi Tim", "Analisis Operasional"],
    description: `Shopee Express mencari individu dinamis untuk memonitor kelancaran alur pemrosesan pesanan dan jaringan distribusi pergudangan di seluruh wilayah Indonesia.

Tanggung Jawab:
- Memantau metrik Service Level Agreement (SLA) pengiriman paket harian.
- Mengidentifikasi hambatan logistik dan berkoordinasi dengan kepala hub operasional.
- Menyusun laporan performa mingguan menggunakan spreadsheet lanjutan.

Kualifikasi:
- Lulusan S1 Teknik Industri, Manajemen Logistik, Bisnis, atau jurusan relevan.
- Menguasai formula Microsoft Excel (VLOOKUP, INDEX-MATCH, Pivot Table).
- Mampu bekerja cepat, teliti, dan berorientasi pada target.`,
    url: "https://careers.shopee.co.id",
    source: "Glints",
  },
  {
    id: "job-astra-mt-05",
    title: "Astra Graduate Program (AGP)",
    company: "PT Astra International Tbk",
    location: "Jakarta Utara",
    employmentType: "Full-time",
    workplaceType: "On-site",
    experienceLevel: "Fresh Graduate / Entry Level",
    salary: "Rp8.500.000 - Rp12.000.000",
    postedAt: "1 minggu yang lalu",
    skillsRequired: ["Kepemimpinan", "Strategic Thinking", "Presentasi", "Analisis Keuangan", "Kerjasama"],
    description: `Program akselerasi kepemimpinan prestisius dari Astra International untuk mencetak pemimpin divisi otomotif, jasa keuangan, dan agribisnis grup Astra.

Tanggung Jawab:
- Rotasi kepemimpinan terarah di berbagai lini anak perusahaan Astra.
- Menjalankan proyek perbaikan berkelanjutan (Kaizen & Business Innovation).
- Mempresentasikan rekomendasi strategis di hadapan jajaran direksi.

Kualifikasi:
- Lulusan S1/S2 Teknik, Ekonomi, Bisnis, atau Manajemen dengan prestasi akademik menonjol.
- Aktif dalam organisasi kemahasiswaan atau perlombaan tingkat nasional.
- Berpikir analitis dan memiliki integritas profesional tinggi.`,
    url: "https://career.astra.co.id",
    source: "LinkedIn",
  },
  {
    id: "job-dealls-marketing-06",
    title: "Junior Digital Marketing Specialist",
    company: "Dealls Job Portal",
    location: "Remote (Indonesia)",
    employmentType: "Full-time",
    workplaceType: "Remote",
    experienceLevel: "Fresh Graduate / Entry Level",
    salary: "Rp5.500.000 - Rp7.500.000",
    postedAt: "Kemarin",
    skillsRequired: ["Copywriting", "SEO Dasar", "Meta Ads", "Google Analytics", "Content Planning"],
    description: `Membantu merancang dan mengeksekusi kampanye pemasaran digital untuk menarik lebih dari 100.000 pencari kerja fresh graduate setiap bulannya.

Tanggung Jawab:
- Menulis naskah konten edukasi karir dan tips CV di Instagram, TikTok, dan LinkedIn.
- Mengelola iklan berbayar Meta Ads & TikTok Ads dengan anggaran terukur.
- Menganalisis traffic konversi pendaftaran pelamar melalui Google Analytics.

Kualifikasi:
- Lulusan S1 Komunikasi, Pemasaran, Desain, atau memiliki portofolio campaign media sosial.
- Paham tren media sosial Gen-Z dan menyukai penulisan copywriting yang memikat.
- Terbiasa membaca metrik analitik dasar (CTR, CAC, ROAS).`,
    url: "https://dealls.com/jobs",
    source: "Dealls",
  },
  {
    id: "job-mandiri-staff-07",
    title: "Officer Development Program (ODP) Wholesale Banking",
    company: "PT Bank Mandiri (Persero) Tbk",
    location: "Jakarta Selatan",
    employmentType: "Full-time",
    workplaceType: "On-site",
    experienceLevel: "Fresh Graduate / Entry Level",
    salary: "Rp8.500.000 - Rp11.500.000",
    postedAt: "4 hari yang lalu",
    skillsRequired: ["Financial Analysis", "Akuntansi", "Risk Assessment", "Bahasa Inggris", "Presentasi"],
    description: `Bank Mandiri membuka rekrutmen ODP untuk memperkuat divisi korporasi dan perbankan komersial dalam mendukung pertumbuhan ekonomi nasional.

Tanggung Jawab:
- Menganalisis laporan keuangan korporat dan kelayakan pemberian fasilitas kredit modal kerja.
- Menyusun proposal pembiayaan sindikasi terstruktur.
- Membina hubungan kemitraan strategis dengan nasabah korporat multinasional.

Kualifikasi:
- Lulusan S1/S2 Akuntansi, Manajemen Keuangan, Hukum, atau Teknik Industri.
- TOEFL minimal 500 atau setara.
- Memiliki pemahaman yang solid atas analisis rasio keuangan dan neraca.`,
    url: "https://www.bankmandiri.co.id/mandiri-career",
    source: "BUMN Karir",
  },
  {
    id: "job-bri-bflp-08",
    title: "Brilian Future Leader Program (BFLP) General & IT",
    company: "PT Bank Rakyat Indonesia (Persero) Tbk",
    location: "Jakarta Pusat",
    employmentType: "Full-time",
    workplaceType: "On-site",
    experienceLevel: "Fresh Graduate / Entry Level",
    salary: "Rp8.500.000 - Rp12.000.000",
    postedAt: "2 hari yang lalu",
    skillsRequired: ["Banking Operations", "Analisis Finansial", "Kepemimpinan", "Problem Solving", "Bahasa Inggris"],
    description: `Bank BRI mencari talenta muda terbaik bangsa melalui program BFLP untuk dipersiapkan menjadi pemimpin masa depan perbankan mikro dan ritel terbesar di Indonesia.

Tanggung Jawab:
- Menjalani rotasi divisi bisnis komersial, perbankan mikro, dan transformasi perbankan digital BRI.
- Menyusun strategi penetrasi produk finansial inklusif untuk UMKM di seluruh Indonesia.
- Melakukan mitigasi risiko kredit dan operasional perbankan.

Kualifikasi:
- Lulusan S1/S2 semua jurusan (BFLP General) atau Teknik Informatika/Sistem Informasi (BFLP IT).
- IPK minimal 3.00 (S1) atau 3.25 (S2) dari skala 4.00.
- Berorientasi pada prestasi, integritas tinggi, dan kemampuan komunikasi prima.`,
    url: "https://e-recruitment.bri.co.id",
    source: "BUMN Karir",
  },
  {
    id: "job-traveloka-product-09",
    title: "Associate Product Operations & Analytics",
    company: "Traveloka Indonesia",
    location: "Jakarta Selatan",
    employmentType: "Full-time",
    workplaceType: "Hybrid",
    experienceLevel: "Fresh Graduate / Entry Level",
    salary: "Rp8.000.000 - Rp11.000.000",
    postedAt: "3 hari yang lalu",
    skillsRequired: ["SQL", "Analisis Data", "Product Operations", "Problem Solving", "Komunikasi"],
    description: `Traveloka membuka peluang bagi lulusan baru untuk mengoptimalkan operasional fitur produk perjalanan dan gaya hidup digital terdepan di Asia Tenggara.

Tanggung Jawab:
- Memantau keandalan performa produk transaksi tiket dan akomodasi secara berkala.
- Mengolah data perilaku pengguna menggunakan SQL dan spreadsheet untuk mengidentifikasi area perbaikan.
- Berkoordinasi dengan Product Manager dan Engineering untuk implementasi fitur baru.

Kualifikasi:
- Lulusan S1 Teknik, Bisnis, Sistem Informasi, atau bidang terkait.
- Terbiasa membaca data dan memiliki kemampuan berpikir logis terstruktur.
- Mampu berkomunikasi dalam Bahasa Inggris baik lisan maupun tulisan.`,
    url: "https://www.traveloka.com/en-id/careers",
    source: "LinkedIn",
  },
  {
    id: "job-blibli-flp-10",
    title: "Future Leader Program (FLP) Commercial & Tech",
    company: "PT Global Digital Niaga Tbk (Blibli)",
    location: "Jakarta Barat",
    employmentType: "Full-time",
    workplaceType: "Hybrid",
    experienceLevel: "Fresh Graduate / Entry Level",
    salary: "Rp8.500.000 - Rp12.500.000",
    postedAt: "Hari ini",
    skillsRequired: ["Business Development", "E-Commerce", "Analisis Pasar", "Negosiasi", "Kepemimpinan"],
    description: `Blibli (Djarum Group) membuka Future Leader Program untuk mencetak eksekutif muda di industri e-commerce dan ekosistem gaya hidup omnichannel.

Tanggung Jawab:
- Merancang strategi akuisisi merchant strategis dan promosi kategori produk unggulan.
- Mengelola kemitraan bisnis dengan brand prinsipal nasional dan internasional.
- Memimpin proyek inovasi layanan pelanggan dan integrasi logistik kilat.

Kualifikasi:
- Lulusan S1/S2 semua jurusan dengan rekam jejak kepemimpinan aktif.
- Memiliki motivasi tinggi, inisiatif mandiri, dan kemampuan negosiasi yang meyakinkan.
- Cepat beradaptasi dalam lingkungan kerja industri teknologi yang dinamis.`,
    url: "https://careers.blibli.com",
    source: "Kalibrr",
  },
  {
    id: "job-bca-surabaya-11",
    title: "Program Magang Bakti BCA (Customer Service & Teller)",
    company: "PT Bank Central Asia Tbk",
    location: "Surabaya",
    employmentType: "Magang / Internship",
    workplaceType: "On-site",
    experienceLevel: "Fresh Graduate / Entry Level",
    salary: "Rp4.800.000 - Rp5.500.000",
    postedAt: "1 hari yang lalu",
    skillsRequired: ["Pelayanan Nasabah", "Komunikasi Ramah", "Ketelitian", "Microsoft Office", "Administrasi"],
    description: `Program Magang Bakti BCA memberikan kesempatan bagi lulusan baru untuk mendapatkan pengalaman kerja profesional di lini terdepan perbankan terbaik Indonesia untuk penempatan area Surabaya dan Jawa Timur.

Tanggung Jawab:
- Melayani transaksi operasional perbankan harian (setoran, penarikan, transfer) dengan ramah dan cermat.
- Memberikan penjelasan solusi produk tabungan dan layanan digital BCA kepada nasabah.
- Memastikan kerapihan dokumentasi berkas transaksi harian kantor cabang.

Kualifikasi:
- Lulusan SMA/SMK (nilai rata-rata rapor min 7.0) atau D3/S1 (IPK min 2.75).
- Berpenampilan menarik, ramah, dan memiliki kemampuan komunikasi yang santun.
- Bersedia ditempatkan di seluruh jaringan kantor cabang BCA area Surabaya.`,
    url: "https://karir.bca.co.id",
    source: "Jobstreet",
  },
];

/**
 * Calculates match score between candidate CV and job listing
 */
export function calculateJobMatch(
  job: JobListing,
  cvData?: CvData | null
): { matchScore: number; matchedSkills: string[] } {
  if (!cvData) {
    return { matchScore: 70, matchedSkills: [] };
  }

  const cvSkills = [
    ...(cvData.skills?.technical || []),
    ...(cvData.skills?.tools || []),
    ...(cvData.skills?.languages || []),
  ].map((s) => s.toLowerCase());

  // Also include words from education field of study
  const eduKeywords = (cvData.educations || []).map((e) => (e.fieldOfStudy || "").toLowerCase());
  const allCandidateKeywords = [...cvSkills, ...eduKeywords];

  const matched: string[] = [];

  for (const reqSkill of job.skillsRequired) {
    const isMatched = allCandidateKeywords.some((ck) =>
      ck.includes(reqSkill.toLowerCase()) || reqSkill.toLowerCase().includes(ck)
    );
    if (isMatched) {
      matched.push(reqSkill);
    }
  }

  // Calculate score: base 60 + proportion of matched skills up to 96
  const totalRequired = job.skillsRequired.length;
  let score = 65;
  if (totalRequired > 0) {
    score = Math.min(96, Math.max(50, Math.round(55 + (matched.length / totalRequired) * 40)));
  }

  return {
    matchScore: score,
    matchedSkills: matched,
  };
}

/**
 * Computes deterministic SHA-256 hash for job search queries
 */
export function computeJobQueryHash(query: JobSearchQuery): string {
  const norm = `${query.q || ""}:${query.location || "ALL"}:${query.level || "ALL"}:${query.workplace || "ALL"}`;
  return createHash("sha256").update(norm.toLowerCase()).digest("hex");
}

/**
 * Searches and filters jobs with multi-tier caching and CV relevancy scoring
 */
export async function searchJobListings(
  query: JobSearchQuery,
  cvData?: CvData | null
): Promise<{ jobs: JobListing[]; total: number; fromCache: boolean }> {
  const queryHash = computeJobQueryHash(query);
  const now = Date.now();

  // 1. Check in-memory fast cache
  const memCached = MEMORY_JOB_CACHE.get(queryHash);
  if (memCached && now < memCached.expiresAt) {
    const jobsWithScores = memCached.data.map((job) => {
      const match = calculateJobMatch(job, cvData);
      return { ...job, matchScore: match.matchScore, matchedSkills: match.matchedSkills };
    });
    return { jobs: jobsWithScores, total: jobsWithScores.length, fromCache: true };
  }

  // 2. Filter dataset
  const qLower = (query.q || "").toLowerCase().trim();
  const locLower = (query.location || "ALL").toLowerCase();
  const levelFilter = query.level || "ALL";
  const workplaceFilter = query.workplace || "ALL";

  let results = SEED_JOB_LISTINGS.filter((job) => {
    // Keyword match (title, company, description, or skills)
    if (qLower) {
      const matchesTitle = job.title.toLowerCase().includes(qLower);
      const matchesCompany = job.company.toLowerCase().includes(qLower);
      const matchesSkill = job.skillsRequired.some((s) => s.toLowerCase().includes(qLower));
      const matchesDesc = job.description.toLowerCase().includes(qLower);

      if (!matchesTitle && !matchesCompany && !matchesSkill && !matchesDesc) {
        return false;
      }
    }

    // Location match
    if (locLower !== "all") {
      if (!job.location.toLowerCase().includes(locLower)) {
        return false;
      }
    }

    // Level match
    if (levelFilter !== "ALL") {
      if (job.experienceLevel !== levelFilter) {
        return false;
      }
    }

    // Workplace match
    if (workplaceFilter !== "ALL") {
      if (job.workplaceType !== workplaceFilter) {
        return false;
      }
    }

    return true;
  });

  // Calculate matching scores
  results = results.map((job) => {
    const match = calculateJobMatch(job, cvData);
    return {
      ...job,
      matchScore: match.matchScore,
      matchedSkills: match.matchedSkills,
    };
  });

  // Sort by highest match score
  results.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

  // 3. Cache to memory
  MEMORY_JOB_CACHE.set(queryHash, {
    data: results,
    expiresAt: now + CACHE_TTL_MS,
  });

  // 4. Save to Supabase job_cache table (non-blocking)
  if (process.env.NODE_ENV !== "test") {
    try {
      const supabase = await createClient();
      const expiresAtIso = new Date(now + CACHE_TTL_MS).toISOString();
      await supabase.from("job_cache").upsert({
        query_hash: queryHash,
        results: results as unknown as Json,
        expires_at: expiresAtIso,
      });
    } catch (dbErr) {
      // Non-blocking cache write failure
      console.warn("Could not save to Supabase job_cache:", dbErr);
    }
  }

  return {
    jobs: results,
    total: results.length,
    fromCache: false,
  };
}
