import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRole, logAdminAction } from "@/lib/admin/admin-guard";
import { listApiKeys, addApiKey, ApiKeyProvider } from "@/lib/admin/api-key-manager";

export async function GET(req: NextRequest) {
  const admin = await verifyAdminRole(req);
  if (!admin) {
    return NextResponse.json({ error: "Akses ditolak: Hanya untuk administrator" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const provider = (searchParams.get("provider") || "gemini") as ApiKeyProvider;

  try {
    const keys = await listApiKeys(provider);
    return NextResponse.json({ keys });
  } catch (error: unknown) {
    console.error("GET /api/admin/keys error:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const admin = await verifyAdminRole(req);
  if (!admin) {
    return NextResponse.json({ error: "Akses ditolak: Hanya untuk administrator" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { provider = "gemini", label, plainKey, priority = 1, weight = 1 } = body;

    if (!plainKey) {
      return NextResponse.json({ error: "Field plainKey wajib diisi" }, { status: 400 });
    }

    const newKey = await addApiKey({
      provider: provider as ApiKeyProvider,
      label: label || `Key ...${plainKey.slice(-4)}`,
      plainKey,
      priority: Number(priority),
      weight: Number(weight),
      userId: admin.id,
    });

    await logAdminAction({
      userId: admin.id,
      action: "create_api_key",
      targetType: "api_keys",
      targetId: newKey.id,
      ipHash: admin.ipHash,
      details: {
        provider,
        label: newKey.label,
        last_four_chars: newKey.last_four_chars,
        priority: newKey.priority,
      },
    });

    return NextResponse.json({ key: newKey }, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/admin/keys error:", error);
    const msg = error instanceof Error ? error.message : "Gagal menambahkan API key";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
