"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CURRENT_AI_CONSENT_VERSION } from "@/lib/auth";
import { ShieldCheck, CheckCircle2 } from "lucide-react";

interface ConsentModalProps {
  isOpen: boolean;
  onConsentSuccess: () => void;
}

export function ConsentModal({ isOpen, onConsentSuccess }: ConsentModalProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const handleAccept = async () => {
    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const res = await fetch("/api/auth/consent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          consent_type: "ai_gemini_processing",
          consent_version: CURRENT_AI_CONSENT_VERSION,
          granted: true,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Gagal menyimpan persetujuan.");
      }

      onConsentSuccess();
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat memproses persetujuan."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent hideCloseButton className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-accent-light)] text-[var(--color-accent)]">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center text-xl">
            Persetujuan Pemrosesan AI
          </DialogTitle>
          <DialogDescription className="text-center">
            Sesuai UU Pelindungan Data Pribadi (UU PDP), kami meminta izin Anda
            sebelum menggunakan fitur pemoles CV berbasis kecerdasan buatan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 rounded-[var(--radius-md)] bg-[var(--color-bg-subtle)] p-4 text-xs text-[var(--color-text-muted)] leading-relaxed">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-[var(--color-success)] shrink-0 mt-0.5" />
            <span>
              <strong>Perlindungan Privasi:</strong> Nomor HP, email pribadi, dan
              alamat rumah Anda tidak akan dikirimkan ke model AI.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-[var(--color-success)] shrink-0 mt-0.5" />
            <span>
              <strong>Pemrosesan Resmi:</strong> Data teks deskripsi pengalaman dan
              lowongan diproses melalui Google Gemini API resmi tanpa disimpan
              untuk melatih model publik.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-[var(--color-success)] shrink-0 mt-0.5" />
            <span>
              <strong>Transparansi Penuh:</strong> AI dilarang mengarang fakta.
              Semua saran perbaikan dapat Anda terima atau tolak per bagian.
            </span>
          </div>
        </div>

        {errorMsg && (
          <p className="text-xs text-[var(--color-error)] text-center">
            {errorMsg}
          </p>
        )}

        <DialogFooter className="mt-2 sm:justify-center">
          <Button
            variant="primary"
            size="md"
            className="w-full sm:w-auto"
            isLoading={isSubmitting}
            onClick={handleAccept}
          >
            Saya Mengerti & Setuju
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
