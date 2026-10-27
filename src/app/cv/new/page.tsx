import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { initialCvData } from "@/types/cv";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Membuat CV Baru...",
};

export default async function NewCvPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirect=/cv/new");
  }

  // Insert a fresh CV record for the authenticated user
  const { data: newCv, error } = await supabase
    .from("cvs")
    .insert({
      user_id: user.id,
      title: "CV ATS Saya",
      language: "id",
      data: initialCvData,
      version: 1,
    })
    .select("id")
    .single();

  if (error || !newCv) {
    console.error("Error creating new CV:", error);
    return (
      <div className="min-h-screen bg-[var(--color-bg-canvas)] flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] text-center shadow-sm">
          <h1 className="text-xl font-bold font-[family-name:var(--font-display)] text-[var(--color-text-main)] mb-2">
            Gagal Membuat CV Baru
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mb-6">
            Terjadi kendala saat menginisialisasi dokumen baru di cloud. Silakan coba kembali.
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                Kembali ke Dashboard
              </Button>
            </Link>
            <Link href="/cv/new">
              <Button variant="primary" size="sm">
                Coba Lagi
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Redirect to the newly created CV editor
  redirect(`/cv/${newCv.id}`);
}
