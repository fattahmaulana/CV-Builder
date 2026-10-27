import { createAdminClient } from "@/lib/supabase/admin";
import type { AdminOrder, RevenueStats } from "@/types/admin";

/**
 * Loads and aggregates orders, customer profiles, CV titles, and financial statistics
 * for the Admin Control Panel.
 */
export async function getAdminOrdersData(): Promise<{
  orders: AdminOrder[];
  stats: RevenueStats;
}> {
  const supabase = createAdminClient();

  // 1. Fetch all orders
  const { data: rawOrders, error: ordersError } = await supabase
    .from("orders")
    .select(
      "id, user_id, cv_id, invoice_number, amount, currency, status, payment_method, doku_reference, paid_at, created_at, updated_at"
    )
    .order("created_at", { ascending: false });

  if (ordersError) {
    console.error("Error fetching admin orders:", ordersError);
    return {
      orders: [],
      stats: {
        totalRevenue: 0,
        totalPaidOrders: 0,
        totalPendingOrders: 0,
        totalFailedOrders: 0,
        uniquePaidUsers: 0,
      },
    };
  }

  // 2. Fetch profiles to match user details
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, full_name");

  // 3. Fetch CVs to match CV title
  const { data: cvs } = await supabase.from("cvs").select("id, title");

  const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
  const cvMap = new Map((cvs || []).map((c) => [c.id, c.title]));

  const orders: AdminOrder[] = (rawOrders || []).map((o) => {
    const prof = profileMap.get(o.user_id);
    return {
      id: o.id,
      user_id: o.user_id,
      cv_id: o.cv_id,
      invoice_number: o.invoice_number,
      amount: Number(o.amount) || 0,
      currency: o.currency || "IDR",
      status: o.status,
      payment_method: o.payment_method,
      doku_reference: o.doku_reference,
      paid_at: o.paid_at,
      created_at: o.created_at,
      updated_at: o.updated_at,
      user_email: prof?.email || "Unknown User",
      user_name: prof?.full_name || "Kandidat",
      cv_title: cvMap.get(o.cv_id) || "CV Tanpa Judul",
    };
  });

  const paidOrders = orders.filter((o) => o.status === "PAID");
  const pendingOrders = orders.filter((o) => o.status === "PENDING");
  const failedOrders = orders.filter(
    (o) => o.status === "FAILED" || o.status === "EXPIRED"
  );

  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.amount, 0);
  const uniqueUserIds = new Set(paidOrders.map((o) => o.user_id));

  const stats: RevenueStats = {
    totalRevenue,
    totalPaidOrders: paidOrders.length,
    totalPendingOrders: pendingOrders.length,
    totalFailedOrders: failedOrders.length,
    uniquePaidUsers: uniqueUserIds.size,
  };

  return { orders, stats };
}
