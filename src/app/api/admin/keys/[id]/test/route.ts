import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRole, logAdminAction } from "@/lib/admin/admin-guard";
import { testApiKey } from "@/lib/admin/api-key-manager";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdminRole(req);
  if (!admin) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const result = await testApiKey(id);

    await logAdminAction({
      userId: admin.id,
      action: "test_api_key",
      targetType: "api_keys",
      targetId: id,
      ipHash: admin.ipHash,
      details: result,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Gagal menguji key";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
