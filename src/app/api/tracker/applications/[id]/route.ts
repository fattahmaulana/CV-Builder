import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Database } from "@/lib/supabase/types";

type ApplicationUpdate = Database["public"]["Tables"]["applications"]["Update"];

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, props: RouteParams) {
  try {
    const { id } = await props.params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Sesi login tidak sah" }, { status: 401 });
    }

    const body = await request.json();
    const updatePayload: ApplicationUpdate = {
      updated_at: new Date().toISOString(),
    };

    if (body.company) updatePayload.company = body.company.trim();
    if (body.position) updatePayload.position = body.position.trim();
    if (body.status) updatePayload.status = body.status;
    if (body.applied_date !== undefined) updatePayload.applied_date = body.applied_date;
    if (body.job_url !== undefined) updatePayload.job_url = body.job_url;
    if (body.notes !== undefined) updatePayload.notes = body.notes;

    const { data: updatedApp, error: updateError } = await supabase
      .from("applications")
      .update(updatePayload)
      .eq("id", id)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (updateError || !updatedApp) {
      console.error("Error updating application:", updateError);
      return NextResponse.json({ error: "Gagal memperbarui lamaran" }, { status: 500 });
    }

    return NextResponse.json({ application: updatedApp });
  } catch (error) {
    console.error("PATCH /api/tracker/applications/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, props: RouteParams) {
  try {
    const { id } = await props.params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Sesi login tidak sah" }, { status: 401 });
    }

    const { error: deleteError } = await supabase
      .from("applications")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Error deleting application:", deleteError);
      return NextResponse.json({ error: "Gagal menghapus lamaran" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/tracker/applications/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
