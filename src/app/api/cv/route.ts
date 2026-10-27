import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { initialCvData, cvDataSchema } from "@/types/cv";

// POST: Create a new CV draft
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let title = "CV ATS Saya";
    let language: "id" | "en" = "id";

    try {
      const body = await request.json();
      if (body.title) title = body.title;
      if (body.language === "en") language = "en";
    } catch {
      // Default to initial
    }

    const initialData = {
      ...initialCvData,
      metadata: {
        ...initialCvData.metadata,
        language,
      },
    };

    const { data: newCv, error: insertError } = await supabase
      .from("cvs")
      .insert({
        user_id: user.id,
        title,
        language,
        data: initialData,
        version: 1,
      })
      .select("id, title, language, data, created_at, updated_at")
      .single();

    if (insertError) {
      console.error("Error creating CV:", insertError);
      return NextResponse.json(
        { error: "Gagal membuat draf CV baru" },
        { status: 500 }
      );
    }

    return NextResponse.json({ cv: newCv }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error in POST /api/cv:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET: List all CVs for the authenticated user
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: cvList, error: fetchError } = await supabase
      .from("cvs")
      .select("id, title, language, match_score, updated_at, created_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (fetchError) {
      console.error("Error fetching CV list:", fetchError);
      return NextResponse.json({ error: "Gagal memuat daftar CV" }, { status: 500 });
    }

    return NextResponse.json({ cvs: cvList || [] });
  } catch (error) {
    console.error("Unexpected error in GET /api/cv:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
