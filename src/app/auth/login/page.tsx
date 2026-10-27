import type { Metadata } from "next";
import Link from "next/link";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { CVBuilderLogo3D } from "@/components/ui/CVBuilderLogo3D";
import { ArrowLeft, Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "Masuk ke CVBuilder",
  description: "Masuk dengan akun Google Anda untuk membuat dan mengelola CV format ATS.",
};

export default async function LoginPage(props: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const searchParams = await props.searchParams;
  const next = searchParams.next || "/dashboard";
  const error = searchParams.error;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--color-bg-canvas)]">
      <div className="w-full max-w-md bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-[var(--radius-lg)] p-8 shadow-sm">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali ke Beranda</span>
        </Link>

        <div className="mb-2">
          <CVBuilderLogo3D size="md" />
        </div>

        <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-[var(--color-text-main)] mt-4">
          Masuk ke Akun Anda
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1.5 mb-6">
          Satu akun Google untuk menyusun CV ATS, mencocokkan kata kunci lowongan,
          dan memantau lamaran.
        </p>

        {error === "oauth_failed" && (
          <div className="mb-6 p-3 rounded-[var(--radius-sm)] bg-[var(--color-error-light)] border border-[var(--color-error)]/20 text-xs text-[var(--color-error)]">
            Gagal masuk dengan Google. Silakan coba kembali atau gunakan browser lain.
          </div>
        )}

        <div className="space-y-4">
          <GoogleSignInButton
            redirectTo={next}
            variant="primary"
            size="lg"
            className="w-full justify-center"
          />

          <div className="flex items-center gap-2 pt-4 border-t border-[var(--color-border-subtle)] text-[11px] text-[var(--color-text-faint)] leading-normal">
            <Shield className="h-3.5 w-3.5 shrink-0 text-[var(--color-success)]" />
            <span>
              Data Anda aman dan dilindungi di bawah prinsip UU PDP. Kami tidak
              pernah membagikan data pribadi Anda ke pihak ketiga yang tidak berwenang.
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
