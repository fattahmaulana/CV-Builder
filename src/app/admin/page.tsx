import { Metadata } from "next";
import { redirect } from "next/navigation";
import { verifyAdminRole } from "@/lib/admin/admin-guard";
import { listApiKeys } from "@/lib/admin/api-key-manager";
import { getAdminOrdersData } from "@/lib/admin/admin-orders";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminDashboard, AuditLog, FeatureFlag, AppSetting } from "@/components/admin/AdminDashboard";

export const metadata: Metadata = {
  title: "Pusat Kendali Admin | CVBuilder",
  description: "Manajemen internal API key, feature flags, transaksi, dan audit logs.",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
  },
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await verifyAdminRole();

  if (!admin) {
    redirect("/auth/login?next=/admin");
  }

  // Load initial dashboard state
  const supabase = createAdminClient();

  const [keys, flagsRes, settingsRes, logsRes, ordersData] = await Promise.all([
    listApiKeys("gemini"),
    supabase.from("feature_flags").select("*").order("key", { ascending: true }),
    supabase.from("app_settings").select("*").order("key", { ascending: true }),
    supabase
      .from("admin_audit_log")
      .select("id, user_id, action, target_type, target_id, ip_hash, details, created_at")
      .order("created_at", { ascending: false })
      .limit(50),
    getAdminOrdersData(),
  ]);

  return (
    <AdminDashboard
      adminEmail={admin.email}
      initialKeys={keys}
      initialFlags={(flagsRes.data as FeatureFlag[]) || []}
      initialSettings={(settingsRes.data as AppSetting[]) || []}
      initialLogs={(logsRes.data as unknown as AuditLog[]) || []}
      initialOrders={ordersData.orders}
      initialRevenueStats={ordersData.stats}
    />
  );
}

