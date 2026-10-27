import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Sesi login tidak sah" }, { status: 401 });
    }

    const { data: applications, error: fetchError } = await supabase
      .from("applications")
      .select("*")
      .eq("user_id", user.id)
      .order("applied_date", { ascending: false });

    if (fetchError) {
      console.error("Error fetching applications:", fetchError);
      return NextResponse.json({ error: "Gagal memuat lamaran" }, { status: 500 });
    }

    return NextResponse.json({ applications: applications || [] });
  } catch (error) {
    console.error("GET /api/tracker/applications error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Sesi login tidak sah" }, { status: 401 });
    }

    const body = await request.json();

    if (!body.company || !body.position) {
      return NextResponse.json(
        { error: "Nama perusahaan dan posisi pekerjaan wajib diisi" },
        { status: 400 }
      );
    }

    const validStatuses = ["Belum dikirim", "Terkirim", "Wawancara", "Tawaran", "Ditolak"] as const;
    const status = validStatuses.includes(body.status) ? body.status : "Terkirim";

    const { data: newApp, error: insertError } = await supabase
      .from("applications")
      .insert({
        user_id: user.id,
        company: body.company.trim(),
        position: body.position.trim(),
        status,
        applied_date: body.applied_date || new Date().toISOString().split("T")[0],
        job_url: body.job_url || null,
        cv_version: body.cv_version || "ATS Harvard",
        notes: body.notes || null,
        cv_id: body.cv_id || null,
      })
      .select("*")
      .single();

    if (insertError) {
      console.error("Error inserting application:", insertError);
      return NextResponse.json({ error: "Gagal menyimpan lamaran kerja" }, { status: 500 });
    }

    return NextResponse.json({ application: newApp }, { status: 201 });
  } catch (error) {
    console.error("POST /api/tracker/applications error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
