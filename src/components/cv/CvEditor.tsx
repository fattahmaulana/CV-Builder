"use client";

import * as React from "react";
import Link from "next/link";
import { CvData, ExperienceItem } from "@/types/cv";
import { HarvardCvPreview } from "./HarvardCvPreview";
import { AiDiffModal } from "./AiDiffModal";
import { ExperienceAiAssistModal } from "./ExperienceAiAssistModal";
import { SummaryAiAssistModal } from "./SummaryAiAssistModal";
import { AiOptimizationResult, rehydrateCvWithAi } from "@/lib/ai/pii-sanitizer";
import { Button } from "@/components/ui/button";
import {
  IconArrowRight,
} from "@/components/ui/icons";
import {
  User,
  GraduationCap,
  Briefcase,
  Wrench,
  Award,
  Target,
  Plus,
  Trash2,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Globe,
  Sparkles,
  AlertTriangle,
  X,
} from "lucide-react";

import { useCvAutosave } from "@/lib/cv/useCvAutosave";

interface CvEditorProps {
  cvId: string;
  initialData: CvData;
  initialTitle: string;
  isPaid: boolean;
  initialVersion?: number;
  initialStep?: number;
}

const STEPS = [
  { id: "personal", stepNumber: "01", label: "Data Diri", icon: User },
  { id: "education", stepNumber: "02", label: "Pendidikan", icon: GraduationCap },
  { id: "experience", stepNumber: "03", label: "Pengalaman", icon: Briefcase },
  { id: "skills", stepNumber: "04", label: "Keahlian", icon: Wrench },
  { id: "certifications", stepNumber: "05", label: "Sertifikasi", icon: Award },
  { id: "target", stepNumber: "06", label: "Target Lowongan", icon: Target },
];

interface SkillTagInputProps {
  label: string;
  value: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  helperText?: string;
}

export function SkillTagInput({
  label,
  value = [],
  onChange,
  placeholder,
  helperText,
}: SkillTagInputProps) {
  const [rawText, setRawText] = React.useState(() => (value || []).join(", "));
  const isFocusedRef = React.useRef(false);

  // Sync external changes when input is not actively focused (e.g. AI suggestion or undo)
  React.useEffect(() => {
    if (!isFocusedRef.current) {
      setRawText((value || []).join(", "));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setRawText(val);

    // Parse skills by comma without breaking the user's active cursor/spaces
    const parsed = val
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    onChange(parsed);
  };

  const handleBlur = () => {
    isFocusedRef.current = false;
    // On blur, format cleanly so any trailing comma or extra spaces are neat
    const cleaned = rawText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    setRawText(cleaned.join(", "));
    onChange(cleaned);
  };

  const handleFocus = () => {
    isFocusedRef.current = true;
  };

  const removeTag = (indexToRemove: number) => {
    const next = (value || []).filter((_, idx) => idx !== indexToRemove);
    setRawText(next.join(", "));
    onChange(next);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const trimmed = rawText.trim();
      if (trimmed && !trimmed.endsWith(",")) {
        const withComma = trimmed + ", ";
        setRawText(withComma);
        const parsed = withComma
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        onChange(parsed);
      }
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-black">
          {label}
        </label>
        {value && value.length > 0 && (
          <span className="text-[10px] font-mono font-bold text-neutral-600 bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-300">
            {value.length} item
          </span>
        )}
      </div>

      <input
        type="text"
        value={rawText}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-full px-3 py-2 text-xs border-2 border-black rounded-[3px] bg-white text-black focus:outline-none focus:shadow-[2.5px_2.5px_0_0_#FFE500]"
        placeholder={placeholder}
      />

      {helperText && (
        <p className="text-[11px] text-neutral-600">{helperText}</p>
      )}

      {/* Interactive Neobrutalist Badges */}
      {value && value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {value.map((item, idx) => (
            <span
              key={`${item}-${idx}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold bg-amber-100 text-black border border-black rounded-[3px] shadow-[1.5px_1.5px_0_0_#000]"
            >
              <span>{item}</span>
              <button
                type="button"
                onClick={() => removeTag(idx)}
                className="hover:text-rose-600 hover:bg-black/10 rounded p-0.5 cursor-pointer transition-colors"
                title={`Hapus ${item}`}
                aria-label={`Hapus ${item}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function CvEditor({
  cvId,
  initialData,
  initialTitle,
  isPaid,
  initialVersion = 1,
  initialStep = 0,
}: CvEditorProps) {
  const [data, setData] = React.useState<CvData>(initialData);
  const [title, setTitle] = React.useState(initialTitle);
  const [activeStep, setActiveStep] = React.useState(initialStep);
  const [mobileTab, setMobileTab] = React.useState<"form" | "preview">("form");

  // AI Optimization modal and loading state
  const [isAiModalOpen, setIsAiModalOpen] = React.useState(false);
  const [isAiLoading, setIsAiLoading] = React.useState(false);
  const [aiResult, setAiResult] = React.useState<AiOptimizationResult | null>(null);

  // Experience and Summary AI Assist States
  const [isSummaryAiOpen, setIsSummaryAiOpen] = React.useState(false);
  const [isExpAiOpen, setIsExpAiOpen] = React.useState(false);
  const [editingExpForAi, setEditingExpForAi] = React.useState<ExperienceItem | null>(null);

  // Photo Upload States & Handlers (Template B)
  const [isUploadingPhoto, setIsUploadingPhoto] = React.useState(false);

  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Ukuran berkas melebihi batas maksimal 2MB.");
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const resizedBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const maxDim = 600;
            let width = img.width;
            let height = img.height;
            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              resolve(event.target?.result as string);
              return;
            }
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL("image/jpeg", 0.85));
          };
          img.onerror = reject;
          img.src = event.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const formData = new FormData();
      formData.append("base64", resizedBase64);

      const res = await fetch(`/api/cv/${cvId}/photo`, {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal mengunggah foto");

      updateData((prev) => ({
        ...prev,
        personalInfo: {
          ...prev.personalInfo,
          photoUrl: json.photoUrl || resizedBase64,
        },
        metadata: {
          ...prev.metadata,
          template: "with-photo",
        },
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengunggah foto";
      alert(msg);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!confirm("Hapus pasfoto dari CV ini?")) return;
    try {
      await fetch(`/api/cv/${cvId}/photo`, { method: "DELETE" });
      updateData((prev) => ({
        ...prev,
        personalInfo: {
          ...prev.personalInfo,
          photoUrl: "",
        },
      }));
    } catch (err) {
      console.error("Error deleting photo:", err);
    }
  };

  // Autosave engine with queuing, AbortController, optimistic concurrency, and retry
  const {
    status: saveStatus,
    errorMessage: saveErrorMessage,
    triggerAutosave,
    retrySave,
    reloadLatestData,
  } = useCvAutosave({
    cvId,
    initialVersion,
    data,
    title,
    onDataReload: (latest) => {
      setData(latest.data);
      setTitle(latest.title);
    },
  });

  const updateData = (updater: (prev: CvData) => CvData) => {
    setData((prev) => {
      const next = updater(prev);
      triggerAutosave(next, title);
      return next;
    });
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    triggerAutosave(data, newTitle);
  };


  // AI Optimization Handlers
  const handleTriggerAiOptimize = async () => {
    setIsAiLoading(true);
    setIsAiModalOpen(true);

    try {
      const res = await fetch(`/api/cv/${cvId}/optimize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data,
          targetPosition: data.metadata.targetPosition,
          targetCompany: data.metadata.targetCompany,
          jobDescription: data.metadata.jobDescription,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        let errorMsg = json.error || "Gagal memproses perapian AI";
        if (typeof errorMsg === "string") {
          try {
            const parsed = JSON.parse(errorMsg);
            if (Array.isArray(parsed) && parsed[0]?.message) {
              errorMsg = parsed.map((p: { message: string }) => p.message).join("\n");
            }
          } catch {}
        }
        throw new Error(errorMsg);
      }

      setAiResult(json.optimized);
    } catch (err: unknown) {
      console.error("AI Optimize error:", err);
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat memproses AI";
      alert(msg);
      setIsAiModalOpen(false);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleApplyAllAi = (optimized: AiOptimizationResult) => {
    updateData((prev) => rehydrateCvWithAi(prev, optimized));
  };

  const handleApplySummary = (newSummary: string) => {
    updateData((prev) => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        summary: newSummary,
      },
    }));
  };

  const handleApplyBullet = (expId: string, bulletIndex: number, newBullet: string) => {
    updateData((prev) => ({
      ...prev,
      experiences: prev.experiences.map((exp) => {
        if (exp.id !== expId) return exp;
        const newBullets = [...exp.bullets];
        newBullets[bulletIndex] = newBullet;
        return {
          ...exp,
          bullets: newBullets,
        };
      }),
    }));
  };

  const handleApplySkills = (skills: AiOptimizationResult["skills"]) => {
    updateData((prev) => {
      const mergeUnique = (arr1: string[], arr2: string[]) =>
        Array.from(new Set([...arr1, ...arr2])).filter(Boolean);
      return {
        ...prev,
        skills: {
          technical: mergeUnique(prev.skills.technical, skills.technical),
          tools: mergeUnique(prev.skills.tools, skills.tools),
          languages: mergeUnique(prev.skills.languages, skills.languages),
        },
      };
    });
  };

  // Helper additions
  const addEducation = () => {
    updateData((prev) => ({
      ...prev,
      educations: [
        ...prev.educations,
        {
          id: `edu-${Date.now()}`,
          institution: "",
          degree: "Sarjana (S1)",
          fieldOfStudy: "",
          gpa: "",
          startDate: "",
          endDate: "",
          city: "",
          current: false,
          description: "",
        },
      ],
    }));
  };

  const removeEducation = (id: string) => {
    updateData((prev) => ({
      ...prev,
      educations: prev.educations.filter((e) => e.id !== id),
    }));
  };

  const addExperience = (category: "magang" | "organisasi" | "proyek" | "kerja") => {
    updateData((prev) => ({
      ...prev,
      experiences: [
        ...prev.experiences,
        {
          id: `exp-${Date.now()}`,
          category,
          role: "",
          organization: "",
          startDate: "",
          endDate: "",
          city: "",
          current: false,
          bullets: [""],
        },
      ],
    }));
  };

  const removeExperience = (id: string) => {
    updateData((prev) => ({
      ...prev,
      experiences: prev.experiences.filter((e) => e.id !== id),
    }));
  };

  const addBullet = (expId: string) => {
    updateData((prev) => ({
      ...prev,
      experiences: prev.experiences.map((exp) =>
        exp.id === expId ? { ...exp, bullets: [...exp.bullets, ""] } : exp
      ),
    }));
  };

  const removeBullet = (expId: string, bulletIdx: number) => {
    updateData((prev) => ({
      ...prev,
      experiences: prev.experiences.map((exp) =>
        exp.id === expId
          ? {
              ...exp,
              bullets: exp.bullets.filter((_, idx) => idx !== bulletIdx),
            }
          : exp
      ),
    }));
  };

  const addCertification = () => {
    updateData((prev) => ({
      ...prev,
      certifications: [
        ...prev.certifications,
        {
          id: `cert-${Date.now()}`,
          name: "",
          issuer: "",
          issueDate: "",
          credentialId: "",
          url: "",
        },
      ],
    }));
  };

  const removeCertification = (id: string) => {
    updateData((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((c) => c.id !== id),
    }));
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col font-[family-name:var(--font-body)]">
      {/* Top Action Header - Neobrutalist Solid Bar */}
      <header className="sticky top-0 z-40 bg-[var(--surface)] border-b-[3px] border-black px-4 sm:px-6 py-3 shadow-[0_3px_0_0_#000]">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-2 rounded-[3px] border-2 border-black bg-white hover:bg-[var(--accent)] text-black hard-drop-sm transition-transform cursor-pointer"
              title="Kembali ke Dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>

            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="font-black text-sm sm:text-base bg-[var(--surface)] border-2 border-black rounded-[3px] px-3 py-1 text-black focus:outline-none focus:shadow-[2.5px_2.5px_0_0_#FFE500] font-[family-name:var(--font-heading)]"
              placeholder="Judul Dokumen CV..."
            />
          </div>

          {/* Center Autosave Indicator - Neobrutalist Capsule Badge */}
          <div className="hidden sm:flex items-center gap-2">
            {saveStatus === "saving" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-bold border-2 border-black rounded-[3px] bg-[var(--accent)] text-black shadow-[2px_2px_0_0_#000]">
                <Clock className="h-3.5 w-3.5 animate-spin" />
                <span>Menyimpan...</span>
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-bold border-2 border-black rounded-[3px] bg-emerald-200 text-emerald-950 shadow-[2px_2px_0_0_#000]">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-800" />
                <span>Tersimpan</span>
              </span>
            )}
            {saveStatus === "dirty" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-bold border-2 border-black rounded-[3px] bg-amber-200 text-amber-950 shadow-[2px_2px_0_0_#000]">
                <span className="h-2 w-2 rounded-full bg-amber-600 animate-pulse" />
                <span>Belum tersimpan</span>
              </span>
            )}
            {saveStatus === "error" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-bold border-2 border-black rounded-[3px] bg-rose-200 text-rose-950 shadow-[2px_2px_0_0_#000]">
                <span>{saveErrorMessage || "Gagal menyimpan."}</span>
                <button
                  type="button"
                  onClick={() => retrySave()}
                  className="ml-1 underline font-black hover:text-rose-800 cursor-pointer"
                >
                  Coba lagi
                </button>
              </span>
            )}
            {saveStatus === "conflict" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-bold border-2 border-black rounded-[3px] bg-amber-300 text-black shadow-[2px_2px_0_0_#000]">
                <span>{saveErrorMessage || "Konflik versi: data telah diubah di tab lain."}</span>
                <button
                  type="button"
                  onClick={() => reloadLatestData()}
                  className="ml-1 px-2 py-0.5 bg-black text-white rounded text-[11px] font-black cursor-pointer hover:bg-neutral-800"
                >
                  Muat Ulang
                </button>
              </span>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <button
              onClick={() =>
                updateData((prev) => ({
                  ...prev,
                  metadata: {
                    ...prev.metadata,
                    language: prev.metadata.language === "id" ? "en" : "id",
                  },
                }))
              }
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-[3px] bg-white border-2 border-black text-black hard-drop-sm hover:bg-[var(--accent)] cursor-pointer"
            >
              <Globe className="h-3.5 w-3.5" />
              <span>{data.metadata.language === "id" ? "ID" : "EN"}</span>
            </button>

            {/* AI Optimization Action Button */}
            <button
              onClick={handleTriggerAiOptimize}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-[3px] bg-emerald-300 text-black border-2 border-black hard-drop-sm hover:bg-emerald-400 cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-black" />
              <span className="hidden sm:inline">Rapikan dengan AI</span>
            </button>

            {/* Download / Pay Action */}
            {saveStatus === "saved" ? (
              <Link href={`/cv/${cvId}/download`}>
                <Button variant="primary" size="sm" className="gap-1.5 font-bold cursor-pointer">
                  <Download className="h-3.5 w-3.5" />
                  <span>{isPaid ? "Unduh File Final" : "Unduh PDF & Word"}</span>
                </Button>
              </Link>
            ) : (
              <Button
                variant="primary"
                size="sm"
                disabled
                className="gap-1.5 font-bold opacity-60 cursor-not-allowed bg-neutral-200 text-neutral-600 border-neutral-400"
                title="Perubahan harus tersimpan sepenuhnya sebelum mengunduh berkas"
              >
                <Download className="h-3.5 w-3.5" />
                <span>
                  {saveStatus === "saving" ? "Menyimpan..." : "Belum Tersimpan"}
                </span>
              </Button>
            )}
          </div>
        </div>

        {/* Mobile View Toggle */}
        <div className="flex md:hidden border-t-2 border-black mt-2 pt-2 gap-2">
          <button
            onClick={() => setMobileTab("form")}
            className={`flex-1 py-1.5 text-xs font-bold text-center border-2 border-black rounded-[3px] ${
              mobileTab === "form"
                ? "bg-[var(--accent)] text-black shadow-[2px_2px_0_0_#000]"
                : "bg-white text-black"
            }`}
          >
            Isi Formulir
          </button>
          <button
            onClick={() => setMobileTab("preview")}
            className={`flex-1 py-1.5 text-xs font-bold text-center border-2 border-black rounded-[3px] ${
              mobileTab === "preview"
                ? "bg-[var(--accent)] text-black shadow-[2px_2px_0_0_#000]"
                : "bg-white text-black"
            }`}
          >
            Pratinjau CV
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Stepper + Active Form */}
        <div
          className={`lg:col-span-6 space-y-5 ${
            mobileTab === "preview" ? "hidden md:block" : "block"
          }`}
        >
          {/* Stepper Tabs - Neobrutalist Numbered Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isActive = activeStep === idx;
              return (
                <button
                  key={step.id}
                  onClick={() => setActiveStep(idx)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-[3px] text-xs font-bold shrink-0 transition-transform cursor-pointer ${
                    isActive
                      ? "bg-[var(--accent)] text-black border-[2.5px] border-black shadow-[3px_3px_0_0_#000]"
                      : "bg-[var(--surface)] text-black border-2 border-black hard-drop-sm hover:bg-neutral-100"
                  }`}
                >
                  <span className="font-mono text-[10px] bg-black text-white px-1 py-0.5 rounded-[2px]">
                    {step.stepNumber}
                  </span>
                  <Icon className="h-3.5 w-3.5" />
                  <span>{step.label}</span>
                </button>
              );
            })}
          </div>

          {/* Form Content Card - Neobrutalist Block */}
          <div className="bg-[var(--surface)] border-[3px] border-black rounded-[3px] p-5 sm:p-6 shadow-[5px_5px_0_0_#000] space-y-5">
            {/* STEP 1: DATA DIRI */}
            {activeStep === 0 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-black font-[family-name:var(--font-heading)] text-black">
                    01. Informasi Kontak &amp; Data Diri
                  </h2>
                  <p className="text-xs text-neutral-700 mt-1">
                    Sesuai standar Harvard &amp; UU PDP, nomor HP dan email Anda tidak akan pernah dikirim ke pihak ketiga atau model AI publik.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-black mb-1">
                      Nama Lengkap *
                    </label>
                    <input
                      type="text"
                      value={data.personalInfo.fullName}
                      onChange={(e) =>
                        updateData((prev) => ({
                          ...prev,
                          personalInfo: {
                            ...prev.personalInfo,
                            fullName: e.target.value,
                          },
                        }))
                      }
                      className="w-full px-3 py-2 text-xs border-2 border-black rounded-[3px] bg-white text-black font-[family-name:var(--font-body)] focus:outline-none focus:shadow-[2.5px_2.5px_0_0_#FFE500]"
                      placeholder="e.g. Budi Pratama, S.Kom."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-black mb-1">
                      Kota Domisili *
                    </label>
                    <input
                      type="text"
                      value={data.personalInfo.city}
                      onChange={(e) =>
                        updateData((prev) => ({
                          ...prev,
                          personalInfo: {
                            ...prev.personalInfo,
                            city: e.target.value,
                          },
                        }))
                      }
                      className="w-full px-3 py-2 text-xs border-2 border-black rounded-[3px] bg-white text-black font-[family-name:var(--font-body)] focus:outline-none focus:shadow-[2.5px_2.5px_0_0_#FFE500]"
                      placeholder="e.g. Jakarta Selatan"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-black mb-1">
                      Nomor WhatsApp / HP *
                    </label>
                    <input
                      type="text"
                      value={data.personalInfo.phone}
                      onChange={(e) =>
                        updateData((prev) => ({
                          ...prev,
                          personalInfo: {
                            ...prev.personalInfo,
                            phone: e.target.value,
                          },
                        }))
                      }
                      className="w-full px-3 py-2 text-xs border-2 border-black rounded-[3px] bg-white text-black font-[family-name:var(--font-body)] focus:outline-none focus:shadow-[2.5px_2.5px_0_0_#FFE500]"
                      placeholder="e.g. 0812-3456-7890"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-black mb-1">
                      Alamat Email Aktif *
                    </label>
                    <input
                      type="email"
                      value={data.personalInfo.email}
                      onChange={(e) =>
                        updateData((prev) => ({
                          ...prev,
                          personalInfo: {
                            ...prev.personalInfo,
                            email: e.target.value,
                          },
                        }))
                      }
                      className="w-full px-3 py-2 text-xs border-2 border-black rounded-[3px] bg-white text-black font-[family-name:var(--font-body)] focus:outline-none focus:shadow-[2.5px_2.5px_0_0_#FFE500]"
                      placeholder="e.g. nama@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-black mb-1">
                      Tautan LinkedIn (Opsional)
                    </label>
                    <input
                      type="url"
                      value={data.personalInfo.linkedinUrl || ""}
                      onChange={(e) =>
                        updateData((prev) => ({
                          ...prev,
                          personalInfo: {
                            ...prev.personalInfo,
                            linkedinUrl: e.target.value,
                          },
                        }))
                      }
                      className="w-full px-3 py-2 text-xs border-2 border-black rounded-[3px] bg-white text-black font-[family-name:var(--font-body)] focus:outline-none focus:shadow-[2.5px_2.5px_0_0_#FFE500]"
                      placeholder="https://linkedin.com/in/username"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-black mb-1">
                      Portofolio / GitHub (Opsional)
                    </label>
                    <input
                      type="url"
                      value={data.personalInfo.portfolioUrl || ""}
                      onChange={(e) =>
                        updateData((prev) => ({
                          ...prev,
                          personalInfo: {
                            ...prev.personalInfo,
                            portfolioUrl: e.target.value,
                          },
                        }))
                      }
                      className="w-full px-3 py-2 text-xs border-2 border-black rounded-[3px] bg-white text-black font-[family-name:var(--font-body)] focus:outline-none focus:shadow-[2.5px_2.5px_0_0_#FFE500]"
                      placeholder="https://github.com/username"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-black">
                      Ringkasan Profesional (2–3 Kalimat Ringkas)
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsSummaryAiOpen(true)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold border-2 border-black rounded-[3px] bg-emerald-300 hover:bg-emerald-400 text-black shadow-[2px_2px_0_0_#000] cursor-pointer"
                    >
                      <Sparkles className="h-3 w-3 text-black" />
                      <span>Bantu dengan AI</span>
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={data.personalInfo.summary || ""}
                    onChange={(e) =>
                      updateData((prev) => ({
                        ...prev,
                        personalInfo: {
                          ...prev.personalInfo,
                          summary: e.target.value,
                        },
                      }))
                    }
                    className="w-full px-3 py-2 text-xs border-2 border-black rounded-[3px] bg-white text-black font-[family-name:var(--font-body)] focus:outline-none focus:shadow-[2.5px_2.5px_0_0_#FFE500] leading-relaxed"
                    placeholder="Contoh: Fresh graduate Sarjana Manajemen Bisnis dengan pemahaman analitika pasar dan pengalaman magang operasional..."
                  />
                </div>
              </div>
            )}

            {/* STEP 2: PENDIDIKAN */}
            {activeStep === 1 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-black font-[family-name:var(--font-heading)] text-black">
                      02. Riwayat Pendidikan
                    </h2>
                    <p className="text-xs text-neutral-700 mt-1">
                      Bagi fresh graduate, pendidikan ditaruh paling atas.
                    </p>
                  </div>
                  <button
                    onClick={addEducation}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border-2 border-black rounded-[3px] bg-white hover:bg-[var(--accent)] text-black hard-drop-sm cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Tambah Pendidikan</span>
                  </button>
                </div>

                {data.educations.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-black rounded-[3px] p-4 text-xs font-semibold text-neutral-600 bg-amber-50/40">
                    Belum ada riwayat pendidikan. Klik tombol &quot;Tambah Pendidikan&quot; di atas.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {data.educations.map((edu, idx) => (
                      <div
                        key={edu.id}
                        className="p-4 border-2 border-black rounded-[3px] bg-amber-50/60 shadow-[3px_3px_0_0_#000] space-y-3 relative"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold uppercase bg-[var(--accent)] text-black border border-black px-2 py-0.5 rounded-[2px]">
                            Pendidikan #{idx + 1}
                          </span>
                          <button
                            onClick={() => removeEducation(edu.id)}
                            className="border-2 border-black rounded-[2px] bg-white hover:bg-rose-200 text-black p-1 hard-drop-sm transition-colors cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-rose-700" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-black mb-1">
                              Institusi / Universitas *
                            </label>
                            <input
                              type="text"
                              value={edu.institution}
                              onChange={(e) =>
                                updateData((prev) => ({
                                  ...prev,
                                  educations: prev.educations.map((item) =>
                                    item.id === edu.id
                                      ? { ...item, institution: e.target.value }
                                      : item
                                  ),
                                }))
                              }
                              className="w-full px-2.5 py-1.5 text-xs bg-white border-2 border-black rounded-[3px] focus:outline-none focus:shadow-[2px_2px_0_0_#FFE500]"
                              placeholder="e.g. Universitas Indonesia"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-black mb-1">
                              Kota / Lokasi
                            </label>
                            <input
                              type="text"
                              value={edu.city || ""}
                              onChange={(e) =>
                                updateData((prev) => ({
                                  ...prev,
                                  educations: prev.educations.map((item) =>
                                    item.id === edu.id
                                      ? { ...item, city: e.target.value }
                                      : item
                                  ),
                                }))
                              }
                              className="w-full px-2.5 py-1.5 text-xs bg-white border-2 border-black rounded-[3px] focus:outline-none focus:shadow-[2px_2px_0_0_#FFE500]"
                              placeholder="e.g. Depok, Jawa Barat"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-black mb-1">
                              Jenjang &amp; Jurusan *
                            </label>
                            <input
                              type="text"
                              value={`${edu.degree} ${edu.fieldOfStudy}`}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateData((prev) => ({
                                  ...prev,
                                  educations: prev.educations.map((item) =>
                                    item.id === edu.id
                                      ? {
                                          ...item,
                                          degree: val.split(" ")[0] || "Sarjana",
                                          fieldOfStudy: val.slice(val.indexOf(" ") + 1),
                                        }
                                      : item
                                  ),
                                }));
                              }}
                              className="w-full px-2.5 py-1.5 text-xs bg-white border-2 border-black rounded-[3px] focus:outline-none focus:shadow-[2px_2px_0_0_#FFE500]"
                              placeholder="e.g. S1 Ilmu Komputer"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-black mb-1">
                              IPK (Opsional)
                            </label>
                            <input
                              type="text"
                              value={edu.gpa || ""}
                              onChange={(e) =>
                                updateData((prev) => ({
                                  ...prev,
                                  educations: prev.educations.map((item) =>
                                    item.id === edu.id
                                      ? { ...item, gpa: e.target.value }
                                      : item
                                  ),
                                }))
                              }
                              className="w-full px-2.5 py-1.5 text-xs bg-white border-2 border-black rounded-[3px] focus:outline-none focus:shadow-[2px_2px_0_0_#FFE500]"
                              placeholder="e.g. 3.75 / 4.00"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-black mb-1">
                              Tahun Mulai
                            </label>
                            <input
                              type="text"
                              value={edu.startDate}
                              onChange={(e) =>
                                updateData((prev) => ({
                                  ...prev,
                                  educations: prev.educations.map((item) =>
                                    item.id === edu.id
                                      ? { ...item, startDate: e.target.value }
                                      : item
                                  ),
                                }))
                              }
                              className="w-full px-2.5 py-1.5 text-xs bg-white border-2 border-black rounded-[3px] focus:outline-none focus:shadow-[2px_2px_0_0_#FFE500]"
                              placeholder="e.g. 2022"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-black mb-1">
                              Tahun Kelulusan
                            </label>
                            <input
                              type="text"
                              value={edu.endDate}
                              onChange={(e) =>
                                updateData((prev) => ({
                                  ...prev,
                                  educations: prev.educations.map((item) =>
                                    item.id === edu.id
                                      ? { ...item, endDate: e.target.value }
                                      : item
                                  ),
                                }))
                              }
                              className="w-full px-2.5 py-1.5 text-xs bg-white border-2 border-black rounded-[3px] focus:outline-none focus:shadow-[2px_2px_0_0_#FFE500]"
                              placeholder="e.g. 2026 (atau Sekarang)"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: PENGALAMAN (Magang, Organisasi, Proyek, Kerja) */}
            {activeStep === 2 && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-black font-[family-name:var(--font-heading)] text-black">
                      03. Pengalaman Kerja, Magang &amp; Organisasi
                    </h2>
                    <p className="text-xs text-neutral-700 mt-1">
                      Fresh graduate dapat memasukkan magang, kepanitiaan, atau proyek kuliah.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => addExperience("magang")}
                      className="px-2.5 py-1 text-xs font-bold border-2 border-black rounded-[3px] bg-white hover:bg-[var(--accent)] text-black hard-drop-sm cursor-pointer"
                    >
                      + Magang
                    </button>
                    <button
                      onClick={() => addExperience("organisasi")}
                      className="px-2.5 py-1 text-xs font-bold border-2 border-black rounded-[3px] bg-white hover:bg-[var(--accent)] text-black hard-drop-sm cursor-pointer"
                    >
                      + Organisasi
                    </button>
                    <button
                      onClick={() => addExperience("proyek")}
                      className="px-2.5 py-1 text-xs font-bold border-2 border-black rounded-[3px] bg-white hover:bg-[var(--accent)] text-black hard-drop-sm cursor-pointer"
                    >
                      + Proyek
                    </button>
                  </div>
                </div>

                {data.experiences.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-black rounded-[3px] p-4 text-xs font-semibold text-neutral-600 bg-amber-50/40">
                    Belum ada pengalaman. Pilih salah satu tombol di atas untuk menambahkan magang, organisasi, atau proyek.
                  </div>
                ) : (
                  <div className="space-y-5">
                    {data.experiences.map((exp, idx) => (
                      <div
                        key={exp.id}
                        className="p-4 border-2 border-black rounded-[3px] bg-amber-50/60 shadow-[3px_3px_0_0_#000] space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold uppercase bg-[var(--accent)] text-black border border-black px-2 py-0.5 rounded-[2px]">
                            {exp.category} #{idx + 1}
                          </span>
                          <button
                            onClick={() => removeExperience(exp.id)}
                            className="border-2 border-black rounded-[2px] bg-white hover:bg-rose-200 text-black p-1 hard-drop-sm transition-colors cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-rose-700" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-black mb-1">
                              Posisi / Peran *
                            </label>
                            <input
                              type="text"
                              value={exp.role}
                              onChange={(e) =>
                                updateData((prev) => ({
                                  ...prev,
                                  experiences: prev.experiences.map((item) =>
                                    item.id === exp.id
                                      ? { ...item, role: e.target.value }
                                      : item
                                  ),
                                }))
                              }
                              className="w-full px-2.5 py-1.5 text-xs bg-white border-2 border-black rounded-[3px] focus:outline-none focus:shadow-[2px_2px_0_0_#FFE500]"
                              placeholder="e.g. Staf Divisi Acara"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-black mb-1">
                              Nama Perusahaan / Organisasi *
                            </label>
                            <input
                              type="text"
                              value={exp.organization}
                              onChange={(e) =>
                                updateData((prev) => ({
                                  ...prev,
                                  experiences: prev.experiences.map((item) =>
                                    item.id === exp.id
                                      ? { ...item, organization: e.target.value }
                                      : item
                                  ),
                                }))
                              }
                              className="w-full px-2.5 py-1.5 text-xs bg-white border-2 border-black rounded-[3px] focus:outline-none focus:shadow-[2px_2px_0_0_#FFE500]"
                              placeholder="e.g. BEM Fakultas Teknik"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-black mb-1">
                              Periode Mulai &amp; Selesai
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={exp.startDate}
                                onChange={(e) =>
                                  updateData((prev) => ({
                                    ...prev,
                                    experiences: prev.experiences.map((item) =>
                                      item.id === exp.id
                                        ? { ...item, startDate: e.target.value }
                                        : item
                                    ),
                                  }))
                                }
                                className="w-1/2 px-2.5 py-1.5 text-xs bg-white border-2 border-black rounded-[3px] focus:outline-none focus:shadow-[2px_2px_0_0_#FFE500]"
                                placeholder="e.g. Jan 2024"
                              />
                              <input
                                type="text"
                                value={exp.endDate}
                                onChange={(e) =>
                                  updateData((prev) => ({
                                    ...prev,
                                    experiences: prev.experiences.map((item) =>
                                      item.id === exp.id
                                        ? { ...item, endDate: e.target.value }
                                        : item
                                    ),
                                  }))
                                }
                                className="w-1/2 px-2.5 py-1.5 text-xs bg-white border-2 border-black rounded-[3px] focus:outline-none focus:shadow-[2px_2px_0_0_#FFE500]"
                                placeholder="e.g. Des 2024"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-black mb-1">
                              Kota / Lokasi
                            </label>
                            <input
                              type="text"
                              value={exp.city || ""}
                              onChange={(e) =>
                                updateData((prev) => ({
                                  ...prev,
                                  experiences: prev.experiences.map((item) =>
                                    item.id === exp.id
                                      ? { ...item, city: e.target.value }
                                      : item
                                  ),
                                }))
                              }
                              className="w-full px-2.5 py-1.5 text-xs bg-white border-2 border-black rounded-[3px] focus:outline-none focus:shadow-[2px_2px_0_0_#FFE500]"
                              placeholder="e.g. Jakarta Pusat"
                            />
                          </div>
                        </div>

                        {/* Bullets List */}
                        <div className="space-y-2 pt-2">
                          <div className="flex items-center justify-between">
                            <label className="block text-[11px] font-bold text-black">
                              Poin Pencapaian &amp; Tugas (Formula Aksi Harvard):
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingExpForAi(exp);
                                setIsExpAiOpen(true);
                              }}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold border-2 border-black rounded-[3px] bg-emerald-300 hover:bg-emerald-400 text-black shadow-[2px_2px_0_0_#000] cursor-pointer"
                            >
                              <Sparkles className="h-3 w-3 text-black" />
                              <span>Bantu dengan AI</span>
                            </button>
                          </div>
                          {exp.bullets.map((bullet, bIdx) => (
                            <div key={bIdx} className="flex items-center gap-2">
                              <span className="text-black font-black text-xs">•</span>
                              <input
                                type="text"
                                value={bullet}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  updateData((prev) => ({
                                    ...prev,
                                    experiences: prev.experiences.map((item) =>
                                      item.id === exp.id
                                        ? {
                                            ...item,
                                            bullets: item.bullets.map((b, i) =>
                                              i === bIdx ? val : b
                                            ),
                                          }
                                        : item
                                    ),
                                  }));
                                }}
                                className="flex-1 px-2.5 py-1.5 text-xs bg-white border-2 border-black rounded-[3px] focus:outline-none focus:shadow-[2px_2px_0_0_#FFE500]"
                                placeholder="e.g. Mengelola database absensi 300 peserta di google sheet..."
                              />
                              {exp.bullets.length > 1 && (
                                <button
                                  onClick={() => removeBullet(exp.id, bIdx)}
                                  className="border-2 border-black rounded-[2px] bg-white hover:bg-rose-200 text-black p-1 hard-drop-sm transition-colors cursor-pointer"
                                  title="Hapus poin"
                                >
                                  <Trash2 className="h-3 w-3 text-rose-700" />
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => addBullet(exp.id)}
                            className="text-xs font-bold text-black border-2 border-black bg-[var(--accent)] hover:bg-yellow-300 px-2 py-1 rounded-[2px] inline-flex items-center gap-1 mt-1 hard-drop-sm cursor-pointer"
                          >
                            <Plus className="h-3 w-3" />
                            <span>Tambah Poin</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* STEP 4: KEAHLIAN */}
            {activeStep === 3 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-black font-[family-name:var(--font-heading)] text-black">
                    04. Keahlian &amp; Perangkat Lunak
                  </h2>
                  <p className="text-xs text-neutral-700 mt-1">
                    Pisahkan dengan tanda koma (e.g. React, TypeScript, SQL).
                  </p>
                </div>

                <div className="space-y-4">
                  <SkillTagInput
                    label="Keahlian Teknis (Hard Skills)"
                    value={data.skills.technical}
                    onChange={(arr) =>
                      updateData((prev) => ({
                        ...prev,
                        skills: { ...prev.skills, technical: arr },
                      }))
                    }
                    placeholder="e.g. Rekonsiliasi Bank, Analisis Keuangan, Riset Pasar"
                  />

                  <SkillTagInput
                    label="Perangkat Lunak / Tools"
                    value={data.skills.tools}
                    onChange={(arr) =>
                      updateData((prev) => ({
                        ...prev,
                        skills: { ...prev.skills, tools: arr },
                      }))
                    }
                    placeholder="e.g. Microsoft Excel, Google Sheets, Canva, Figma"
                  />

                  <SkillTagInput
                    label="Kemampuan Bahasa"
                    value={data.skills.languages}
                    onChange={(arr) =>
                      updateData((prev) => ({
                        ...prev,
                        skills: { ...prev.skills, languages: arr },
                      }))
                    }
                    placeholder="e.g. Bahasa Indonesia (Penutur Asli), English (Professional Working)"
                  />
                </div>
              </div>
            )}

            {/* STEP 5: SERTIFIKASI & PENGHARGAAN */}
            {activeStep === 4 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black font-[family-name:var(--font-heading)] text-black">
                    05. Sertifikasi &amp; Penghargaan
                  </h2>
                  <button
                    onClick={addCertification}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border-2 border-black rounded-[3px] bg-white hover:bg-[var(--accent)] text-black hard-drop-sm cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Tambah Sertifikasi</span>
                  </button>
                </div>

                {data.certifications.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-black rounded-[3px] p-4 text-xs font-semibold text-neutral-600 bg-amber-50/40">
                    Belum ada sertifikasi. Jika Anda memiliki kursus bersertifikat, klik &quot;Tambah Sertifikasi&quot;.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.certifications.map((cert) => (
                      <div
                        key={cert.id}
                        className="p-3 border-2 border-black rounded-[3px] bg-amber-50/60 shadow-[3px_3px_0_0_#000] flex items-center justify-between gap-3"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
                          <input
                            type="text"
                            value={cert.name}
                            onChange={(e) =>
                              updateData((prev) => ({
                                ...prev,
                                certifications: prev.certifications.map((c) =>
                                  c.id === cert.id
                                    ? { ...c, name: e.target.value }
                                    : c
                                ),
                              }))
                            }
                            placeholder="Nama Sertifikasi"
                            className="px-2 py-1 text-xs bg-white border-2 border-black rounded-[3px] focus:outline-none focus:shadow-[2px_2px_0_0_#FFE500]"
                          />
                          <input
                            type="text"
                            value={cert.issuer}
                            onChange={(e) =>
                              updateData((prev) => ({
                                ...prev,
                                certifications: prev.certifications.map((c) =>
                                  c.id === cert.id
                                    ? { ...c, issuer: e.target.value }
                                    : c
                                ),
                              }))
                            }
                            placeholder="Lembaga Penerbit"
                            className="px-2 py-1 text-xs bg-white border-2 border-black rounded-[3px] focus:outline-none focus:shadow-[2px_2px_0_0_#FFE500]"
                          />
                          <input
                            type="text"
                            value={cert.issueDate}
                            onChange={(e) =>
                              updateData((prev) => ({
                                ...prev,
                                certifications: prev.certifications.map((c) =>
                                  c.id === cert.id
                                    ? { ...c, issueDate: e.target.value }
                                    : c
                                ),
                              }))
                            }
                            placeholder="Tahun (e.g. 2024)"
                            className="px-2 py-1 text-xs bg-white border-2 border-black rounded-[3px] focus:outline-none focus:shadow-[2px_2px_0_0_#FFE500]"
                          />
                        </div>

                        <button
                          onClick={() => removeCertification(cert.id)}
                          className="border-2 border-black rounded-[2px] bg-white hover:bg-rose-200 text-black p-1 hard-drop-sm transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-rose-700" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* STEP 6: TARGET LOWONGAN */}
            {activeStep === 5 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-black font-[family-name:var(--font-heading)] text-black">
                    06. Target Lowongan Kerja (Pencocokan Kata Kunci ATS)
                  </h2>
                  <p className="text-xs text-neutral-700 mt-1">
                    Tempelkan deskripsi lowongan kerja yang ingin Anda lamar. AI akan menganalisis kata kunci penting tanpa memanipulasi fakta pengalaman Anda.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-black mb-1">
                        Posisi yang Dilamar
                      </label>
                      <input
                        type="text"
                        value={data.metadata.targetPosition || ""}
                        onChange={(e) =>
                          updateData((prev) => ({
                            ...prev,
                            metadata: {
                              ...prev.metadata,
                              targetPosition: e.target.value,
                            },
                          }))
                        }
                        className="w-full px-3 py-2 text-xs border-2 border-black rounded-[3px] bg-white text-black focus:outline-none focus:shadow-[2.5px_2.5px_0_0_#FFE500]"
                        placeholder="e.g. Management Trainee / Junior Developer"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-black mb-1">
                        Nama Perusahaan Target
                      </label>
                      <input
                        type="text"
                        value={data.metadata.targetCompany || ""}
                        onChange={(e) =>
                          updateData((prev) => ({
                            ...prev,
                            metadata: {
                              ...prev.metadata,
                              targetCompany: e.target.value,
                            },
                          }))
                        }
                        className="w-full px-3 py-2 text-xs border-2 border-black rounded-[3px] bg-white text-black focus:outline-none focus:shadow-[2.5px_2.5px_0_0_#FFE500]"
                        placeholder="e.g. PT Bank Central Asia Tbk"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-black mb-1">
                      Deskripsi Lowongan Kerja (Salin &amp; Tempel di Sini)
                    </label>
                    <textarea
                      rows={6}
                      value={data.metadata.jobDescription || ""}
                      onChange={(e) =>
                        updateData((prev) => ({
                          ...prev,
                          metadata: {
                            ...prev.metadata,
                            jobDescription: e.target.value,
                          },
                        }))
                      }
                      className="w-full px-3 py-2 text-xs font-mono border-2 border-black rounded-[3px] bg-white text-black focus:outline-none focus:shadow-[2.5px_2.5px_0_0_#FFE500] leading-relaxed"
                      placeholder="Tempel kualifikasi dan tanggung jawab pekerjaan dari LinkedIn / Jobstreet / Kalibrr..."
                    />
                  </div>

                  {/* AI Keyword Matching Callout Card - Neobrutalist Block */}
                  <div className="p-4 rounded-[3px] border-[2.5px] border-black bg-amber-100 shadow-[3px_3px_0_0_#000] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-black text-black flex items-center gap-1.5 uppercase font-[family-name:var(--font-heading)]">
                        <Sparkles className="h-3.5 w-3.5 text-black" />
                        Penyelarasan Kata Kunci Otomatis
                      </h4>
                      <p className="text-[11px] text-neutral-800 mt-0.5">
                        AI akan menganalisis kata kunci deskripsi lowongan di atas dan merapikan kalimat pengalaman Anda sesuai formula tindakan Harvard.
                      </p>
                    </div>
                    <button
                      onClick={handleTriggerAiOptimize}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border-2 border-black rounded-[3px] bg-emerald-400 hover:bg-emerald-300 text-black hard-drop-sm cursor-pointer shrink-0"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Cocokkan &amp; Rapikan AI</span>
                    </button>
                  </div>

                  {/* TEMPLATE SWITCHER (Template A vs Template B) */}
                  <div className="pt-4 border-t-2 border-black space-y-3">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-black mb-1.5 font-[family-name:var(--font-heading)]">
                        Pilih Desain &amp; Format Template CV:
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            updateData((prev) => ({
                              ...prev,
                              metadata: { ...prev.metadata, template: "ats-harvard" },
                            }))
                          }
                          className={`p-3 border-2 border-black rounded-[3px] text-left transition-all cursor-pointer ${
                            (data.metadata.template || "ats-harvard") === "ats-harvard"
                              ? "bg-black text-white shadow-[3px_3px_0_0_#FFE500]"
                              : "bg-white text-black hover:bg-neutral-50"
                          }`}
                        >
                          <div className="font-black text-xs">Template A: ATS Harvard (Default)</div>
                          <p
                            className={`text-[10px] mt-1 leading-snug ${
                              (data.metadata.template || "ats-harvard") === "ats-harvard"
                                ? "text-neutral-300"
                                : "text-neutral-600"
                            }`}
                          >
                            1 Kolom linier tanpa foto. 100% lolos sistem ATS perusahaan multinasional, tech, &amp; BUMN.
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            updateData((prev) => ({
                              ...prev,
                              metadata: { ...prev.metadata, template: "with-photo" },
                            }))
                          }
                          className={`p-3 border-2 border-black rounded-[3px] text-left transition-all cursor-pointer ${
                            data.metadata.template === "with-photo"
                              ? "bg-black text-white shadow-[3px_3px_0_0_#FFE500]"
                              : "bg-white text-black hover:bg-neutral-50"
                          }`}
                        >
                          <div className="font-black text-xs">Template B: Dengan Pasfoto Formal</div>
                          <p
                            className={`text-[10px] mt-1 leading-snug ${
                              data.metadata.template === "with-photo"
                                ? "text-neutral-300"
                                : "text-neutral-600"
                            }`}
                          >
                            1 Kolom dengan pasfoto di pojok kanan atas identitas. Cocok untuk front-liner, hospitality, dan agensi.
                          </p>
                        </button>
                      </div>
                    </div>

                    {/* ATS Warning Banner when Template B is chosen */}
                    {data.metadata.template === "with-photo" && (
                      <div className="p-3.5 bg-amber-100 border-2 border-amber-900 rounded-[3px] text-amber-950 text-xs space-y-3 shadow-[2.5px_2.5px_0_0_#000]">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-900 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-black uppercase tracking-wide">Peringatan Sistem ATS:</span>
                            <p className="text-[11px] mt-0.5 font-medium leading-relaxed">
                              Menambahkan foto tidak disarankan jika melamar ke perusahaan multinasional atau sistem ATS otomatis (karena dapat memicu bias rekrutmen atau kegagalan pembacaan parser). Namun format ini sangat diminati untuk posisi customer service, hospitality, front-liner, atau agensi kreatif.
                            </p>
                          </div>
                        </div>

                        {/* Photo upload block */}
                        <div className="bg-white p-3 border-2 border-black rounded-[3px] space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-black text-xs text-black">Unggah Pasfoto Formal:</span>
                            {data.personalInfo.photoUrl && (
                              <button
                                type="button"
                                onClick={handleDeletePhoto}
                                className="text-[11px] font-bold text-rose-700 hover:underline cursor-pointer"
                              >
                                Hapus Foto
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            {data.personalInfo.photoUrl ? (
                              <img
                                src={data.personalInfo.photoUrl}
                                alt="Foto CV"
                                className="w-16 h-20 object-cover border-2 border-black rounded-[2px]"
                              />
                            ) : (
                              <div className="w-16 h-20 border-2 border-dashed border-black/40 rounded-[2px] bg-neutral-100 flex items-center justify-center text-[10px] font-bold text-neutral-500 text-center p-1">
                                Pasfoto 3x4
                              </div>
                            )}

                            <div className="flex-1 space-y-1.5">
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handlePhotoFileChange}
                                disabled={isUploadingPhoto}
                                className="text-xs file:mr-2 file:py-1 file:px-2.5 file:border-2 file:border-black file:rounded-[2px] file:bg-black file:text-white file:text-xs file:font-bold file:cursor-pointer disabled:opacity-50"
                              />
                              <p className="text-[10px] text-neutral-600">
                                Maksimal 2MB (JPG, PNG, WEBP). Di-resize otomatis ke &le; 600px.
                              </p>
                              {isUploadingPhoto && (
                                <p className="text-[10px] font-bold text-amber-700 animate-pulse">
                                  Sedang memproses dan mengunggah foto...
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Stepper Navigation Buttons */}
            <div className="pt-4 border-t-2 border-black flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                disabled={activeStep === 0}
                onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
                className="border-2 border-black rounded-[3px] font-bold hard-drop-sm"
              >
                Kembali
              </Button>

              <div className="text-xs font-mono font-bold text-black border-2 border-black bg-neutral-100 px-2 py-1 rounded-[2px]">
                Langkah {activeStep + 1} dari {STEPS.length}
              </div>

              {activeStep < STEPS.length - 1 ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() =>
                    setActiveStep((prev) =>
                      Math.min(STEPS.length - 1, prev + 1)
                    )
                  }
                  className="gap-1.5 border-2 border-black font-bold hard-drop-sm"
                >
                  <span>Selanjutnya</span>
                  <IconArrowRight className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <Link href={`/cv/${cvId}/download`}>
                  <Button variant="primary" size="sm" className="gap-1.5 border-2 border-black font-bold hard-drop-sm">
                    <span>Selesai &amp; Unduh</span>
                    <IconArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Sticky Real-time Harvard Preview Desk Frame */}
        <div
          className={`lg:col-span-6 sticky top-20 ${
            mobileTab === "form" ? "hidden md:block" : "block"
          }`}
        >
          <div className="border-[3px] border-black rounded-[3px] bg-neutral-100 p-3 sm:p-4 shadow-[6px_6px_0_0_#000]">
            {/* Desk Toolbar */}
            <div className="flex items-center justify-between mb-3 px-3 py-2 bg-white border-2 border-black rounded-[3px] shadow-[2px_2px_0_0_#000]">
              <span className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5 font-[family-name:var(--font-heading)]">
                <Eye className="h-4 w-4 text-black" />
                <span>Pratinjau Format Harvard (ATS)</span>
              </span>
              <span
                className={`text-[10px] font-mono font-bold border-2 border-black px-2 py-0.5 rounded-[2px] ${
                  isPaid ? "bg-emerald-300 text-black" : "bg-[var(--accent)] text-black"
                }`}
              >
                {isPaid ? "Versi Siap Unduh" : "Watermark Preview"}
              </span>
            </div>

            {/* Document Scroll Viewport (Preserving Plain Harvard ATS Document) */}
            <div className="max-h-[calc(100vh-160px)] overflow-y-auto rounded-[3px] border-2 border-black bg-white shadow-[3px_3px_0_0_#000]">
              <HarvardCvPreview data={data} isPaid={isPaid} />
            </div>
          </div>
        </div>
      </div>

      {/* AI Diff Comparison Modal */}
      <AiDiffModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        originalCv={data}
        optimized={aiResult}
        isLoading={isAiLoading}
        onApplyAll={handleApplyAllAi}
        onApplyBullet={handleApplyBullet}
        onApplySummary={handleApplySummary}
        onApplySkills={handleApplySkills}
      />

      {/* Experience AI Assistant Modal */}
      {editingExpForAi && (
        <ExperienceAiAssistModal
          isOpen={isExpAiOpen}
          onClose={() => {
            setIsExpAiOpen(false);
            setEditingExpForAi(null);
          }}
          cvId={cvId}
          role={editingExpForAi.role}
          organization={editingExpForAi.organization}
          category={editingExpForAi.category}
          currentBullets={editingExpForAi.bullets}
          onApplyBullets={(newBullets) => {
            updateData((prev) => ({
              ...prev,
              experiences: prev.experiences.map((item) =>
                item.id === editingExpForAi.id
                  ? { ...item, bullets: newBullets }
                  : item
              ),
            }));
          }}
        />
      )}

      {/* Summary AI Assistant Modal */}
      <SummaryAiAssistModal
        isOpen={isSummaryAiOpen}
        onClose={() => setIsSummaryAiOpen(false)}
        cvId={cvId}
        cvData={data}
        onApplySummary={(newSummary) => {
          updateData((prev) => ({
            ...prev,
            personalInfo: {
              ...prev.personalInfo,
              summary: newSummary,
            },
          }));
        }}
      />
    </div>
  );
}
