import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRole } from "@/lib/admin/admin-guard";
import { getAdminOrdersData } from "@/lib/admin/admin-orders";

export async function GET(req: NextRequest) {
  const admin = await verifyAdminRole(req);
  if (!admin) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  try {
    const data = await getAdminOrdersData();
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("Error in GET /api/admin/orders:", error);
    const message = error instanceof Error ? error.message : "Gagal mengambil data transaksi";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
