import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cvDraftSchema } from "@/types/cv";
import { Database } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type CvUpdate = Database["public"]["Tables"]["cvs"]["Update"];

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: Retrieve a specific CV by ID with IDOR protection
export async function GET(request: Request, props: RouteParams) {
  try {
    const { id } = await props.params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { code: "UNAUTHORIZED", message: "Sesi telah berakhir. Silakan login kembali." },
        { status: 401 }
      );
    }

    const { data: cv, error: fetchError } = await supabase
      .from("cvs")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (fetchError || !cv) {
      return NextResponse.json(
        { code: "NOT_FOUND", message: "Dokumen CV tidak ditemukan." },
        { status: 404 }
      );
    }

    // Check if CV has an active paid order
    const { data: order } = await supabase
      .from("orders")
      .select("status, revisions_used, max_revisions")
      .eq("cv_id", id)
      .eq("status", "PAID")
      .maybeSingle();

    return NextResponse.json({
      cv,
      isPaid: order?.status === "PAID",
      revisionsUsed: order?.revisions_used || 0,
      maxRevisions: order?.max_revisions || 3,
    });
  } catch (error) {
    console.error("Error in GET /api/cv/[id]:", error);
    return NextResponse.json(
      { code: "INTERNAL_SERVER_ERROR", message: "Terjadi kesalahan internal pada server." },
      { status: 500 }
    );
  }
}

// PATCH: Autosave CV draft (debounced + optimistic concurrency control)
export async function PATCH(request: Request, props: RouteParams) {
  try {
    const { id } = await props.params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { code: "UNAUTHORIZED", message: "Sesi telah berakhir. Silakan login kembali." },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Verify existing document ownership
    const { data: existingCv, error: checkError } = await supabase
      .from("cvs")
      .select("id, version, updated_at")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (checkError || !existingCv) {
      return NextResponse.json(
        { code: "NOT_FOUND", message: "Dokumen CV tidak ditemukan." },
        { status: 404 }
      );
    }

    // Optimistic locking: verify version matches if provided by client
    if (body.version !== undefined && typeof body.version === "number") {
      if (body.version !== existingCv.version) {
        return NextResponse.json(
          {
            code: "VERSION_CONFLICT",
            message: "Dokumen telah diperbarui di sesi lain. Silakan muat ulang data terbaru.",
            serverVersion: existingCv.version,
          },
          { status: 409 }
        );
      }
    }

    // Validate incoming data schema if full data payload is provided
    if (body.data) {
      const validation = cvDraftSchema.safeParse(body.data);
      if (!validation.success) {
        return NextResponse.json(
          {
            code: "VALIDATION_ERROR",
            message: "Format data CV tidak valid.",
            details: validation.error.format(),
          },
          { status: 400 }
        );
      }
    }

    const nextVersion = (existingCv.version || 1) + 1;
    const updatePayload: CvUpdate = {
      updated_at: new Date().toISOString(),
      version: nextVersion,
    };

    if (body.title !== undefined) updatePayload.title = body.title;
    if (body.data !== undefined) updatePayload.data = body.data;
    if (body.language !== undefined) updatePayload.language = body.language;
    if (body.target_position !== undefined) updatePayload.target_position = body.target_position;
    if (body.target_company !== undefined) updatePayload.target_company = body.target_company;
    if (body.job_description !== undefined) updatePayload.job_description = body.job_description;

    const { data: updatedCv, error: updateError } = await supabase
      .from("cvs")
      .update(updatePayload)
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id, title, updated_at, version, data")
      .single();

    if (updateError) {
      console.error("Error updating CV:", updateError);
      return NextResponse.json(
        { code: "UPDATE_FAILED", message: "Gagal menyimpan perubahan ke database." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      cv: updatedCv,
    });
  } catch (error) {
    console.error("Error in PATCH /api/cv/[id]:", error);
    return NextResponse.json(
      { code: "INTERNAL_SERVER_ERROR", message: "Terjadi kesalahan pada server saat menyimpan CV." },
      { status: 500 }
    );
  }
}


// DELETE: Delete CV draft
export async function DELETE(request: Request, props: RouteParams) {
  try {
    const { id } = await props.params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error: deleteError } = await supabase
      .from("cvs")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Error deleting CV:", deleteError);
      return NextResponse.json({ error: "Gagal menghapus CV" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "CV berhasil dihapus" });
  } catch (error) {
    console.error("Error in DELETE /api/cv/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
