"use client";

import * as React from "react";
import { Sparkles, X, Check, HelpCircle, ArrowRight, RefreshCw } from "lucide-react";
import { ExperienceAssistResult } from "@/lib/ai/ai-assist-service";

interface ExperienceAiAssistModalProps {
  isOpen: boolean;
  onClose: () => void;
  cvId: string;
  role: string;
  organization: string;
  category: string;
  currentBullets: string[];
  onApplyBullets: (newBullets: string[]) => void;
}

export function ExperienceAiAssistModal({
  isOpen,
  onClose,
  cvId,
  role,
  organization,
  category,
  currentBullets,
  onApplyBullets,
}: ExperienceAiAssistModalProps) {
  const [inputText, setInputText] = React.useState(currentBullets.filter(Boolean).join("\n") || "");
  const [isLoading, setIsLoading] = React.useState(false);
  const [result, setResult] = React.useState<ExperienceAssistResult | null>(null);
  const [selectedVariantIdx, setSelectedVariantIdx] = React.useState<number>(0);
  const [editableBullets, setEditableBullets] = React.useState<string[]>([]);
  const [clarificationAnswers, setClarificationAnswers] = React.useState<string[]>(["", "", ""]);
  const [queueSeconds, setQueueSeconds] = React.useState<number | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Initialize or reset when opened
  React.useEffect(() => {
    if (isOpen) {
      const initial = currentBullets.filter(Boolean).join("\n");
      setInputText(initial);
      setResult(null);
      setEditableBullets([]);
      setErrorMessage(null);
      setQueueSeconds(null);
    }
  }, [isOpen, currentBullets]);

  // Live countdown for queue
  React.useEffect(() => {
    if (queueSeconds === null || queueSeconds <= 0) return;
    const interval = setInterval(() => {
      setQueueSeconds((prev) => (prev && prev > 1 ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(interval);
  }, [queueSeconds]);

  if (!isOpen) return null;

  const handleGenerate = async (customText?: string) => {
    const textToSend = customText ?? inputText;
    if (!textToSend.trim()) return;

    setErrorMessage(null);
    setQueueSeconds(null);
    setIsLoading(true);
    try {
      const res = await fetch(`/api/cv/${cvId}/ai-assist-experience`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawText: textToSend,
          role,
          organization,
          category,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        if (res.status === 429 && json.code === "AI_QUEUE_FULL") {
          setQueueSeconds(json.retryAfterSeconds || 30);
          setErrorMessage(`Antrean AI penuh, coba lagi sekitar ${json.retryAfterSeconds || 30} detik.`);
          return;
        }
        if (res.status === 503 || json.code === "AI_UNAVAILABLE") {
          setErrorMessage("AI tidak tersedia saat ini. Silakan coba lagi nanti.");
          return;
        }
        throw new Error(json.message || "Gagal memproses bantuan AI");
      }

      setResult(json);
      if (json.variants && json.variants.length > 0) {
        setSelectedVariantIdx(0);
        setEditableBullets([...json.variants[0].bullets]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (editableBullets.length > 0) {
      onApplyBullets(editableBullets.filter((b) => b.trim().length > 0));
      onClose();
    }
  };

  const handleSelectVariant = (idx: number) => {
    setSelectedVariantIdx(idx);
    if (result?.variants?.[idx]) {
      setEditableBullets([...result.variants[idx].bullets]);
    }
  };

  const handleClarificationSubmit = () => {
    const combined = clarificationAnswers.filter(Boolean).join(". ");
    const fullText = `${inputText}\n${combined}`.trim();
    setInputText(fullText);
    handleGenerate(fullText);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75">
      <div className="bg-[var(--surface)] border-[3px] border-black rounded-[3px] shadow-[8px_8px_0_0_#000] max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-3.5 border-b-[3px] border-black flex items-center justify-between bg-[var(--accent)] text-black">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-[3px] bg-black text-white flex items-center justify-center shadow-[2px_2px_0_0_#000]">
              <Sparkles className="h-4 w-4 text-[var(--accent)]" />
            </div>
            <div>
              <h3 className="text-base font-black font-[family-name:var(--font-heading)]">
                Bantu Pengalaman dengan AI (Formula Harvard)
              </h3>
              <p className="text-xs font-semibold text-neutral-800">
                {role || "Pengalaman"} {organization ? `• ${organization}` : ""}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 border-2 border-black bg-white hover:bg-rose-200 rounded-[3px] hard-drop-sm transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Status Banners */}
          {isLoading && (
            <div className="p-3 bg-amber-50 border-2 border-black rounded-[3px] font-bold text-xs flex items-center gap-2 text-black">
              <RefreshCw className="h-4 w-4 animate-spin text-black shrink-0" />
              <span>AI sedang memproses...</span>
            </div>
          )}

          {queueSeconds !== null && (
            <div className="p-3 bg-amber-200 border-2 border-black rounded-[3px] font-bold text-xs flex items-center justify-between text-black shadow-[2px_2px_0_0_#000]">
              <span>Antrean AI penuh, coba lagi sekitar {queueSeconds} detik</span>
              <span className="font-mono text-xs px-2 py-0.5 bg-black text-amber-300 rounded font-black">
                {queueSeconds}s
              </span>
            </div>
          )}

          {errorMessage && queueSeconds === null && !isLoading && (
            <div className="p-3 bg-rose-100 border-2 border-rose-800 text-rose-900 rounded-[3px] font-bold text-xs flex items-center justify-between">
              <span>{errorMessage}</span>
              <button
                type="button"
                onClick={() => handleGenerate()}
                className="underline font-black hover:text-black cursor-pointer ml-2"
              >
                Coba lagi
              </button>
            </div>
          )}

          {!result && (
            <div>
              <label className="block font-black text-xs uppercase tracking-wider mb-1.5 text-black">
                Ceritakan apa saja tugas atau pekerjaan yang kamu lakukan:
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Tulis apa adanya dengan santai, misal: 'Tiap hari saya handle data klien di excel, follow up invoice, sama koordinasi jadwal meeting.'"
                rows={4}
                className="w-full p-3 border-2 border-black rounded-[3px] bg-white font-mono text-xs focus:outline-none focus:shadow-[2px_2px_0_0_#000]"
              />
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  disabled={isLoading || !inputText.trim()}
                  onClick={() => handleGenerate()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 border-2 border-black rounded-[3px] bg-black text-white font-black hover:bg-neutral-800 disabled:opacity-50 cursor-pointer hard-drop-sm"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Menyusun formula aksi...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" />
                      <span>Rumuskan Poin Harvard</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Clarification Questions if input is too short */}
          {result?.needsClarification && (
            <div className="bg-amber-100 border-2 border-black p-4 rounded-[3px] shadow-[3px_3px_0_0_#000] space-y-3">
              <div className="flex items-start gap-2">
                <HelpCircle className="h-5 w-5 text-amber-800 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-black text-sm text-amber-950">
                    AI Butuh Sedikit Detail Tambahan (Anti-Halusinasi)
                  </h4>
                  <p className="text-xs text-amber-900 mt-0.5 font-semibold">
                    Agar tidak mengarang fakta palsu, jawab 1-3 pertanyaan singkat di bawah ini:
                  </p>
                </div>
              </div>

              <div className="space-y-2 mt-2">
                {(result.questions || []).map((q, qIdx) => (
                  <div key={qIdx} className="space-y-1">
                    <label className="font-bold text-neutral-800 text-xs">
                      {qIdx + 1}. {q}
                    </label>
                    <input
                      type="text"
                      value={clarificationAnswers[qIdx] || ""}
                      onChange={(e) => {
                        const next = [...clarificationAnswers];
                        next[qIdx] = e.target.value;
                        setClarificationAnswers(next);
                      }}
                      placeholder="Jawab singkat..."
                      className="w-full p-2 border-2 border-black rounded-[3px] bg-white text-xs font-mono"
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResult(null)}
                  className="px-3 py-1.5 border-2 border-black rounded-[3px] bg-white font-bold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleClarificationSubmit}
                  className="px-4 py-1.5 border-2 border-black rounded-[3px] bg-black text-white font-black"
                >
                  Lanjutkan Penyusunan
                </button>
              </div>
            </div>
          )}

          {/* Result Variants Mode */}
          {result?.variants && result.variants.length > 0 && (
            <div className="space-y-4">
              {/* Variant Tabs */}
              <div className="flex gap-2 border-b-2 border-black pb-2">
                {result.variants.map((v, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectVariant(idx)}
                    className={`px-3 py-1.5 border-2 border-black rounded-[3px] font-black text-xs cursor-pointer transition-all ${
                      selectedVariantIdx === idx
                        ? "bg-black text-white shadow-[2px_2px_0_0_#FFE500]"
                        : "bg-white text-black hover:bg-neutral-100"
                    }`}
                  >
                    {v.variantName}
                  </button>
                ))}
              </div>

              {/* Editable Bullets */}
              <div className="space-y-2">
                <p className="font-bold text-neutral-700 text-xs">
                  Review &amp; Edit Poin (15-25 kata per kalimat, diawali kata kerja aksi):
                </p>
                {editableBullets.map((bullet, bIdx) => (
                  <div key={bIdx} className="flex gap-2 items-start bg-white p-2.5 border-2 border-black rounded-[3px]">
                    <span className="font-black text-xs mt-1 text-neutral-500">{bIdx + 1}.</span>
                    <textarea
                      value={bullet}
                      onChange={(e) => {
                        const next = [...editableBullets];
                        next[bIdx] = e.target.value;
                        setEditableBullets(next);
                      }}
                      rows={2}
                      className="w-full text-xs font-mono focus:outline-none resize-y"
                    />
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-2 border-t-2 border-black">
                <button
                  type="button"
                  onClick={() => setResult(null)}
                  className="px-3 py-1.5 border-2 border-black rounded-[3px] bg-white font-bold hover:bg-neutral-100"
                >
                  Ulangi Input
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  className="inline-flex items-center gap-1.5 px-4 py-2 border-2 border-black rounded-[3px] bg-emerald-300 text-black font-black hover:bg-emerald-400 hard-drop-sm cursor-pointer"
                >
                  <Check className="h-4 w-4" />
                  <span>Terapkan ke Pengalaman Ini</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
