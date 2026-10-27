"use client";

import * as React from "react";
import { shouldEnableRichAnimations } from "@/lib/animations/device";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ChevronDown, ChevronRight, Download, FileEdit, Sparkles } from "lucide-react";

const STEP_MS = 4200;
const MONO = "font-[family-name:var(--font-mono)]";

/* ------------------------------------------------------------------ */
/* Visual mini untuk tiap langkah (CSS murni, ringan)                  */
/* ------------------------------------------------------------------ */

function Stage({ children }: { children: React.ReactNode }) {
  return (
    <div
      aria-hidden="true"
      className="relative h-[150px] overflow-hidden border-[3px] border-black bg-[var(--bg)] bg-[radial-gradient(rgba(0,0,0,0.15)_1px,transparent_1px)] [background-size:12px_12px]"
    >
      {children}
    </div>
  );
}

function VisualWrite() {
  return (
    <Stage>
      <div className="relative flex h-full items-center justify-center px-3">
        <div className="relative w-full max-w-[280px] border-[3px] border-black bg-white px-3 pb-3 pt-4 shadow-[4px_4px_0_0_#000]">
          <span
            className={`absolute -top-3 left-3 border-2 border-black bg-[var(--accent)] px-1.5 text-[10px] font-extrabold ${MONO}`}
          >
            DRAF
          </span>
          <div className="flex items-center">
            <p className={`dd2-type overflow-hidden whitespace-nowrap text-[12px] text-black ${MONO}`}>
              magang 6 bln, membuat WEB
            </p>
            <span className="dd2-caret ml-0.5 h-4 w-1.5 shrink-0 bg-black" />
          </div>
        </div>
        <div className="dd2-wiggle absolute right-3 top-3 flex h-8 w-8 items-center justify-center border-[3px] border-black bg-white shadow-[2px_2px_0_0_#000]">
          <FileEdit className="h-4 w-4" />
        </div>
      </div>
    </Stage>
  );
}

function VisualPolish() {
  return (
    <Stage>
      <div className="relative flex h-full items-center justify-center gap-2 px-3">
        <div className="dd2-messy w-[38%] space-y-1.5 border-[3px] border-black bg-white p-2.5">
          <span className="block h-2 w-full -rotate-2 bg-neutral-400" />
          <span className="block h-2 w-3/4 rotate-1 bg-neutral-400" />
          <span className="block h-2 w-5/6 -rotate-1 bg-neutral-400" />
        </div>
        <div className="dd2-spark flex h-10 w-10 shrink-0 items-center justify-center border-[3px] border-black bg-[var(--accent)] shadow-[2px_2px_0_0_#000]">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="w-[38%] space-y-1.5 border-[3px] border-black bg-white p-2.5">
          <span className="dd2-bar block h-2 w-full border border-black bg-[var(--accent)]" style={{ animationDelay: "0.6s" }} />
          <span className="dd2-bar block h-2 w-3/4 bg-black" style={{ animationDelay: "0.8s" }} />
          <span className="dd2-bar block h-2 w-5/6 bg-black" style={{ animationDelay: "1s" }} />
        </div>
        <span
          className={`dd2-pop absolute bottom-2 right-2 inline-flex items-center gap-1 border-2 border-black bg-[var(--accent-3)] px-1.5 py-0.5 text-[10px] font-extrabold text-white ${MONO}`}
        >
          <CheckCircle2 className="h-3 w-3" /> ATS
        </span>
      </div>
    </Stage>
  );
}

function FileTile({ label, color, delay }: { label: string; color: string; delay: number }) {
  return (
    <div
      className="dd2-file relative h-[76px] w-[58px] border-[3px] border-black bg-white shadow-[3px_3px_0_0_#000]"
      style={{ animationDelay: `${delay}s` }}
    >
      <span className="absolute right-0 top-0 h-3 w-3 border-b-[3px] border-l-[3px] border-black bg-neutral-200" />
      <span className="absolute left-2 top-5 h-1 w-6 bg-black/70" />
      <span className="absolute left-2 top-8 h-1 w-8 bg-black/70" />
      <span
        className={`absolute inset-x-0 bottom-0 border-t-[3px] border-black py-0.5 text-center text-[10px] font-extrabold text-white ${MONO}`}
        style={{ backgroundColor: color }}
      >
        {label}
      </span>
    </div>
  );
}

function VisualDownload() {
  return (
    <Stage>
      <div className="relative flex h-full items-end justify-center gap-4 pb-5">
        <FileTile label="PDF" color="#ff4d4d" delay={0} />
        <FileTile label="DOCX" color="#4d7cff" delay={0.15} />
        <div className="dd2-arrow absolute inset-x-0 top-3 mx-auto flex h-9 w-9 items-center justify-center border-[3px] border-black bg-[var(--accent)] shadow-[2px_2px_0_0_#000]">
          <Download className="h-5 w-5" />
        </div>
        <span className="absolute inset-x-0 bottom-0 h-3 border-t-[3px] border-black bg-black" />
        <span
          className={`dd2-pop absolute right-2 top-2 inline-flex items-center gap-1 border-2 border-black bg-[var(--accent-3)] px-1.5 py-0.5 text-[10px] font-extrabold text-white ${MONO}`}
        >
          <CheckCircle2 className="h-3 w-3" /> ATS
        </span>
      </div>
    </Stage>
  );
}

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */

interface Step {
  num: string;
  title: string;
  desc: string;
  badge: string;
  Visual: () => React.JSX.Element;
}

const STEPS: Step[] = [
  {
    num: "01",
    title: "Tulis Apa Adanya",
    desc: "Ketik pengalaman Anda dengan bahasa santai.",
    badge: "INPUT SANTAI",
    Visual: VisualWrite,
  },
  {
    num: "02",
    title: "AI Merapikan",
    desc: "Jadi kalimat Harvard. Fakta tetap asli.",
    badge: "ATS MATCH",
    Visual: VisualPolish,
  },
  {
    num: "03",
    title: "Unduh & Kirim",
    desc: "PDF dan DOCX siap dikirim ke recruiter.",
    badge: "TERBACA ATS",
    Visual: VisualDownload,
  },
];

/* ------------------------------------------------------------------ */
/* Penghubung antar kotak (horizontal di desktop, vertikal di mobile)  */
/* ------------------------------------------------------------------ */

function Connector({ lit, arrived, rich }: { lit: boolean; arrived: boolean; rich: boolean }) {
  return (
    <div aria-hidden="true" className="relative flex h-10 items-center justify-center lg:h-auto lg:w-16">
      <div
        className={`dd2-line-v h-full w-[6px] lg:hidden ${lit ? "dd2-lit" : ""} ${lit && rich ? "dd2-flow-on" : ""}`}
      />
      <div
        className={`dd2-line-h hidden h-[6px] w-full lg:block ${lit ? "dd2-lit" : ""} ${lit && rich ? "dd2-flow-on" : ""}`}
      />
      <span
        className={`absolute z-10 flex h-7 w-7 items-center justify-center border-[3px] border-black transition-colors ${
          lit ? "bg-[var(--accent)]" : "bg-white"
        }`}
      >
        <ChevronDown className="h-4 w-4 stroke-[3] lg:hidden" />
        <ChevronRight className="hidden h-4 w-4 stroke-[3] lg:block" />
      </span>
      {arrived && rich && <span key={String(arrived)} className="dd2-pkt" />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Komponen utama                                                      */
/* ------------------------------------------------------------------ */

export function HowItWorksSticky() {
  const sectionRef = React.useRef<HTMLElement>(null);
  const [active, setActive] = React.useState(0);
  const [rich, setRich] = React.useState(false);
  const [revealed, setRevealed] = React.useState(false);
  const [inView, setInView] = React.useState(false);
  const [hovering, setHovering] = React.useState(false);
  const [focused, setFocused] = React.useState(false);

  React.useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const enabled = shouldEnableRichAnimations() && !reduced;
    setRich(enabled);
    if (!enabled) setRevealed(true);

    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setRevealed(true);
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting) setRevealed(true);
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const paused = hovering || focused || !inView;
  const next = () => setActive((a) => (a + 1) % STEPS.length);

  return (
    <section
      id="cara-kerja"
      ref={sectionRef}
      className="border-b-[3px] border-black bg-[var(--bg)] px-4 py-16 sm:px-6 sm:py-24"
    >
      <style>{`
        @keyframes dd2-type { from { width: 0 } to { width: 28ch } }
        @keyframes dd2-blink { 50% { opacity: 0 } }
        @keyframes dd2-wiggle { 0%,100% { transform: rotate(0) } 25% { transform: rotate(-14deg) } 75% { transform: rotate(14deg) } }
        @keyframes dd2-shake { 0%,100% { transform: translateX(0) } 25% { transform: translateX(-3px) rotate(-1deg) } 75% { transform: translateX(3px) rotate(1deg) } }
        @keyframes dd2-spin { 0% { transform: rotate(0) scale(1) } 50% { transform: rotate(180deg) scale(1.3) } 100% { transform: rotate(360deg) scale(1) } }
        @keyframes dd2-grow { from { transform: scaleX(0) } to { transform: scaleX(1) } }
        @keyframes dd2-pop { 0% { transform: scale(0) } 70% { transform: scale(1.25) } 100% { transform: scale(1) } }
        @keyframes dd2-drop { 0% { transform: translateY(-90px); opacity: 0 } 60% { transform: translateY(6px); opacity: 1 } 100% { transform: translateY(0) } }
        @keyframes dd2-bounce { from { transform: translateY(0) } to { transform: translateY(5px) } }
        @keyframes dd2-progress { from { width: 0 } to { width: 100% } }
        @keyframes dd2-flow-h { to { background-position: 18px 0 } }
        @keyframes dd2-flow-v { to { background-position: 0 18px } }
        @keyframes dd2-pkt-h { from { left: 0 } to { left: calc(100% - 14px) } }
        @keyframes dd2-pkt-v { from { top: 0 } to { top: calc(100% - 14px) } }

        .dd2-type { width: 28ch; }
        .dd2-prog { animation-name: dd2-progress; animation-timing-function: linear; animation-fill-mode: both; }

        .dd2-line-h { background-image: repeating-linear-gradient(90deg, #000 0 10px, transparent 10px 18px); background-size: 18px 100%; opacity: .3; }
        .dd2-line-v { background-image: repeating-linear-gradient(180deg, #000 0 10px, transparent 10px 18px); background-size: 100% 18px; opacity: .3; }
        .dd2-lit { opacity: 1; }
        .dd2-flow-on.dd2-line-h { animation: dd2-flow-h .7s linear infinite; }
        .dd2-flow-on.dd2-line-v { animation: dd2-flow-v .7s linear infinite; }
        .dd2-pkt { position: absolute; z-index: 5; width: 14px; height: 14px; border: 3px solid #000; background: var(--accent); left: 50%; margin-left: -7px; top: 0; animation: dd2-pkt-v .7s ease-in-out both; }
        @media (min-width: 1024px) {
          .dd2-pkt { left: 0; top: 50%; margin-left: 0; margin-top: -7px; animation-name: dd2-pkt-h; }
        }

        .dd2-card[data-active="true"][data-rich="true"] .dd2-type { animation: dd2-type 1.8s steps(28) both; }
        .dd2-card[data-active="true"][data-rich="true"] .dd2-caret { animation: dd2-blink .8s steps(1) infinite; }
        .dd2-card[data-active="true"][data-rich="true"] .dd2-wiggle { animation: dd2-wiggle .6s ease-in-out 2; }
        .dd2-card[data-active="true"][data-rich="true"] .dd2-messy { animation: dd2-shake .3s linear 3; }
        .dd2-card[data-active="true"][data-rich="true"] .dd2-spark { animation: dd2-spin .8s ease-in-out .3s both; }
        .dd2-card[data-active="true"][data-rich="true"] .dd2-bar { transform-origin: left; animation: dd2-grow .35s ease-out both; }
        .dd2-card[data-active="true"][data-rich="true"] .dd2-pop { animation: dd2-pop .4s ease-out 1.3s both; }
        .dd2-card[data-active="true"][data-rich="true"] .dd2-file { animation: dd2-drop .6s cubic-bezier(.3,1.4,.5,1) both; }
        .dd2-card[data-active="true"][data-rich="true"] .dd2-arrow { animation: dd2-bounce .5s ease-in-out infinite alternate; }

        @media (prefers-reduced-motion: reduce) {
          .dd2-card *, .dd2-line-h, .dd2-line-v, .dd2-pkt { animation: none !important; }
        }
      `}</style>

      <div className="mx-auto max-w-7xl">
        {/* Judul */}
        <div className="mx-auto mb-12 max-w-3xl text-center sm:mb-16">
          <Badge variant="accent" isSticker className="mb-3">
            ALUR KERJA CVBUILDER
          </Badge>
          <h2 className="text-3xl font-extrabold tracking-tight text-black font-[family-name:var(--font-display)] sm:text-5xl">
            3 Langkah Menuju CV Harvard
          </h2>
          <p className="mt-4 text-base text-neutral-800 font-[family-name:var(--font-body)]">
            Dari tulisan santai ke CV siap kirim dalam hitungan menit.
          </p>
        </div>

        {/* Kotak langkah */}
        <div
          role="list"
          className="mx-auto grid max-w-md grid-cols-1 items-stretch lg:max-w-none lg:grid-cols-[1fr_auto_1fr_auto_1fr]"
          onPointerEnter={(e) => e.pointerType === "mouse" && setHovering(true)}
          onPointerLeave={() => setHovering(false)}
          onFocusCapture={() => setFocused(true)}
          onBlurCapture={() => setFocused(false)}
        >
          {STEPS.map((step, idx) => {
            const isActive = active === idx;
            const { Visual } = step;
            return (
              <React.Fragment key={step.num}>
                <div
                  role="listitem"
                  className={`transition-all duration-500 ${
                    revealed ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
                  }`}
                  style={{ transitionDelay: revealed ? `${idx * 140}ms` : "0ms" }}
                >
                  <div
                    onClick={() => setActive(idx)}
                    data-active={isActive}
                    data-rich={rich}
                    className={`dd2-card relative flex h-full cursor-pointer select-none flex-col gap-4 rounded-[3px] border-[3px] border-black p-4 transition-all duration-200 sm:p-5 ${
                      isActive
                        ? "-translate-y-1 bg-[var(--surface)] shadow-[8px_8px_0_0_#000] lg:-translate-y-2"
                        : "bg-[var(--bg)] shadow-[3px_3px_0_0_#000] hover:shadow-[5px_5px_0_0_#000]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`border-[3px] border-black bg-[var(--accent)] px-2 py-0.5 text-sm font-extrabold ${MONO}`}
                      >
                        {step.num}
                      </span>
                      <Badge variant={isActive ? "accent2" : "surface"} isSticker={isActive}>
                        {step.badge}
                      </Badge>
                    </div>

                    <Visual />

                    <div>
                      <h3 className="text-xl font-extrabold text-black font-[family-name:var(--font-display)] sm:text-2xl">
                        <button
                          type="button"
                          onClick={() => setActive(idx)}
                          aria-current={isActive ? "step" : undefined}
                          className="text-left focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-black"
                        >
                          {step.title}
                        </button>
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-neutral-800 font-[family-name:var(--font-body)]">
                        {step.desc}
                      </p>
                    </div>

                    {rich && (
                      <div aria-hidden="true" className="mt-auto h-3 border-[3px] border-black bg-white">
                        <div
                          key={`${idx}-${active}`}
                          className={`h-full bg-black ${isActive ? "dd2-prog" : ""}`}
                          style={{
                            width: idx < active ? "100%" : isActive ? undefined : "0%",
                            animationDuration: `${STEP_MS}ms`,
                            animationPlayState: paused ? "paused" : "running",
                          }}
                          onAnimationEnd={isActive ? next : undefined}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {idx < STEPS.length - 1 && (
                  <Connector lit={active > idx} arrived={active === idx + 1} rich={rich} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        <p className={`mt-8 text-center text-[11px] font-bold uppercase text-neutral-600 ${MONO}`}>
          Klik kotak untuk melihat tiap langkah
        </p>
      </div>
    </section>
  );
}