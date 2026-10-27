"use client";

import * as React from "react";
import { CvData } from "@/types/cv";
import { AiOptimizationResult } from "@/lib/ai/pii-sanitizer";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  X,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Briefcase,
  FileText,
  Lightbulb,
} from "lucide-react";

interface AiDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalCv: CvData;
  optimized: AiOptimizationResult | null;
  isLoading: boolean;
  onApplyAll: (optimized: AiOptimizationResult) => void;
  onApplyBullet: (expId: string, bulletIndex: number, newBullet: string) => void;
  onApplySummary: (newSummary: string) => void;
  onApplySkills: (skills: AiOptimizationResult["skills"]) => void;
}

export function AiDiffModal({
  isOpen,
  onClose,
  originalCv,
  optimized,
  isLoading,
  onApplyAll,
  onApplyBullet,
  onApplySummary,
  onApplySkills,
}: AiDiffModalProps) {
  const [activeTab, setActiveTab] = React.useState<"summary" | "experience" | "analysis">("experience");
  const [appliedBullets, setAppliedBullets] = React.useState<Record<string, boolean>>({});
  const [appliedSummary, setAppliedSummary] = React.useState(false);
  const [appliedSkills, setAppliedSkills] = React.useState(false);

  // Reset applied state when a new optimization arrives
  React.useEffect(() => {
    if (optimized) {
      setAppliedBullets({});
      setAppliedSummary(false);
      setAppliedSkills(false);
    }
  }, [optimized]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-[var(--surface)] border-[3px] border-black rounded-[3px] shadow-[8px_8px_0_0_#000] max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header - Neobrutalist Solid Header */}
        <div className="px-6 py-4 border-b-[3px] border-black flex items-center justify-between bg-[var(--accent)] text-black">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-[3px] bg-black text-white flex items-center justify-center shadow-[2px_2px_0_0_#000]">
              <Sparkles className="h-5 w-5 text-[var(--accent)]" />
            </div>
            <div>
              <h2 className="text-lg font-black font-[family-name:var(--font-heading)] text-black">
                Hasil Perapian AI &amp; Penyelarasan Lowongan
              </h2>
              <p className="text-xs font-semibold text-neutral-800">
                Formula Aksi Harvard: Kata Kerja Kuat + Tugas Spesifik + Alat / Konteks + Metrik Terukur
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {optimized && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-[3px] bg-white border-2 border-black text-black text-xs font-mono font-bold shadow-[2px_2px_0_0_#000]">
                <TrendingUp className="h-3.5 w-3.5 text-black" />
                <span>Skor Kecocokan: {optimized.matchScore}%</span>
              </div>
            )}
            <button
              onClick={onClose}
              className="border-2 border-black bg-white hover:bg-rose-200 text-black p-1.5 rounded-[3px] hard-drop-sm transition-colors cursor-pointer"
              title="Tutup Modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="py-20 px-6 flex flex-col items-center justify-center text-center bg-amber-50/30">
            <div className="h-12 w-12 rounded-[3px] border-[3px] border-black border-t-transparent animate-spin mb-4 bg-[var(--accent)]" />
            <h3 className="text-base font-black font-[family-name:var(--font-heading)] text-black">
              Menganalisis Draf &amp; Menyelaraskan dengan Lowongan...
            </h3>
            <p className="text-xs font-semibold text-neutral-700 max-w-sm mt-1.5">
              Menghapus data pribadi (UU PDP), menata formula aksi berbobot, dan mencocokkan kata kunci ATS.
            </p>
          </div>
        )}

        {/* Content Body when Ready */}
        {!isLoading && optimized && (
          <>
            {/* Navigation Tabs */}
            <div className="flex border-b-2 border-black bg-amber-50 px-6 pt-3 gap-2">
              <button
                onClick={() => setActiveTab("experience")}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-2 transition-all cursor-pointer rounded-t-[3px] ${
                  activeTab === "experience"
                    ? "bg-white text-black border-black border-b-0 shadow-[2px_-2px_0_0_#000]"
                    : "border-transparent text-neutral-700 hover:text-black"
                }`}
              >
                <Briefcase className="h-3.5 w-3.5" />
                <span>Poin Pengalaman ({optimized.experiences.reduce((acc, e) => acc + e.bullets.length, 0)})</span>
              </button>

              <button
                onClick={() => setActiveTab("summary")}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-2 transition-all cursor-pointer rounded-t-[3px] ${
                  activeTab === "summary"
                    ? "bg-white text-black border-black border-b-0 shadow-[2px_-2px_0_0_#000]"
                    : "border-transparent text-neutral-700 hover:text-black"
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Ringkasan Diri</span>
              </button>

              <button
                onClick={() => setActiveTab("analysis")}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-2 transition-all cursor-pointer rounded-t-[3px] ${
                  activeTab === "analysis"
                    ? "bg-white text-black border-black border-b-0 shadow-[2px_-2px_0_0_#000]"
                    : "border-transparent text-neutral-700 hover:text-black"
                }`}
              >
                <Lightbulb className="h-3.5 w-3.5" />
                <span>Analisis Kata Kunci &amp; Tips</span>
              </button>
            </div>

            {/* Scrollable Tab Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
              {/* TAB 1: PENGALAMAN KERJA / FORMULA AKSI */}
              {activeTab === "experience" && (
                <div className="space-y-6">
                  {optimized.experiences.map((exp) => {
                    const origExp = originalCv.experiences.find((e) => e.id === exp.id);
                    return (
                      <div
                        key={exp.id}
                        className="p-5 rounded-[3px] border-2 border-black bg-amber-50/30 shadow-[4px_4px_0_0_#000]"
                      >
                        <h4 className="font-black text-sm text-black mb-3 flex items-center justify-between font-[family-name:var(--font-heading)]">
                          <span>{exp.role || "Pengalaman"} — {exp.organization}</span>
                        </h4>

                        <div className="space-y-4">
                          {exp.bullets.map((newBullet, bIdx) => {
                            const origBullet = origExp?.bullets[bIdx] || "";
                            const bulletKey = `${exp.id}-${bIdx}`;
                            const isApplied = appliedBullets[bulletKey];

                            return (
                              <div
                                key={bIdx}
                                className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 rounded-[3px] bg-white border-2 border-black text-xs shadow-[2px_2px_0_0_#000]"
                              >
                                {/* Left: Original Bullet */}
                                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-[2px]">
                                  <span className="font-bold text-rose-900 uppercase tracking-wider text-[10px] block mb-1">
                                    Draf Asli Anda:
                                  </span>
                                  <p className="text-neutral-700 line-through italic leading-relaxed">
                                    {origBullet || "(Belum ada deskripsi)"}
                                  </p>
                                </div>

                                {/* Right: AI Optimized Action Bullet */}
                                <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-[2px] flex flex-col justify-between">
                                  <div>
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-bold text-emerald-950 uppercase tracking-wider text-[10px]">
                                        Saran Formula Aksi AI:
                                      </span>
                                      <button
                                        onClick={() => {
                                          onApplyBullet(exp.id, bIdx, newBullet);
                                          setAppliedBullets((prev) => ({ ...prev, [bulletKey]: true }));
                                        }}
                                        className={`px-2 py-0.5 rounded-[2px] text-[10px] font-bold border border-black hard-drop-sm transition-transform cursor-pointer ${
                                          isApplied
                                            ? "bg-emerald-300 text-black font-mono"
                                            : "bg-[var(--accent)] text-black hover:bg-yellow-300"
                                        }`}
                                      >
                                        {isApplied ? "✓ Diterapkan" : "Gunakan Poin Ini"}
                                      </button>
                                    </div>
                                    <p className="text-black font-semibold leading-relaxed">
                                      {newBullet}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TAB 2: RINGKASAN DIRI */}
              {activeTab === "summary" && (
                <div className="space-y-4">
                  <div className="p-5 rounded-[3px] border-2 border-black bg-rose-50 shadow-[3px_3px_0_0_#000]">
                    <span className="font-bold text-rose-900 uppercase tracking-wider text-[10px] block mb-2 font-mono">
                      Ringkasan Saat Ini:
                    </span>
                    <p className="text-xs text-neutral-700 italic leading-relaxed">
                      {originalCv.personalInfo.summary || "(Ringkasan belum diisi oleh Anda)"}
                    </p>
                  </div>

                  <div className="p-5 rounded-[3px] border-2 border-black bg-emerald-50 shadow-[4px_4px_0_0_#000]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-black text-emerald-950 uppercase tracking-wider text-[11px] flex items-center gap-1.5 font-[family-name:var(--font-heading)]">
                        <Sparkles className="h-3.5 w-3.5 text-black" />
                        Saran Ringkasan Profesional Berorientasi Hasil:
                      </span>
                      <button
                        onClick={() => {
                          onApplySummary(optimized.summary);
                          setAppliedSummary(true);
                        }}
                        className={`px-3 py-1 text-xs font-bold border-2 border-black rounded-[3px] hard-drop-sm transition-transform cursor-pointer ${
                          appliedSummary
                            ? "bg-emerald-300 text-black"
                            : "bg-[var(--accent)] text-black hover:bg-yellow-300"
                        }`}
                      >
                        {appliedSummary ? "✓ Telah Diterapkan" : "Terapkan Ringkasan"}
                      </button>
                    </div>
                    <p className="text-xs text-black font-semibold leading-relaxed">
                      {optimized.summary}
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 3: ANALISIS KATA KUNCI & TIPS */}
              {activeTab === "analysis" && (
                <div className="space-y-6">
                  {/* Matched vs Missing Keywords */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-[3px] border-2 border-black bg-emerald-100 text-xs shadow-[3px_3px_0_0_#000]">
                      <span className="font-bold text-black flex items-center gap-1.5 mb-2.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-800" />
                        Kata Kunci Lowongan yang Cocok:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {optimized.matchAnalysis.matchedKeywords.map((kw, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-[2px] bg-white text-black font-bold border border-black shadow-[1px_1px_0_0_#000]"
                          >
                            ✓ {kw}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 rounded-[3px] border-2 border-black bg-amber-100 text-xs shadow-[3px_3px_0_0_#000]">
                      <span className="font-bold text-black flex items-center gap-1.5 mb-2.5">
                        <AlertTriangle className="h-4 w-4 text-amber-800" />
                        Kata Kunci yang Disarankan Ditambahkan:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {optimized.matchAnalysis.missingKeywords.map((kw, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-[2px] bg-white text-black font-bold border border-black shadow-[1px_1px_0_0_#000]"
                          >
                            + {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="p-5 rounded-[3px] border-2 border-black bg-[var(--surface)] shadow-[3px_3px_0_0_#000]">
                    <h4 className="text-xs font-black text-black uppercase tracking-wider mb-3 flex items-center gap-1.5 font-[family-name:var(--font-heading)]">
                      <Lightbulb className="h-4 w-4 text-black" />
                      Rekomendasi Strategis Fresh Graduate:
                    </h4>
                    <ul className="space-y-2 text-xs text-neutral-800 list-disc list-inside">
                      {optimized.matchAnalysis.recommendations.map((rec, i) => (
                        <li key={i} className="leading-relaxed font-semibold">
                          <span className="text-black">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Skills Apply Action */}
                  <div className="p-4 rounded-[3px] border-2 border-black bg-amber-50 flex items-center justify-between shadow-[3px_3px_0_0_#000]">
                    <div>
                      <p className="text-xs font-bold text-black">
                        Perbarui Daftar Keahlian &amp; Perangkat Lunak
                      </p>
                      <p className="text-[11px] text-neutral-700">
                        Tambahkan kata kunci teknis yang relevan ke tab Keahlian CV Anda.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        onApplySkills(optimized.skills);
                        setAppliedSkills(true);
                      }}
                      className={`px-3 py-1.5 text-xs font-bold border-2 border-black rounded-[3px] hard-drop-sm transition-transform cursor-pointer ${
                        appliedSkills
                          ? "bg-emerald-300 text-black font-mono"
                          : "bg-[var(--accent)] text-black hover:bg-yellow-300"
                      }`}
                    >
                      {appliedSkills ? "✓ Keahlian Diperbarui" : "Terapkan Keahlian"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions Bar */}
            <div className="px-6 py-4 border-t-[3px] border-black bg-neutral-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-700">
                Perubahan yang diterapkan akan disimpan otomatis ke draf cloud Anda.
              </span>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  className="border-2 border-black rounded-[3px] font-bold hard-drop-sm"
                >
                  Tutup
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    onApplyAll(optimized);
                    onClose();
                  }}
                  className="gap-1.5 border-2 border-black font-bold hard-drop-sm"
                >
                  <Sparkles className="h-3.5 w-3.5 text-black" />
                  <span>Terapkan Semua Saran AI</span>
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
