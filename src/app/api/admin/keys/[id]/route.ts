import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRole, logAdminAction } from "@/lib/admin/admin-guard";
import { updateApiKey, deleteApiKey } from "@/lib/admin/api-key-manager";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdminRole(req);
  if (!admin) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    await updateApiKey(id, body);

    await logAdminAction({
      userId: admin.id,
      action: "update_api_key",
      targetType: "api_keys",
      targetId: id,
      ipHash: admin.ipHash,
      details: body,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Gagal memperbarui key";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdminRole(req);
  if (!admin) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const { id } = await params;

  try {
    await deleteApiKey(id);

    await logAdminAction({
      userId: admin.id,
      action: "delete_api_key",
      targetType: "api_keys",
      targetId: id,
      ipHash: admin.ipHash,
      details: { deletedAt: new Date().toISOString() },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Gagal menghapus key";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
