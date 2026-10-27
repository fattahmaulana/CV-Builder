import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRole, logAdminAction } from "@/lib/admin/admin-guard";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const admin = await verifyAdminRole(req);
  if (!admin) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("feature_flags")
    .select("*")
    .order("key", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ flags: data });
}

export async function PATCH(req: NextRequest) {
  const admin = await verifyAdminRole(req);
  if (!admin) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  try {
    const { key, enabled } = await req.json();
    if (!key || typeof enabled !== "boolean") {
      return NextResponse.json({ error: "Key dan enabled (boolean) wajib dikirim" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase
      .from("feature_flags")
      .update({
        enabled,
        updated_by: admin.id,
        updated_at: new Date().toISOString(),
      })
      .eq("key", key);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAdminAction({
      userId: admin.id,
      action: "toggle_feature_flag",
      targetType: "feature_flags",
      targetId: key,
      ipHash: admin.ipHash,
      details: { enabled },
    });

    return NextResponse.json({ success: true, key, enabled });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
