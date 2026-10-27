"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  Coins,
  Gamepad2,
  Play,
  RotateCcw,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CVBuilderLogo3D } from "@/components/ui/CVBuilderLogo3D";

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */

type Stage = "idle" | "typing" | "processing" | "done";

interface Cartridge {
  id: string;
  label: string;
  score: number;
  raw: string;
  points: { highlighted: string; suffix: string }[];
}

const CARTRIDGES: Cartridge[] = [
  {
    id: "backend",
    label: "Backend",
    score: 92,
    raw: "magang bikin fitur login dan transfer pake Go, query database postgres lemot bgt trus di-index latensi turun 28%, bantuin senior deploy container docker.",
    points: [
      { highlighted: "Mengembangkan microservices REST API", suffix: " autentikasi dan transaksi dana menggunakan Go." },
      { highlighted: "Mengurangi latensi kueri database sebesar 28%", suffix: " melalui indexing PostgreSQL terstruktur." },
      { highlighted: "Mengotomatisasi containerization sistem", suffix: " menggunakan Docker untuk lingkungan staging." },
    ],
  },
  {
    id: "marketing",
    label: "Marketing",
    score: 88,
    raw: "magang marketing, bikin 24 konten instagram sebulan, followers naik 18% dalam 3 bulan, bikin laporan mingguan pake excel.",
    points: [
      { highlighted: "Memproduksi 24 konten Instagram per bulan", suffix: " untuk memperluas jangkauan akun brand." },
      { highlighted: "Menaikkan jumlah pengikut sebesar 18%", suffix: " dalam tiga bulan melalui jadwal unggah terstruktur." },
      { highlighted: "Menyusun laporan performa mingguan", suffix: " menggunakan Microsoft Excel untuk tim pemasaran." },
    ],
  },
  {
    id: "organisasi",
    label: "Organisasi",
    score: 90,
    raw: "jd ketua panitia acara kampus, ngatur 40 panitia, cari sponsor dapet 15 juta, bagi tugas ke tiap divisi.",
    points: [
      { highlighted: "Memimpin 40 anggota panitia", suffix: " dalam penyelenggaraan acara kampus." },
      { highlighted: "Mengumpulkan dana sponsor sebesar Rp15 juta", suffix: " dari mitra eksternal untuk kebutuhan acara." },
      { highlighted: "Membagi tugas ke seluruh divisi", suffix: " agar persiapan acara berjalan terkoordinasi." },
    ],
  },
];

const STEPS = [
  { n: 1, Icon: Coins, text: "Tekan tombol KOIN untuk memasukkan koin.", shortText: "Masukkan Koin" },
  { n: 2, Icon: Gamepad2, text: "Geser joystick untuk memilih kartrij pengalaman.", shortText: "Pilih Kartrij" },
  { n: 3, Icon: Play, text: "Tekan tombol hijau MULAI. Draf mentah akan diketik.", shortText: "Tekan Mulai" },
  { n: 4, Icon: Trophy, text: "Ambil hasilnya: kalimat CV rapi dan skor ATS.", shortText: "Hasil Format ATS" },
];

const MONO = "font-[family-name:var(--font-mono)]";
const CELL = 40;
const CELL_COLORS = ["#ffd23f", "#ff6b9d", "#5ab0ff", "#3ddc97"];

function reducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* ------------------------------------------------------------------ */
/* Karakter kecil yang berjalan keluar dari belakang mesin             */
/* ------------------------------------------------------------------ */

const eye = (cx: number, cy: number) => (
  <>
    <circle cx={cx} cy={cy} r="4.2" fill="#fff" stroke="#000" strokeWidth="2" />
    <circle cx={cx + 1.6} cy={cy} r="1.8" fill="#000" />
  </>
);

const feet = (
  <>
    <rect className="dd-leg-a" x="11" y="34" width="7" height="5" fill="#000" />
    <rect className="dd-leg-b" x="23" y="34" width="7" height="5" fill="#000" />
  </>
);

function Blob({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      {feet}
      <rect x="4" y="8" width="32" height="27" rx="9" fill="#ff6b9d" stroke="#000" strokeWidth="3" />
      {eye(19, 20)}
      {eye(28, 20)}
    </svg>
  );
}

function PaperBot({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      {feet}
      <rect x="7" y="3" width="27" height="32" rx="3" fill="#fff" stroke="#000" strokeWidth="3" />
      {eye(18, 14)}
      {eye(27, 14)}
      <rect x="12" y="24" width="18" height="2.5" fill="#000" />
      <rect x="12" y="29" width="11" height="2.5" fill="#000" />
    </svg>
  );
}

function CoinBot({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      {feet}
      <circle cx="20" cy="19" r="15" fill="#ffd23f" stroke="#000" strokeWidth="3" />
      {eye(16, 17)}
      {eye(25, 17)}
      <rect x="15" y="26" width="11" height="2.5" fill="#000" />
    </svg>
  );
}

function Ghost({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <path
        d="M5 36 V19 a15 15 0 0 1 30 0 V36 l-5 -4 -5 4 -5 -4 -5 4 -5 -4 z"
        fill="#5ab0ff"
        stroke="#000"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {eye(16, 18)}
      {eye(26, 18)}
    </svg>
  );
}

const WALKERS = [
  { Char: Blob, dir: 1, dur: 22, delay: 2, bottom: 8, size: 40, float: false },
  { Char: PaperBot, dir: -1, dur: 26, delay: 9, bottom: 8, size: 44, float: false },
  { Char: CoinBot, dir: 1, dur: 30, delay: 16, bottom: 8, size: 36, float: false },
  { Char: Ghost, dir: -1, dur: 28, delay: 5, bottom: 130, size: 40, float: true },
  { Char: Ghost, dir: 1, dur: 34, delay: 20, bottom: 260, size: 34, float: true },
];

/* ------------------------------------------------------------------ */
/* Komponen utama                                                      */
/* ------------------------------------------------------------------ */

export function TransformDemo() {
  const [idx, setIdx] = React.useState(0);
  const [credit, setCredit] = React.useState(false);
  const [stage, setStage] = React.useState<Stage>("idle");
  const [typed, setTyped] = React.useState("");
  const [score, setScore] = React.useState(0);
  const [tilt, setTilt] = React.useState(0);
  const [dragging, setDragging] = React.useState(false);
  const [coinKey, setCoinKey] = React.useState(0);
  const [flash, setFlash] = React.useState<string | null>(null);
  const [cells, setCells] = React.useState<{ id: number; c: number; r: number; color: string }[]>([]);

  const sectionRef = React.useRef<HTMLElement>(null);
  const flashTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const nudgeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragStart = React.useRef<number | null>(null);
  const lastCell = React.useRef<number | null>(null);
  const cellId = React.useRef(0);

  const cartridge = CARTRIDGES[idx];
  const busy = stage === "typing" || stage === "processing";

  React.useEffect(
    () => () => {
      if (flashTimer.current) clearTimeout(flashTimer.current);
      if (nudgeTimer.current) clearTimeout(nudgeTimer.current);
    },
    []
  );

  React.useEffect(() => {
    if (stage !== "typing") return;
    if (reducedMotion()) {
      setTyped(cartridge.raw);
      setStage("done");
      return;
    }
    let i = 0;
    const timer = setInterval(() => {
      i += 1;
      setTyped(cartridge.raw.slice(0, i));
      if (i >= cartridge.raw.length) {
        clearInterval(timer);
        setStage("processing");
      }
    }, 22);
    return () => clearInterval(timer);
  }, [stage, cartridge]);

  React.useEffect(() => {
    if (stage !== "processing") return;
    const timer = setTimeout(() => setStage("done"), 1400);
    return () => clearTimeout(timer);
  }, [stage]);

  React.useEffect(() => {
    if (stage !== "done") {
      setScore(0);
      return;
    }
    if (reducedMotion()) {
      setScore(cartridge.score);
      return;
    }
    let v = 0;
    const timer = setInterval(() => {
      v = Math.min(v + 4, cartridge.score);
      setScore(v);
      if (v >= cartridge.score) clearInterval(timer);
    }, 24);
    return () => clearInterval(timer);
  }, [stage, cartridge.score]);

  /* Background grid mengikuti kursor */
  const onGridMove = (e: React.PointerEvent<HTMLElement>) => {
    const el = sectionRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    el.style.setProperty("--dd-mx", `${x}px`);
    el.style.setProperty("--dd-my", `${y}px`);
    if (reducedMotion()) return;
    const c = Math.floor(x / CELL);
    const r = Math.floor(y / CELL);
    const key = c * 10000 + r;
    if (key === lastCell.current) return;
    lastCell.current = key;
    const id = ++cellId.current;
    setCells((prev) => [...prev.slice(-11), { id, c, r, color: CELL_COLORS[id % CELL_COLORS.length] }]);
  };
  const onGridLeave = () => {
    const el = sectionRef.current;
    if (!el) return;
    el.style.setProperty("--dd-mx", "-600px");
    el.style.setProperty("--dd-my", "-600px");
    lastCell.current = null;
  };

  const showFlash = (msg: string) => {
    setFlash(msg);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(null), 1800);
  };

  const changeCartridge = (dir: 1 | -1) => {
    setIdx((i) => (i + dir + CARTRIDGES.length) % CARTRIDGES.length);
    setTyped("");
    setStage("idle");
  };

  const nudge = (dir: 1 | -1) => {
    changeCartridge(dir);
    setTilt(dir);
    if (nudgeTimer.current) clearTimeout(nudgeTimer.current);
    nudgeTimer.current = setTimeout(() => setTilt(0), 180);
  };

  const insertCoin = () => {
    setCoinKey((k) => k + 1);
    if (credit) {
      showFlash("Koin sudah masuk. Tekan MULAI.");
      return;
    }
    setCredit(true);
  };

  const pressStart = () => {
    if (busy) return;
    if (!credit) {
      showFlash("Masukkan koin dulu.");
      return;
    }
    setTyped("");
    setStage("typing");
  };

  const pressReset = () => {
    if (stage === "idle") {
      showFlash("Anda sudah di menu.");
      return;
    }
    setTyped("");
    setStage("idle");
  };

  const onStickDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStart.current = e.clientX;
    setDragging(true);
  };
  const onStickMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStart.current === null) return;
    const dx = Math.max(-40, Math.min(40, e.clientX - dragStart.current));
    setTilt(dx / 40);
  };
  const onStickUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStart.current === null) return;
    const dx = e.clientX - dragStart.current;
    dragStart.current = null;
    setDragging(false);
    setTilt(0);
    if (Math.abs(dx) >= 24) changeCartridge(dx > 0 ? 1 : -1);
  };
  const onStickKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      nudge(-1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      nudge(1);
    }
  };

  const activeSteps = !credit ? [1] : stage === "idle" ? [2, 3] : stage === "done" ? [4] : [3];
  const firstActive = Math.min(...activeSteps);

  const hint =
    flash ??
    (!credit
      ? "Tekan KOIN untuk memulai."
      : stage === "idle"
        ? "Geser joystick untuk pilih kartrij, lalu tekan MULAI."
        : stage === "typing"
          ? "Mengetik draf mentah..."
          : stage === "processing"
            ? "Memoles kalimat..."
            : "✓ Selesai. Semua angka berasal dari draf Anda.");

  const focusRing =
    "focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-black";

  const lineGrid = (alpha: number) =>
    `linear-gradient(to right, rgba(0,0,0,${alpha}) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,${alpha}) 1px, transparent 1px)`;
  const spotMask = "radial-gradient(circle 190px at var(--dd-mx) var(--dd-my), #000, transparent)";

  return (
    <section
      ref={sectionRef}
      aria-label="Demo mengubah bahasa mentah menjadi format CV ATS Harvard"
      onPointerMove={onGridMove}
      onPointerLeave={onGridLeave}
      className="relative isolate w-full overflow-hidden px-2 pt-6 pb-12 sm:px-3 sm:pt-14 sm:pb-32 [--dd-yellow:var(--accent,#ffd23f)] [--dd-mx:-600px] [--dd-my:-600px]"
    >
      <style>{`
        @keyframes dd-fill { from { width: 0 } to { width: 100% } }
        @keyframes dd-in { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }
        @keyframes dd-blink { 50% { opacity: 0 } }
        @keyframes dd-shake { 25% { transform: translateX(-4px) } 75% { transform: translateX(4px) } }
        @keyframes dd-coin { from { transform: translateY(-34px); opacity: 1 } to { transform: translateY(4px); opacity: 0 } }
        @keyframes dd-pulse { 50% { box-shadow: 0 0 0 5px rgba(0,0,0,.9), 0 0 0 9px var(--dd-yellow) } }
        @keyframes dd-cell { from { opacity: .85; transform: scale(1) } to { opacity: 0; transform: scale(.8) } }
        @keyframes dd-walk { 0% { transform: translateX(0) } 55%, 100% { transform: translateX(var(--dist)) } }
        @keyframes dd-bob { to { transform: translateY(-3px) } }
        @keyframes dd-float { to { transform: translateY(-9px) } }
        @keyframes dd-leg { 50% { transform: translateY(-2px) } }
        .dd-fill { width: 100%; animation: dd-fill 1.4s linear both; }
        .dd-in { animation: dd-in .3s ease-out both; }
        .dd-blink { animation: dd-blink 1s steps(1) infinite; }
        .dd-shake { animation: dd-shake .3s linear 2; }
        .dd-coin { animation: dd-coin .45s ease-in both; }
        .dd-pulse { animation: dd-pulse 1.2s ease-in-out infinite; }
        .dd-cell { animation: dd-cell .9s ease-out forwards; }
        .dd-walk { animation-name: dd-walk; animation-timing-function: linear; animation-iteration-count: infinite; }
        .dd-bob { animation: dd-bob .35s ease-in-out infinite alternate; }
        .dd-floaty { animation: dd-float 1.6s ease-in-out infinite alternate; }
        .dd-leg-a { animation: dd-leg .4s steps(2) infinite; }
        .dd-leg-b { animation: dd-leg .4s steps(2) infinite reverse; }
        @media (prefers-reduced-motion: reduce) {
          .dd-fill, .dd-in, .dd-blink, .dd-shake, .dd-coin, .dd-pulse, .dd-cell { animation: none !important; }
          .dd-walk { display: none; }
        }
      `}</style>

      {/* LATAR: grid penuh, sorotan, jejak kotak mengikuti kursor */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage: lineGrid(0.07),
          backgroundSize: `${CELL}px ${CELL}px`,
          maskImage: "linear-gradient(to bottom, black 0%, black calc(100% - 150px), transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 0%, black calc(100% - 150px), transparent 100%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage: lineGrid(0.4),
          backgroundSize: `${CELL}px ${CELL}px`,
          maskImage: spotMask,
          WebkitMaskImage: spotMask,
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_240px_at_var(--dd-mx)_var(--dd-my),rgba(255,210,63,0.28),transparent)]"
        style={{
          maskImage: "linear-gradient(to bottom, black 0%, black calc(100% - 120px), transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 0%, black calc(100% - 120px), transparent 100%)",
        }}
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        {cells.map((cell) => (
          <span
            key={cell.id}
            className="dd-cell absolute border-2 border-black/70"
            style={{
              left: cell.c * CELL,
              top: cell.r * CELL,
              width: CELL,
              height: CELL,
              backgroundColor: cell.color,
            }}
            onAnimationEnd={() => setCells((prev) => prev.filter((p) => p.id !== cell.id))}
          />
        ))}
      </div>

      {/* Gradasi pudar di bagian bawah agar grid menyatu lembut ke warna latar tanpa garis terpotong */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-44 sm:h-64 bg-gradient-to-t from-[var(--bg)] via-[var(--bg)]/90 via-35% to-transparent -z-10"
      />

      {/* PANGGUNG */}
      <div className="relative mx-auto w-full max-w-[440px] sm:max-w-[560px] pb-4 sm:pb-5">
        {/* Karakter di belakang mesin */}
        {WALKERS.map(({ Char, dir, dur, delay, bottom, size, float }, i) => (
          <div
            key={i}
            aria-hidden="true"
            className="dd-walk pointer-events-none absolute left-1/2 z-0"
            style={
              {
                bottom,
                marginLeft: -size / 2,
                animationDuration: `${dur}s`,
                animationDelay: `${delay}s`,
                "--dist": `${dir * 62}vw`,
              } as React.CSSProperties
            }
          >
            <div className={dir < 0 ? "-scale-x-100" : ""}>
              <div className={float ? "dd-floaty" : "dd-bob"}>
                <Char size={size} />
              </div>
            </div>
          </div>
        ))}

        {/* Bayangan lantai */}
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-[3%] right-[3%] z-0 h-5 rounded-[50%] bg-black/20"
        />

        {/* BADAN MESIN */}
        <div className="relative z-10 overflow-hidden rounded-t-[22px] sm:rounded-t-[28px] rounded-b-[8px] border-[2.5px] sm:border-[3px] border-black bg-[var(--dd-yellow)] px-1.5 pt-1.5 sm:px-3 sm:pt-3 shadow-[4px_4px_0_0_#000] sm:shadow-[6px_6px_0_0_#000]">
          {/* Marquee */}
          <div className="rounded-t-[16px] sm:rounded-t-[20px] border-[2px] sm:border-[3px] border-black bg-black px-2.5 py-2.5 sm:px-5 sm:py-4 text-center">
            <CVBuilderLogo3D size="sm" tone="light" className="justify-center sm:hidden" />
            <div className="hidden sm:block">
              <CVBuilderLogo3D size="md" tone="light" className="justify-center" />
            </div>
            <h3 className="mt-1.5 sm:mt-3 text-[20px] xs:text-[24px] sm:text-[38px] font-black uppercase leading-none text-[var(--dd-yellow)] [text-shadow:2px_2px_0_#e63946] sm:[text-shadow:4px_4px_0_#e63946]">
              Mesin Poles CV
            </h3>
            <p className={`mt-1 sm:mt-2 text-[10px] font-bold text-white sm:text-xs ${MONO}`}>
              Ubah bahasa mentah jadi format ATS Harvard
            </p>
          </div>

          {/* Bezel merah + layar */}
          <div className="mt-1.5 sm:mt-2 border-[2px] sm:border-[3px] border-black bg-[#e63946] bg-[repeating-linear-gradient(135deg,transparent_0,transparent_10px,rgba(0,0,0,0.08)_10px,rgba(0,0,0,0.08)_20px)] p-1.5 sm:p-4">
            <div className="border-[2px] sm:border-[3px] border-black bg-[var(--dd-yellow)] p-1 sm:p-2 shadow-[inset_0_-3px_0_0_rgba(0,0,0,0.25)] sm:shadow-[inset_0_-4px_0_0_rgba(0,0,0,0.25)]">
              <div className="rounded-[14px] sm:rounded-[18px] border-[2px] sm:border-[3px] border-black bg-black p-1 sm:p-2">
                {/* LAYAR: proporsi pas mobile (16:10 / 16:9 feel) agar pas di layar hp tanpa scroll panjang */}
                <div
                  className={`relative flex h-[270px] xs:h-[295px] sm:h-[450px] flex-col overflow-hidden rounded-[10px] sm:rounded-[12px] bg-[#1d3fd6] bg-[radial-gradient(rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:4px_4px] p-2.5 sm:p-4 shadow-[inset_0_0_30px_rgba(0,0,0,0.6)] sm:shadow-[inset_0_0_44px_rgba(0,0,0,0.6)] ${
                    flash ? "dd-shake" : ""
                  }`}
                >
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.14)_0,rgba(255,255,255,0)_35%)]"
                  />

                  {/* HUD */}
                  <div
                    className={`relative grid shrink-0 grid-cols-3 items-center border-b border-white/30 sm:border-b-2 sm:border-white/40 pb-1.5 sm:pb-2 text-[9px] font-bold uppercase text-white sm:text-xs ${MONO}`}
                  >
                    <span>Kredit {credit ? 1 : 0}</span>
                    <span className="text-center text-[var(--dd-yellow)] truncate px-1">
                      <span aria-hidden="true">◀ </span>
                      {cartridge.label}
                      <span aria-hidden="true"> ▶</span>
                    </span>
                    <span className="text-right">Skor {String(score).padStart(3, "0")}</span>
                  </div>

                  {/* Isi layar */}
                  <div className="relative min-h-0 flex-1 py-1.5 sm:py-3">
                    {stage === "idle" ? (
                      <div className="flex h-full flex-col justify-between overflow-y-auto">
                        <p className={`mb-1 sm:mb-2 text-xs sm:text-sm font-extrabold uppercase text-[#ff9aa2] ${MONO}`}>
                          Cara main
                        </p>
                        <ol className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-col sm:space-y-2">
                          {STEPS.map(({ n, Icon, text, shortText }) => {
                            const active = activeSteps.includes(n);
                            const done = n < firstActive;
                            return (
                              <li
                                key={n}
                                className={`flex items-center gap-1.5 sm:gap-3 border p-1 sm:p-2 sm:border-2 ${
                                  active
                                    ? "border-black bg-[var(--dd-yellow)] text-black"
                                    : "border-white/30 text-white"
                                } ${done ? "opacity-60" : ""}`}
                              >
                                <span
                                  className={`flex h-6 w-6 sm:h-9 sm:w-9 shrink-0 items-center justify-center border ${
                                    active ? "border-black bg-white" : "border-white/60"
                                  }`}
                                >
                                  {done ? (
                                    <span className="text-xs sm:text-base font-black" aria-label="selesai">✓</span>
                                  ) : (
                                    <Icon className="h-3.5 w-3.5 sm:h-5 sm:w-5" aria-hidden="true" />
                                  )}
                                </span>
                                <span className="text-[10px] sm:text-[13px] font-bold leading-tight sm:leading-snug">
                                  <span className={MONO}>{n}. </span>
                                  <span className="sm:hidden">{shortText}</span>
                                  <span className="hidden sm:inline">{text}</span>
                                </span>
                              </li>
                            );
                          })}
                        </ol>
                      </div>
                    ) : (
                      <div className="flex h-full flex-col gap-1.5 sm:gap-3">
                        <div className="h-[65px] xs:h-[75px] sm:h-[112px] shrink-0 overflow-y-auto border border-white/40 sm:border-2 p-1.5 sm:p-3">
                          <p className={`mb-0.5 sm:mb-1 text-[9px] sm:text-[11px] font-bold uppercase text-white/70 ${MONO}`}>
                            Draf mentah
                          </p>
                          <p className={`text-[10px] sm:text-xs leading-snug sm:leading-relaxed text-white ${MONO}`}>
                            {typed}
                            {stage === "typing" && (
                              <span className="dd-blink ml-1 inline-block h-3 sm:h-3.5 w-1.5 sm:w-2 bg-white align-middle" />
                            )}
                          </p>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain border border-black sm:border-2 bg-white p-1.5 sm:p-2.5">
                          <p className={`mb-1 sm:mb-2 text-[9px] sm:text-[11px] font-bold uppercase text-black ${MONO}`}>
                            Hasil format ATS Harvard
                          </p>
                          <div className="space-y-1 sm:space-y-2">
                            {stage === "typing" && (
                              <p className={`text-[10px] sm:text-xs italic text-neutral-500 ${MONO}`}>
                                Menunggu draf selesai...
                              </p>
                            )}
                            {stage === "processing" && (
                              <div>
                                <p className={`mb-1 sm:mb-2 text-[10px] sm:text-xs font-bold text-black ${MONO}`}>Memoles...</p>
                                <div className="h-3 sm:h-4 border border-black sm:border-2 bg-white">
                                  <div className="dd-fill h-full bg-[var(--dd-yellow)]" />
                                </div>
                              </div>
                            )}
                            {stage === "done" &&
                              cartridge.points.map((pt, i) => (
                                <p
                                  key={`${cartridge.id}-${i}`}
                                  className="dd-in text-[10px] sm:text-xs leading-snug sm:leading-relaxed text-black font-[family-name:var(--font-body)]"
                                  style={{ animationDelay: `${i * 100}ms` }}
                                >
                                  <span aria-hidden="true">• </span>
                                  <mark className="mx-0.5 rounded-[2px] border border-black bg-[var(--dd-yellow)] px-1 py-0.5 font-bold text-black">
                                    {pt.highlighted}
                                  </mark>
                                  <span>{pt.suffix}</span>
                                </p>
                              ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Pesan status, tinggi tetap */}
                  <p
                    aria-live="polite"
                    className={`relative flex h-7 sm:h-10 shrink-0 items-center justify-center border-t border-white/30 sm:border-t-2 sm:border-white/40 pt-1 sm:pt-2 text-center text-[9px] sm:text-xs font-bold uppercase leading-tight ${MONO} ${
                      flash ? "text-[var(--dd-yellow)]" : "text-white"
                    }`}
                  >
                    {hint}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* PANEL KONTROL */}
          <div className="mt-1.5 sm:mt-2 border-[2px] sm:border-[3px] border-black bg-[var(--dd-yellow)] px-1.5 pb-2.5 pt-1.5 sm:px-4 sm:pb-4 sm:pt-2 shadow-[inset_0_4px_0_0_rgba(255,255,255,0.55),inset_0_-4px_0_0_rgba(0,0,0,0.2)] sm:shadow-[inset_0_5px_0_0_rgba(255,255,255,0.55),inset_0_-6px_0_0_rgba(0,0,0,0.2)]">
            <div aria-hidden="true" className="mb-1.5 sm:mb-3 flex justify-between text-[8px] sm:text-[10px] leading-none text-black">
              {Array.from({ length: 12 }).map((_, i) => (
                <span key={i}>★</span>
              ))}
            </div>

            {/* Layout tombol: 1 baris ergonomis pada mobile (Koin | Joystick | Ulang & Mulai) */}
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-1.5 sm:gap-4 sm:items-end">
              {/* Koin (Langkah 1) */}
              <div className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={insertCoin}
                  aria-label="Masukkan koin"
                  className={`relative flex h-11 w-13 xs:w-16 sm:h-14 sm:w-20 touch-manipulation flex-col items-center justify-center gap-0.5 sm:gap-1 overflow-hidden border-[2px] sm:border-[3px] border-black bg-white shadow-[0_3px_0_0_#000] sm:shadow-[0_5px_0_0_#000] transition-transform active:translate-y-[3px] sm:active:translate-y-[5px] active:shadow-none ${focusRing} ${
                    !credit ? "dd-pulse" : ""
                  }`}
                >
                  {coinKey > 0 && (
                    <span
                      key={coinKey}
                      aria-hidden="true"
                      className="dd-coin absolute top-1 sm:top-2 h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-full border-2 border-black bg-[var(--dd-yellow)]"
                    />
                  )}
                  <span aria-hidden="true" className="mt-2.5 sm:mt-4 h-1 sm:h-1.5 w-6 sm:w-8 bg-black" />
                  <span className={`text-[9px] sm:text-[10px] font-black text-black ${MONO}`}>KOIN</span>
                </button>
                <span className={`text-[9px] sm:text-[11px] font-bold text-black ${MONO}`}>Langkah 1</span>
              </div>

              {/* Joystick & Kartrij (Langkah 2) */}
              <div className="flex flex-col items-center gap-1 min-w-0">
                <div className="flex w-full items-center justify-between gap-1 sm:gap-2 border-[2px] sm:border-[3px] border-black bg-[#4fd1d9] p-1 sm:p-2 shadow-[inset_0_0_0_2px_rgba(255,255,255,0.35)] sm:shadow-[inset_0_0_0_3px_rgba(255,255,255,0.35)]">
                  <button
                    type="button"
                    onClick={() => nudge(-1)}
                    aria-label="Kartrij sebelumnya"
                    className={`flex h-8 w-8 xs:h-9 xs:w-9 sm:h-12 sm:w-12 shrink-0 touch-manipulation items-center justify-center border-[2px] sm:border-[3px] border-black bg-white shadow-[0_2px_0_0_#000] sm:shadow-[0_4px_0_0_#000] transition-transform active:translate-y-[2px] sm:active:translate-y-[4px] active:shadow-none ${focusRing}`}
                  >
                    <ChevronLeft className="h-4 w-4 sm:h-6 sm:w-6 stroke-[3]" aria-hidden="true" />
                  </button>

                  <div
                    role="group"
                    tabIndex={0}
                    aria-label={`Joystick. Kartrij saat ini ${cartridge.label}. Tekan panah kiri atau kanan untuk mengganti.`}
                    onPointerDown={onStickDown}
                    onPointerMove={onStickMove}
                    onPointerUp={onStickUp}
                    onPointerCancel={onStickUp}
                    onKeyDown={onStickKey}
                    className={`relative h-[52px] sm:h-[96px] w-14 xs:w-16 sm:w-24 cursor-grab touch-none select-none active:cursor-grabbing ${focusRing}`}
                  >
                    <div className="absolute bottom-0.5 left-1/2 h-5 w-12 sm:h-8 sm:w-20 -translate-x-1/2 rounded-[50%] border-[2px] sm:border-[3px] border-black bg-[#2b6fd6] shadow-[0_2px_0_0_#000] sm:shadow-[0_4px_0_0_#000]" />
                    <div
                      className="absolute bottom-3 sm:bottom-5 left-1/2 h-0 w-0"
                      style={{
                        transform: `rotate(${tilt * 26}deg)`,
                        transformOrigin: "bottom center",
                        transition: dragging ? "none" : "transform 140ms ease-out",
                      }}
                    >
                      <div className="absolute bottom-0 left-0 h-6 sm:h-12 w-2 sm:w-3 -translate-x-1/2 border-[1.5px] sm:border-2 border-black bg-[#b6ff6b]" />
                      <div
                        className="absolute bottom-5 sm:bottom-10 left-0 h-6 w-6 sm:h-10 sm:w-10 -translate-x-1/2 rounded-full border-[2px] sm:border-[3px] border-black bg-[radial-gradient(circle_at_30%_30%,#ffb08a,#e8412c_55%,#8f1d10)]"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => nudge(1)}
                    aria-label="Kartrij berikutnya"
                    className={`flex h-8 w-8 xs:h-9 xs:w-9 sm:h-12 sm:w-12 shrink-0 touch-manipulation items-center justify-center border-[2px] sm:border-[3px] border-black bg-white shadow-[0_2px_0_0_#000] sm:shadow-[0_4px_0_0_#000] transition-transform active:translate-y-[2px] sm:active:translate-y-[4px] active:shadow-none ${focusRing}`}
                  >
                    <ChevronRight className="h-4 w-4 sm:h-6 sm:w-6 stroke-[3]" aria-hidden="true" />
                  </button>
                </div>
                <p className={`text-center text-[9px] sm:text-[11px] font-bold text-black truncate max-w-full ${MONO}`}>
                  <span className="sm:hidden">Langkah 2: Kartrij</span>
                  <span className="hidden sm:inline">Langkah 2: geser joystick</span>
                </p>
              </div>

              {/* Tombol aksi: Ulang & Mulai (Langkah 3) */}
              <div className="flex items-center sm:items-end gap-1.5 sm:gap-3">
                <div className="flex flex-col items-center gap-1">
                  <button
                    type="button"
                    onClick={pressReset}
                    aria-label="Ulang ke menu"
                    className={`flex h-9 w-9 sm:h-13 sm:w-13 touch-manipulation items-center justify-center rounded-full border-[2px] sm:border-[3px] border-black bg-[radial-gradient(circle_at_32%_28%,#ffb3b3,#ff4d4d_55%,#a31616)] shadow-[0_3px_0_0_#000] sm:shadow-[0_6px_0_0_#000] transition-transform active:translate-y-[3px] sm:active:translate-y-[6px] active:shadow-none ${focusRing}`}
                  >
                    <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5 stroke-[3] text-black" aria-hidden="true" />
                  </button>
                  <span className={`text-[9px] sm:text-[11px] font-bold text-black ${MONO}`}>Ulang</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <button
                    type="button"
                    onClick={pressStart}
                    aria-disabled={busy}
                    aria-label={stage === "done" ? "Main lagi" : "Mulai"}
                    className={`flex h-11 w-11 sm:h-15 sm:w-15 touch-manipulation items-center justify-center rounded-full border-[2px] sm:border-[3px] border-black bg-[radial-gradient(circle_at_32%_28%,#9bffcf,#2fcf86_55%,#0f7a4d)] shadow-[0_3px_0_0_#000] sm:shadow-[0_6px_0_0_#000] transition-transform active:translate-y-[3px] sm:active:translate-y-[6px] active:shadow-none ${focusRing} ${
                      busy ? "opacity-60" : ""
                    }`}
                  >
                    <Play className="h-4 w-4 sm:h-6 sm:w-6 fill-black stroke-[3] text-black" aria-hidden="true" />
                  </button>
                  <span className={`whitespace-nowrap text-[9px] sm:text-[11px] font-bold text-black ${MONO}`}>
                    {stage === "done" ? "Lagi" : busy ? "Proses" : "Mulai"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Kaki mesin */}
          <div className="-mx-1.5 sm:-mx-3 mt-1.5 sm:mt-2 border-t-[2px] sm:border-t-[3px] border-black bg-[#d9a900] px-2 py-1.5 sm:px-3 sm:py-3 text-center">
            <p className={`text-[9px] sm:text-xs font-bold text-black ${MONO}`}>
              Pilih kartrij, tekan MULAI, lihat hasilnya.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}