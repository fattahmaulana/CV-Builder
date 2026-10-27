"use client";

import * as React from "react";
import { Sparkles, X, Check, RefreshCw } from "lucide-react";
import { CvData } from "@/types/cv";

interface SummaryAiAssistModalProps {
  isOpen: boolean;
  onClose: () => void;
  cvId: string;
  cvData: CvData;
  onApplySummary: (newSummary: string) => void;
}

export function SummaryAiAssistModal({
  isOpen,
  onClose,
  cvId,
  cvData,
  onApplySummary,
}: SummaryAiAssistModalProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [variants, setVariants] = React.useState<string[]>([]);
  const [selectedIdx, setSelectedIdx] = React.useState<number>(0);
  const [editedSummary, setEditedSummary] = React.useState<string>("");
  const [queueSeconds, setQueueSeconds] = React.useState<number | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setVariants([]);
      setEditedSummary(cvData.personalInfo.summary || "");
      setErrorMessage(null);
      setQueueSeconds(null);
      handleGenerate();
    }
  }, [isOpen]);

  // Live countdown for queue
  React.useEffect(() => {
    if (queueSeconds === null || queueSeconds <= 0) return;
    const interval = setInterval(() => {
      setQueueSeconds((prev) => (prev && prev > 1 ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(interval);
  }, [queueSeconds]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setErrorMessage(null);
    setQueueSeconds(null);
    setIsLoading(true);
    try {
      const res = await fetch(`/api/cv/${cvId}/ai-assist-summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetPosition: cvData.metadata.targetPosition,
          targetCompany: cvData.metadata.targetCompany,
          educations: cvData.educations,
          skills: cvData.skills,
          experiences: cvData.experiences,
          language: cvData.metadata.language,
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
        throw new Error(json.message || "Gagal membuat ringkasan AI");
      }

      if (json.variants && json.variants.length > 0) {
        setVariants(json.variants);
        setSelectedIdx(0);
        setEditedSummary(json.variants[0]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectVariant = (idx: number) => {
    setSelectedIdx(idx);
    setEditedSummary(variants[idx] || "");
  };

  const handleApply = () => {
    if (editedSummary.trim()) {
      onApplySummary(editedSummary.trim());
      onClose();
    }
  };

  const wordCount = editedSummary.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75">
      <div className="bg-[var(--surface)] border-[3px] border-black rounded-[3px] shadow-[8px_8px_0_0_#000] max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-3.5 border-b-[3px] border-black flex items-center justify-between bg-[var(--accent)] text-black">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-[3px] bg-black text-white flex items-center justify-center shadow-[2px_2px_0_0_#000]">
              <Sparkles className="h-4 w-4 text-[var(--accent)]" />
            </div>
            <div>
              <h3 className="text-base font-black font-[family-name:var(--font-heading)]">
                Bantu Ringkasan Profesional dengan AI
              </h3>
              <p className="text-xs font-semibold text-neutral-800">
                2-3 Kalimat • 40-60 Kata • Tanpa &quot;Saya&quot; • Berbasis Bukti
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
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-black mb-3" />
              <p className="font-black text-sm">Menyusun 3 Varian Ringkasan Eksekutif...</p>
              <p className="text-xs text-neutral-600 mt-1">
                Mengintegrasikan pendidikan, keahlian utama, dan poin pencapaian Anda.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Variant Selectors */}
              <div>
                <p className="font-black text-xs uppercase tracking-wider mb-2 text-neutral-800">
                  Pilih Sudut Pandang Ringkasan:
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {variants.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectVariant(idx)}
                      className={`p-2 border-2 border-black rounded-[3px] font-black text-xs text-center cursor-pointer transition-all ${
                        selectedIdx === idx
                          ? "bg-black text-white shadow-[2px_2px_0_0_#FFE500]"
                          : "bg-white text-black hover:bg-neutral-100"
                      }`}
                    >
                      Varian {String.fromCharCode(65 + idx)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Editable Textarea */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-neutral-800 text-xs">
                    Teks Ringkasan (Bisa Di-edit Langsung):
                  </label>
                  <span
                    className={`font-mono text-xs font-bold ${
                      wordCount >= 35 && wordCount <= 65 ? "text-emerald-700" : "text-amber-700"
                    }`}
                  >
                    {wordCount} kata (Target: 40-60 kata)
                  </span>
                </div>
                <textarea
                  value={editedSummary}
                  onChange={(e) => setEditedSummary(e.target.value)}
                  rows={4}
                  className="w-full p-3 border-2 border-black rounded-[3px] bg-white font-serif text-sm leading-relaxed focus:outline-none focus:shadow-[2px_2px_0_0_#000]"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center pt-2 border-t-2 border-black">
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-black rounded-[3px] bg-white font-bold hover:bg-neutral-100 cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Buat Ulang Varian</span>
                </button>

                <button
                  type="button"
                  onClick={handleApply}
                  className="inline-flex items-center gap-1.5 px-4 py-2 border-2 border-black rounded-[3px] bg-emerald-300 text-black font-black hover:bg-emerald-400 hard-drop-sm cursor-pointer"
                >
                  <Check className="h-4 w-4" />
                  <span>Terapkan ke CV</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
