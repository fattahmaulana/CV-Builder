"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence, MotionConfig, useReducedMotion } from "motion/react";
import { FileText, Search, Table2, Sparkles, ArrowRight, Check, Calendar, CheckCircle2, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FeatureKey = "cv-maker" | "jobs" | "tracker";

interface FeatureInfo {
  id: FeatureKey;
  step: string;
  tabLabel: string;
  icon: typeof FileText;
  badge: string;
  tagline: string;
  headline: string;
  description: string;
  ctaText: string;
  ctaHref: string;
  accentColor: string;
  points: { title: string; desc: string }[];
}

const FEATURES: FeatureInfo[] = [
  {
    id: "cv-maker",
    step: "01",
    tabLabel: "Pembuat CV ATS",
    icon: FileText,
    badge: "STANDAR RESMI HARVARD",
    tagline: "GARANSI 100% TERBACA SISTEM",
    headline: "Susun CV Standar ATS Tanpa Pusing Tata Bahasa Formal",
    description:
      "Tulis pengalaman apa adanya dengan bahasa santai. AI otomatis merapikannya menjadi kalimat aktif terukur standar Harvard yang siap tembus mesin rekrutmen.",
    ctaText: "Mulai Buat CV Sekarang",
    ctaHref: "/cv/new",
    accentColor: "var(--accent)",
    points: [
      { title: "Layout 1 Kolom Linier", desc: "Bebas tabel rumit atau text box yang sering membuat robot ATS salah baca data Anda." },
      { title: "Perapian AI Otomatis", desc: "Mengubah tugas harian jadi pencapaian nyata berbobot angka tanpa mengarang fakta palsu." },
      { title: "Ekspor Ganda: PDF & Word (DOCX)", desc: "Dapatkan berkas PDF asli dengan teks yang dapat dicari/dipilih, serta DOCX yang fleksibel diedit." },
    ],
  },
  {
    id: "jobs",
    step: "02",
    tabLabel: "Cari Lowongan",
    icon: Search,
    badge: "LOWONGAN TERKURASI",
    tagline: "PENYELARASAN KATA KUNCI REAL-TIME",
    headline: "Temukan Lowongan Magang & Fresh Graduate yang Tepat",
    description:
      "Jelajahi direktori lowongan kerja terverifikasi. Sistem otomatis mengekstrak kata kunci wajib dari poster lowongan sehingga CV Anda langsung sinkron dengan kriteria HRD.",
    ctaText: "Jelajahi Direktori Lowongan",
    ctaHref: "/lowongan",
    accentColor: "var(--accent-3)",
    points: [
      { title: "Kurasi Khusus Fresh Graduate & Intern", desc: "Semua lowongan difilter khusus posisi awal karir tanpa tuntutan pengalaman kerja bertahun-tahun." },
      { title: "Skor Kecocokan Kata Kunci ATS", desc: "Ketahui persentase kecocokan skill CV Anda terhadap kualifikasi lowongan sebelum melamar." },
      { title: "1-Klik Generate CV Tertarget", desc: "Langsung buat draf CV yang diselaraskan dengan kata kunci lowongan incaran dalam satu klik." },
    ],
  },
  {
    id: "tracker",
    step: "03",
    tabLabel: "Pelacak Lamaran",
    icon: Table2,
    badge: "MANAJEMEN LAMARAN KERJA",
    tagline: "PANTAU PROGRES INTERVIEW REAL-TIME",
    headline: "Ketahui Status Lamaran: Mana yang Terkirim & Wawancara",
    description:
      "Lupakan spreadsheet Excel yang berantakan. Pantau seluruh proses rekrutmen dari tahap kirim berkas, jadwal wawancara, hingga offering letter dalam satu dasbor rapi.",
    ctaText: "Buka Papan Pelacak Lamaran",
    ctaHref: "/tracker",
    accentColor: "var(--accent-2)",
    points: [
      { title: "Papan Status Kanban Visual", desc: "Kategori jelas: Belum Dikirim, Terkirim, Wawancara HR/User, Tawaran, hingga Ditolak." },
      { title: "Catatan & Pengingat Jadwal Interview", desc: "Simpan tautan lowongan, versi CV yang dikirim, serta jadwal interview agar tidak terlewat." },
      { title: "Riwayat Terpusat Tanpa Lupa", desc: "Cegah salah melamar dua kali ke perusahaan yang sama dan ketahui tingkat keberhasilan berkas Anda." },
    ],
  },
];

const MONO = "font-[family-name:var(--font-mono)]";
const SPRING = { type: "spring", stiffness: 320, damping: 28 } as const;

/* ------------------------------------------------------------------ */
/* Helper                                                              */
/* ------------------------------------------------------------------ */

function useIsMobile() {
  const [mobile, setMobile] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return mobile;
}

function CountUp({ to, duration = 1100 }: { to: number; duration?: number }) {
  const reduced = useReducedMotion();
  const [value, setValue] = React.useState(reduced ? to : 0);
  React.useEffect(() => {
    if (reduced) {
      setValue(to);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setValue(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, duration, reduced]);
  return <>{value}</>;
}

function RotatingWord({ words, active }: { words: string[]; active: boolean }) {
  const [i, setI] = React.useState(0);
  React.useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setI((n) => (n + 1) % words.length), 2000);
    return () => clearInterval(t);
  }, [active, words.length]);
  return (
    <span className="relative inline-flex overflow-hidden align-bottom">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={words[i]}
          initial={{ y: 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -14, opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="inline-block"
        >
          {words[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Papan 1: CV Maker                                                   */
/* ------------------------------------------------------------------ */

function CvBoard({ rich }: { rich: boolean }) {
  const [aiOn, setAiOn] = React.useState(true);

  const swap = {
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -6 },
    transition: { duration: 0.15 },
  };

  const Mark = ({ children, delay }: { children: React.ReactNode; delay: number }) => (
    <motion.mark
      initial={{ backgroundSize: "0% 100%" }}
      animate={{ backgroundSize: "100% 100%" }}
      transition={{ delay, duration: 0.6, ease: "easeOut" }}
      style={{
        backgroundImage: "linear-gradient(var(--accent), var(--accent))",
        backgroundRepeat: "no-repeat",
        backgroundColor: "transparent",
      }}
      className="rounded-[1px] border border-black/40 px-1 font-bold text-black [box-decoration-break:clone]"
    >
      {children}
    </motion.mark>
  );

  return (
    <div className="rounded-[3px] border-[3px] border-black bg-[var(--bg)] p-4 shadow-[5px_5px_0_0_#000000] sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b-2 border-black pb-3">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 animate-pulse rounded-full border border-black bg-[var(--status-success)]" />
          <span className={`text-xs font-extrabold uppercase ${MONO}`}>Format Harvard Linier (1 Kolom)</span>
        </div>
        <motion.button
          type="button"
          whileTap={{ scale: 0.94 }}
          onClick={() => setAiOn(!aiOn)}
          aria-pressed={aiOn}
          className={cn(
            "flex cursor-pointer items-center gap-1 rounded-[2px] border border-black px-2.5 py-1 text-[11px] font-bold transition-colors",
            MONO,
            aiOn ? "bg-[var(--accent)] text-black shadow-[1px_1px_0_0_#000]" : "bg-white text-neutral-600"
          )}
        >
          <motion.span
            animate={rich && aiOn ? { rotate: [0, 20, -20, 0], scale: [1, 1.25, 1] } : {}}
            transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 2.5 }}
            className="inline-flex"
          >
            <Sparkles className="h-3 w-3" />
          </motion.span>
          <span>{aiOn ? "Sorotan AI: Aktif" : "Sorotan AI: Nonaktif"}</span>
        </motion.button>
      </div>

      <div className="relative space-y-3 overflow-hidden rounded-[2px] border-2 border-black bg-white p-4 shadow-[3px_3px_0_0_#000000] font-[family-name:var(--font-body)] sm:p-5">
        {rich && (
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 z-10 h-10 bg-gradient-to-b from-transparent via-[var(--accent)]/45 to-transparent"
            initial={{ top: "-20%" }}
            animate={{ top: "110%" }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 1.5, ease: "linear" }}
          />
        )}

        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-b border-black pb-2 text-center"
        >
          <p className="text-base font-black tracking-tight text-black font-[family-name:var(--font-display)] sm:text-lg">
            DIMAS PRASETYO
          </p>
          <p className={`text-[10px] font-semibold text-neutral-700 sm:text-[11px] ${MONO}`}>
            Jakarta, ID • dimas.prasetyo@email.com • 0812-3456-7890 • linkedin.com/in/dimas
          </p>
        </motion.div>

        <div>
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className="text-black">PT Solusi Teknologi Nusantara — Software Engineer Intern</span>
            <span className={`text-[10px] text-neutral-600 ${MONO}`}>Feb 2024 – Jul 2024</span>
          </div>
          <ul className="mt-1 list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-neutral-800">
            <motion.li initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span key={aiOn ? "a1" : "b1"} {...swap} className="block">
                  {aiOn ? (
                    <>
                      <Mark delay={0.3}>Mengembangkan microservices REST API</Mark>{" "}
                      menggunakan Golang dan database PostgreSQL untuk modul pembayaran.
                    </>
                  ) : (
                    "Bikin fitur backend REST API pake Go dan database postgres buat modul bayar."
                  )}
                </motion.span>
              </AnimatePresence>
            </motion.li>
            <motion.li initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span key={aiOn ? "a2" : "b2"} {...swap} className="block">
                  {aiOn ? (
                    <>
                      <Mark delay={0.5}>Memangkas latensi query sebesar 32%</Mark>{" "}
                      melalui penerapan composite indexing dan connection pooling terstruktur.
                    </>
                  ) : (
                    "Query database lambat trus di-index biar responnya jadi lebih cepet."
                  )}
                </motion.span>
              </AnimatePresence>
            </motion.li>
          </ul>
        </div>

        <div
          className={`flex flex-wrap items-center justify-between gap-2 border-t border-black/20 pt-2 text-[10px] font-bold sm:text-[11px] ${MONO}`}
        >
          <span className="flex items-center gap-1 text-[var(--status-success)]">
            <CheckCircle2 className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>
              Skor ATS <CountUp to={95} />/100 • 100% Teks Terbaca Mesin
            </span>
          </span>
          <div className="flex items-center gap-1.5">
            <motion.span
              whileHover={{ y: -2 }}
              className="rounded-[2px] border border-black bg-black px-2 py-0.5 text-white"
            >
              PDF HARVARD
            </motion.span>
            <motion.span
              whileHover={{ y: -2 }}
              className="rounded-[2px] border border-black bg-[var(--accent-2)] px-2 py-0.5 text-black"
            >
              WORD DOCX
            </motion.span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Papan 2: Lowongan                                                   */
/* ------------------------------------------------------------------ */

const JOBS = [
  {
    company: "PT Bank Mandiri (Persero) Tbk",
    chip: "bg-[var(--accent)]",
    title: "Backend Engineer Intern (Go / PostgreSQL)",
    meta: "Jakarta Selatan • Hybrid • Rp4.500.000 – Rp6.500.000/bln",
    match: 96,
    matchStyle: "border-emerald-600 bg-[var(--status-success)]/20 text-emerald-800",
    tags: ["Golang", "PostgreSQL", "Docker", "REST API"],
  },
  {
    company: "Shopee Indonesia",
    chip: "bg-[var(--accent-2)]",
    title: "Product Growth Associate (Fresh Graduate)",
    meta: "Jakarta Pusat • On-site • Gaji Kompetitif",
    match: 91,
    matchStyle: "border-black bg-[var(--accent)] text-black",
    tags: ["Data Analysis", "SQL", "Growth Hacking"],
  },
];

function JobsBoard({ rich }: { rich: boolean }) {
  return (
    <div className="rounded-[3px] border-[3px] border-black bg-[var(--bg)] p-4 shadow-[5px_5px_0_0_#000000] sm:p-6">
      <div className="mb-4 flex items-center gap-2 border-b-2 border-black pb-3">
        <div className="flex flex-1 items-center gap-2 rounded-[2px] border-2 border-black bg-white px-3 py-1.5">
          <Search className="h-3.5 w-3.5 shrink-0 stroke-[2.5] text-neutral-500" />
          <span className={`text-xs font-bold text-neutral-800 ${MONO}`}>
            {rich ? (
              <>
                Posisi: <RotatingWord active words={["Backend", "Frontend", "Marketing", "Data"]} /> Intern
              </>
            ) : (
              "Posisi: Backend, Frontend, Marketing Intern..."
            )}
          </span>
          {rich && <span className="dd3-caret h-3.5 w-[2px] bg-black" />}
        </div>
        <motion.span
          animate={rich ? { scale: [1, 1.07, 1] } : {}}
          transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 1 }}
          className={`rounded-[2px] border border-black bg-black px-2 py-1.5 text-[10px] font-bold uppercase text-white ${MONO}`}
        >
          Terverifikasi
        </motion.span>
      </div>

      <div className="space-y-2.5">
        {JOBS.map((job, i) => (
          <motion.div
            key={job.company}
            initial={{ opacity: 0, x: -28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.12 + i * 0.16, type: "spring", stiffness: 260, damping: 24 }}
            whileHover={{ x: 5 }}
            className="relative rounded-[3px] border-2 border-black bg-white p-3.5 shadow-[3px_3px_0_0_#000000]"
          >
            {rich && i === 1 && (
              <motion.span
                aria-hidden="true"
                animate={{ rotate: [-6, 6, -6] }}
                transition={{ duration: 1.4, repeat: Infinity }}
                className={`absolute -right-2 -top-3 border-2 border-black bg-[var(--accent)] px-1.5 text-[10px] font-black text-black ${MONO}`}
              >
                BARU
              </motion.span>
            )}
            <div className="flex items-start justify-between gap-2">
              <div>
                <span
                  className={`mb-1 inline-block border border-black px-1.5 text-[10px] font-extrabold uppercase text-black ${MONO} ${job.chip}`}
                >
                  {job.company}
                </span>
                <h4 className="text-sm font-extrabold text-black font-[family-name:var(--font-display)]">{job.title}</h4>
                <p className={`mt-0.5 text-[11px] text-neutral-600 ${MONO}`}>{job.meta}</p>
              </div>
              <span
                className={`shrink-0 rounded-[2px] border px-2 py-1 text-xs font-black ${MONO} ${job.matchStyle}`}
              >
                <CountUp to={job.match} />% Cocok
              </span>
            </div>

            <div className="mt-2.5 h-1.5 border border-black bg-white" aria-hidden="true">
              <motion.div
                className="h-full bg-black"
                initial={{ width: 0 }}
                animate={{ width: `${job.match}%` }}
                transition={{ delay: 0.3 + i * 0.16, duration: 0.9, ease: "easeOut" }}
              />
            </div>

            <div className={`mt-2.5 flex flex-wrap gap-1.5 border-t border-black/15 pt-2 text-[10px] font-bold ${MONO}`}>
              {job.tags.map((tag, t) => (
                <motion.span
                  key={tag}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.16 + t * 0.06, type: "spring", stiffness: 400, damping: 18 }}
                  className="border border-black/40 bg-neutral-100 px-1.5 py-0.5"
                >
                  {tag}
                </motion.span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Papan 3: Pelacak                                                    */
/* ------------------------------------------------------------------ */

interface KCardData {
  id: string;
  name: string;
  role: string;
}

const SENT: KCardData[] = [
  { id: "goto", name: "GoTo / Tokopedia", role: "Frontend Intern" },
  { id: "bca", name: "BCA Digital", role: "QA Tester" },
  { id: "tiket", name: "Tiket.com", role: "Data Analyst Intern" },
];
const SENT_DATE: Record<string, string> = { goto: "Kirim: 22 Okt", bca: "Kirim: 24 Okt", tiket: "Kirim: 26 Okt" };

function CountBadge({ n, className }: { n: number; className: string }) {
  return (
    <motion.span
      key={n}
      initial={{ scale: 1.6 }}
      animate={{ scale: 1 }}
      transition={SPRING}
      className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-black text-black ${className}`}
    >
      {n}
    </motion.span>
  );
}

function TrackerBoard({
  rich,
  activeCard,
  setActiveCard,
}: {
  rich: boolean;
  activeCard: string;
  setActiveCard: (id: string) => void;
}) {
  const [moved, setMoved] = React.useState(false);

  React.useEffect(() => {
    if (!rich) return;
    const t = setInterval(() => setMoved((m) => !m), 3200);
    return () => clearInterval(t);
  }, [rich]);

  const sent = SENT.filter((c) => !(moved && c.id === "bca"));
  const total = SENT.length + 2 + 1;

  const col = (i: number) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: 0.1 + i * 0.12 },
  });

  return (
    <div className="rounded-[3px] border-[3px] border-black bg-[var(--bg)] p-4 shadow-[5px_5px_0_0_#000000] sm:p-6">
      <div className="mb-4 flex items-center justify-between border-b-2 border-black pb-3">
        <span className={`text-xs font-extrabold uppercase text-black ${MONO}`}>Papan Lamaran Aktif (Kanban Tracker)</span>
        <span
          className={`border border-black bg-[var(--accent)] px-2 py-0.5 text-[10px] font-extrabold text-black ${MONO}`}
        >
          {total} Lamaran Terpantau
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:min-h-[270px] sm:grid-cols-3">
        {/* Terkirim */}
        <motion.div {...col(0)} className="rounded-[2px] border-2 border-black bg-white p-2.5">
          <div className="mb-2 flex items-center justify-between border-b border-black/20 pb-1.5">
            <span className={`text-[11px] font-extrabold uppercase text-neutral-700 ${MONO}`}>Terkirim</span>
            <CountBadge n={sent.length} className="bg-neutral-200" />
          </div>
          <div className="space-y-2">
            {sent.map((c) => (
              <motion.div
                key={c.id}
                layout
                layoutId={`k-${c.id}`}
                transition={SPRING}
                className="rounded-[2px] border border-black bg-neutral-50 p-2 text-xs"
              >
                <p className="truncate font-bold text-black">{c.name}</p>
                <p className="text-[10px] text-neutral-600">{c.role}</p>
                <span className="mt-1 inline-block border border-neutral-400 bg-neutral-200 px-1 text-[9px] text-neutral-800">
                  {SENT_DATE[c.id]}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Wawancara */}
        <motion.div
          {...col(1)}
          className="rounded-[2px] border-2 border-black bg-white p-2.5 shadow-[2px_2px_0_0_#FFE500]"
        >
          <div className="mb-2 flex items-center justify-between border-b border-black/20 pb-1.5">
            <span className={`text-[11px] font-extrabold uppercase text-black ${MONO}`}>Wawancara</span>
            <CountBadge n={moved ? 3 : 2} className="bg-[var(--accent)]" />
          </div>
          <div className="space-y-2">
            <motion.div
              layout
              onClick={() => setActiveCard("mandiri")}
              transition={SPRING}
              className={cn(
                "cursor-pointer rounded-[2px] border-2 border-black p-2 text-xs transition-colors",
                activeCard === "mandiri" ? "bg-[var(--accent)] shadow-[2px_2px_0_0_#000]" : "bg-white"
              )}
            >
              <p className="truncate font-bold text-black">Bank Mandiri</p>
              <p className="text-[10px] font-semibold text-neutral-800">Backend Intern</p>
              <div className="mt-1 flex items-center gap-1 border border-black bg-white px-1 py-0.5 text-[9px] font-bold text-black">
                <motion.span
                  animate={rich ? { scale: [1, 1.25, 1] } : {}}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  className="inline-flex"
                >
                  <Calendar className="h-3 w-3 stroke-[2.5]" />
                </motion.span>
                <span>HR: Besok 10:00 WIB</span>
              </div>
            </motion.div>

            <motion.div
              layout
              onClick={() => setActiveCard("traveloka")}
              transition={SPRING}
              className={cn(
                "cursor-pointer rounded-[2px] border-2 border-black p-2 text-xs transition-colors",
                activeCard === "traveloka" ? "bg-[var(--accent)] shadow-[2px_2px_0_0_#000]" : "bg-white"
              )}
            >
              <p className="truncate font-bold text-black">Traveloka</p>
              <p className="text-[10px] font-semibold text-neutral-800">Product Intern</p>
              <span className="mt-1 inline-block border border-blue-400 bg-blue-100 px-1 text-[9px] font-bold text-blue-900">
                User Interview: Jumat
              </span>
            </motion.div>

            {moved && (
              <motion.div
                layout
                layoutId="k-bca"
                transition={SPRING}
                className="rounded-[2px] border-2 border-black bg-[var(--accent)] p-2 text-xs shadow-[2px_2px_0_0_#000]"
              >
                <p className="truncate font-bold text-black">BCA Digital</p>
                <p className="text-[10px] font-semibold text-neutral-800">QA Tester</p>
                <span className="mt-1 inline-block border border-blue-400 bg-blue-100 px-1 text-[9px] font-bold text-blue-900">
                  Interview: Senin
                </span>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Tawaran */}
        <motion.div
          {...col(2)}
          className="rounded-[2px] border-2 border-black bg-white p-2.5 shadow-[2px_2px_0_0_#FF6B9D]"
        >
          <div className="mb-2 flex items-center justify-between border-b border-black/20 pb-1.5">
            <span className={`flex items-center gap-1 text-[11px] font-extrabold uppercase text-black ${MONO}`}>
              Tawaran
              <motion.span
                aria-hidden="true"
                animate={rich ? { scale: [1, 1.35, 1], rotate: [0, 15, 0] } : {}}
                transition={{ duration: 1.4, repeat: Infinity }}
                className="inline-block"
              >
                ✨
              </motion.span>
            </span>
            <CountBadge n={1} className="bg-[var(--accent-2)]" />
          </div>
          <motion.div
            animate={rich ? { rotate: [0, -2, 2, -1, 0] } : {}}
            transition={{ duration: 0.7, repeat: Infinity, repeatDelay: 2.4 }}
            className="rounded-[2px] border-2 border-black bg-[var(--accent-2)]/20 p-2 text-xs shadow-[1px_1px_0_0_#000]"
          >
            <p className="truncate font-black text-black">Blibli.com</p>
            <p className="text-[10px] font-bold text-neutral-900">Assoc. Engineer</p>
            <span className="mt-1 inline-block border border-black bg-emerald-300 px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-black">
              Diterima • Rp7.5jt
            </span>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Komponen utama                                                      */
/* ------------------------------------------------------------------ */

export function CareerEcosystemSection() {
  const [activeTab, setActiveTab] = React.useState<FeatureKey>("cv-maker");
  const [trackerActiveCard, setTrackerActiveCard] = React.useState<string>("mandiri");
  const [boardOpen, setBoardOpen] = React.useState(false); // hanya berpengaruh di mobile
  const reduced = useReducedMotion();
  const isMobile = useIsMobile();
  const rich = !reduced && !isMobile;

  const currentFeature = FEATURES.find((f) => f.id === activeTab) || FEATURES[0];

  const handleTab = (id: FeatureKey) => {
    if (id === activeTab) {
      setBoardOpen((o) => !o);
    } else {
      setActiveTab(id);
      setBoardOpen(true);
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <section
        id="fitur"
        className="scroll-mt-20 border-b-[3px] border-black bg-[var(--bg)] px-4 py-16 sm:px-6 sm:py-24"
        aria-label="Ekosistem Lengkap CVBuilder"
      >
        <style>{`
          @keyframes dd3-blink { 50% { opacity: 0 } }
          .dd3-caret { animation: dd3-blink 1s steps(1) infinite; }
          @media (prefers-reduced-motion: reduce) { .dd3-caret { animation: none; } }
        `}</style>

        <span id="skor-kecocokan" className="sr-only" />
        <span id="kenapa-ats" className="sr-only" />

        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mx-auto mb-10 max-w-3xl text-center sm:mb-14"
          >
            <Badge variant="accent" isSticker className="mb-3">
              3 FITUR UTAMA • EKOSISTEM PENCARI KERJA
            </Badge>
            <h2 className="text-3xl font-black leading-tight tracking-tight text-black font-[family-name:var(--font-display)] sm:text-5xl">
              Bukan Sekadar Buat CV, Kawal Karirmu Sampai Diterima
            </h2>
            <p className="mt-4 text-sm text-neutral-800 font-[family-name:var(--font-body)] sm:text-base">
              Tiga pilar esensial yang saling terhubung: susun CV standar ATS, temukan lowongan yang relevan, dan kelola
              setiap tahapan wawancara dalam satu aplikasi.
            </p>
          </motion.div>

          {/* Tab: ikon saja di mobile */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.4 }}
            role="group"
            aria-label="Pilih fitur"
            className="mb-3 flex items-center justify-center gap-3 sm:mb-12"
          >
            {FEATURES.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleTab(item.id)}
                  aria-pressed={isActive}
                  aria-label={item.tabLabel}
                  title={item.tabLabel}
                  className={cn(
                    "relative flex h-12 w-12 cursor-pointer select-none items-center justify-center rounded-[3px] border-[2.5px] border-black text-xs font-bold uppercase transition-[transform,box-shadow] duration-150 sm:h-auto sm:w-auto sm:gap-2 sm:px-5 sm:py-2.5 sm:text-sm",
                    MONO,
                    "focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-black",
                    isActive
                      ? "text-white"
                      : "bg-[var(--surface)] text-black shadow-[2px_2px_0_0_#000000] hover:-translate-x-px hover:-translate-y-px hover:bg-neutral-100"
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="career-tab-pill"
                      transition={SPRING}
                      className="absolute inset-0 rounded-[2px] bg-black shadow-[4px_4px_0_0_#FFE500]"
                    />
                  )}
                  <span
                    className={cn(
                      "relative z-10 hidden rounded-[2px] border border-black px-1.5 text-[10px] font-black sm:inline-block",
                      isActive ? "bg-[var(--accent)] text-black" : "bg-neutral-200 text-black"
                    )}
                  >
                    {item.step}
                  </span>
                  <motion.span
                    key={isActive ? "on" : "off"}
                    initial={isActive ? { scale: 0.6, rotate: -15 } : false}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={SPRING}
                    className="relative z-10 inline-flex"
                  >
                    <Icon className="h-5 w-5 stroke-[2.5] sm:h-4 sm:w-4" />
                  </motion.span>
                  <span className="relative z-10 hidden sm:inline">{item.tabLabel}</span>
                </button>
              );
            })}
          </motion.div>

          <p
            aria-live="polite"
            className={`mb-8 text-center text-xs font-extrabold uppercase text-black sm:hidden ${MONO}`}
          >
            {currentFeature.tabLabel}
          </p>

          {/* Kartu utama */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="rounded-[4px] border-[3px] border-black bg-[var(--surface)] p-4 shadow-[8px_8px_0_0_#000000] sm:p-8 lg:p-10"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentFeature.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-12"
              >
                {/* Papan */}
                <div className="order-2 lg:order-1 lg:col-span-7">
                  <button
                    type="button"
                    onClick={() => setBoardOpen((o) => !o)}
                    aria-expanded={boardOpen}
                    aria-controls="career-board"
                    className={`mb-3 flex w-full items-center justify-between border-[3px] border-black bg-white px-3 py-3 text-xs font-bold uppercase shadow-[3px_3px_0_0_#000] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:hidden ${MONO}`}
                  >
                    <span>{boardOpen ? "Sembunyikan papan" : "Lihat papan"}</span>
                    <ChevronDown className={cn("h-4 w-4 stroke-[3] transition-transform", boardOpen && "rotate-180")} />
                  </button>

                  <div
                    id="career-board"
                    className={cn(
                      "grid grid-rows-[1fr] transition-[grid-template-rows,visibility] duration-300 ease-out",
                      !boardOpen && "max-sm:invisible max-sm:grid-rows-[0fr]"
                    )}
                  >
                    <div className="min-h-0 max-sm:overflow-hidden">
                      <div className="max-sm:pb-2 max-sm:pr-2">
                        {currentFeature.id === "cv-maker" && <CvBoard rich={rich} />}
                        {currentFeature.id === "jobs" && <JobsBoard rich={rich} />}
                        {currentFeature.id === "tracker" && (
                          <TrackerBoard rich={rich} activeCard={trackerActiveCard} setActiveCard={setTrackerActiveCard} />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Teks & CTA */}
                <div className="order-1 space-y-5 lg:order-2 lg:col-span-5">
                  <div className="space-y-2">
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`sticker sticker-left inline-block border border-black bg-black px-2.5 py-0.5 text-[11px] font-bold uppercase text-white ${MONO}`}
                    >
                      {currentFeature.badge}
                    </motion.span>
                    <motion.h3
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.06 }}
                      className="text-2xl font-black leading-snug tracking-tight text-black font-[family-name:var(--font-display)] sm:text-3xl"
                    >
                      {currentFeature.headline}
                    </motion.h3>
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.12 }}
                      className="text-xs leading-relaxed text-neutral-700 font-[family-name:var(--font-body)] sm:text-sm"
                    >
                      {currentFeature.description}
                    </motion.p>
                  </div>

                  <div className="space-y-2.5 pt-1">
                    {currentFeature.points.map((pt, idx) => (
                      <motion.div
                        key={pt.title}
                        initial={{ opacity: 0, x: 18 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + idx * 0.1, type: "spring", stiffness: 260, damping: 24 }}
                        whileHover={{ x: -3, y: -3 }}
                        className="flex items-start gap-3 rounded-[2px] border-2 border-black bg-neutral-50 p-3 shadow-[2px_2px_0_0_#000000]"
                      >
                        <motion.div
                          initial={{ scale: 0, rotate: -90 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ delay: 0.3 + idx * 0.1, type: "spring", stiffness: 400, damping: 16 }}
                          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[2px] border-2 border-black bg-[var(--accent)]"
                        >
                          <Check className="h-3.5 w-3.5 stroke-[3] text-black" />
                        </motion.div>
                        <div>
                          <h4 className="text-xs font-bold text-black font-[family-name:var(--font-display)] sm:text-sm">
                            {pt.title}
                          </h4>
                          <p className="mt-0.5 text-[11px] leading-snug text-neutral-600 font-[family-name:var(--font-body)] sm:text-xs">
                            {pt.desc}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="pt-2"
                  >
                    <Link href={currentFeature.ctaHref}>
                      <Button
                        variant="primary"
                        size="lg"
                        className="hard-drop flex w-full items-center justify-center gap-2 px-6 py-3.5 text-sm font-black sm:w-auto sm:text-base"
                      >
                        <span>{currentFeature.ctaText}</span>
                        <motion.span
                          animate={rich ? { x: [0, 5, 0] } : {}}
                          transition={{ duration: 1, repeat: Infinity, repeatDelay: 1.2 }}
                          className="inline-flex"
                        >
                          <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                        </motion.span>
                      </Button>
                    </Link>
                  </motion.div>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </section>
    </MotionConfig>
  );
}