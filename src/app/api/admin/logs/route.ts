import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRole } from "@/lib/admin/admin-guard";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const admin = await verifyAdminRole(req);
  if (!admin) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("admin_audit_log")
    .select("id, user_id, action, target_type, target_id, ip_hash, details, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ logs: data });
}
