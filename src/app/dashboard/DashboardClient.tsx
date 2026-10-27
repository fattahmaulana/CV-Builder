"use client";

import * as React from "react";
import Link from "next/link";
import { ConsentModal } from "@/components/auth/ConsentModal";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-client";
import { CVBuilderLogo3D } from "@/components/ui/CVBuilderLogo3D";
import {
  FileText,
  Plus,
  LogOut,
  Sparkles,
  Briefcase,
  CheckCircle,
} from "lucide-react";

interface DashboardClientProps {
  user: {
    id: string;
    email: string;
    name: string;
  };
  initialHasConsent: boolean;
  initialCvList: Array<{
    id: string;
    title: string;
    language: "id" | "en";
    match_score: number | null;
    updated_at: string;
  }>;
}

export function DashboardClient({
  user,
  initialHasConsent,
  initialCvList,
}: DashboardClientProps) {
  const [hasConsent, setHasConsent] = React.useState(initialHasConsent);

  return (
    <div className="min-h-screen bg-[var(--color-bg-canvas)] flex flex-col">
      {/* AI Processing Consent Modal under UU PDP */}
      <ConsentModal
        isOpen={!hasConsent}
        onConsentSuccess={() => setHasConsent(true)}
      />

      {/* Navigation Header */}
      <header className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/80 backdrop-blur-xs sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2">
              <CVBuilderLogo3D size="sm" />
            </Link>

            <nav className="hidden sm:flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-xs font-bold text-[var(--color-accent)] border-b-2 border-[var(--color-accent)] pb-0.5"
              >
                Dokumen CV
              </Link>
              <Link
                href="/tracker"
                className="text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors flex items-center gap-1.5"
              >
                <Briefcase className="h-3.5 w-3.5 text-neutral-700" />
                <span>Pelacak Lamaran</span>
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-[var(--color-text-main)]">
                {user.name}
              </p>
              <p className="text-[11px] text-[var(--color-text-muted)]">
                {user.email}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut()}
              className="gap-1.5"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="flex-1 max-w-6xl mx-auto px-6 py-10 w-full">
        {/* Welcome Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-8 border-b border-[var(--color-border-subtle)] mb-8">
          <div>
            <h1 className="text-3xl font-bold font-[family-name:var(--font-display)] text-[var(--color-text-main)]">
              Halo, {user.name}
            </h1>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              Kelola dokumen CV format ATS Anda dan sesuaikan dengan lowongan kerja impian.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/tracker">
              <Button variant="outline" size="md" className="gap-2 shadow-xs bg-[var(--color-bg-card)]">
                <Briefcase className="h-4 w-4 text-neutral-800" />
                <span className="hidden sm:inline">Pelacak Lamaran</span>
                <span className="sm:hidden">Tracker</span>
              </Button>
            </Link>
            <Link href="/cv/new">
              <Button variant="primary" size="md" className="gap-2 shadow-sm">
                <Plus className="h-4 w-4" />
                <span>Buat CV Baru</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div className="p-5 rounded-[var(--radius-md)] bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] shadow-xs">
            <div className="flex items-center justify-between text-[var(--color-text-muted)] mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">
                Total Dokumen
              </span>
              <FileText className="h-4 w-4 text-[var(--color-accent)]" />
            </div>
            <p className="text-2xl font-bold font-[family-name:var(--font-display)] text-[var(--color-text-main)]">
              {initialCvList.length}
            </p>
          </div>

          <div className="p-5 rounded-[var(--radius-md)] bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] shadow-xs">
            <div className="flex items-center justify-between text-[var(--color-text-muted)] mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">
                Status Pemrosesan AI
              </span>
              <Sparkles className="h-4 w-4 text-[var(--color-success)]" />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[var(--color-success)] font-medium">
              <CheckCircle className="h-3.5 w-3.5" />
              <span>{hasConsent ? "Aktif & Terverifikasi" : "Menunggu Izin"}</span>
            </div>
          </div>

          <div className="p-5 rounded-[var(--radius-md)] bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] shadow-xs">
            <div className="flex items-center justify-between text-[var(--color-text-muted)] mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">
                Format Ekspor
              </span>
              <Briefcase className="h-4 w-4 text-[var(--color-info)]" />
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">
              Standar ATS Harvard (PDF Asli &amp; DOCX Word)
            </p>
          </div>
        </div>

        {/* CV List Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold font-[family-name:var(--font-display)] text-[var(--color-text-main)]">
              Daftar CV Anda
            </h2>
          </div>

          {initialCvList.length === 0 ? (
            <div className="text-center py-16 px-6 bg-[var(--color-bg-card)] border border-dashed border-[var(--color-border-subtle)] rounded-[var(--radius-lg)]">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-bg-subtle)] text-[var(--color-accent)] mb-4">
                <FileText className="h-7 w-7" />
              </div>
              <h3 className="text-base font-semibold text-[var(--color-text-main)]">
                Belum ada CV yang dibuat
              </h3>
              <p className="text-xs text-[var(--color-text-muted)] max-w-sm mx-auto mt-1 mb-6">
                Mulai susun CV format ATS gaya Harvard pertama Anda dengan panduan bertahap dan bantuan perapian AI.
              </p>
              <Link href="/cv/new">
                <Button variant="primary" size="md" className="gap-2">
                  <Plus className="h-4 w-4" />
                  <span>Mulai Tulis CV</span>
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {initialCvList.map((cv) => (
                <Link
                  key={cv.id}
                  href={`/cv/${cv.id}`}
                  className="group block p-6 rounded-[var(--radius-md)] bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] hover:border-[var(--color-accent-border)] hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-accent)] bg-[var(--color-accent-light)] px-2.5 py-0.5 rounded-full">
                      {cv.language === "id" ? "Bahasa Indonesia" : "English"}
                    </span>
                    {cv.match_score !== null && (
                      <span className="text-xs font-bold text-[var(--color-text-main)]">
                        Skor: {cv.match_score}%
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold font-[family-name:var(--font-display)] text-[var(--color-text-main)] group-hover:text-[var(--color-accent)] transition-colors">
                    {cv.title}
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)] mt-2">
                    Diperbarui:{" "}
                    {new Date(cv.updated_at).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
