import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { getAdminOrdersData } from "@/lib/admin/admin-orders";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import type { AdminOrder, RevenueStats } from "@/types/admin";

// Mock Supabase admin client
vi.mock("@/lib/supabase/admin", () => {
  return {
    createAdminClient: vi.fn(() => ({
      from: vi.fn((table: string) => {
        if (table === "orders") {
          return {
            select: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({
              data: [
                {
                  id: "order-1",
                  user_id: "user-101",
                  cv_id: "cv-201",
                  invoice_number: "INV-CVK-TEST-001",
                  amount: 5000,
                  currency: "IDR",
                  status: "PAID",
                  payment_method: "QRIS",
                  doku_reference: "DOKU-REF-111",
                  paid_at: "2026-10-27T10:00:00.000Z",
                  created_at: "2026-10-27T09:55:00.000Z",
                },
                {
                  id: "order-2",
                  user_id: "user-102",
                  cv_id: "cv-202",
                  invoice_number: "INV-CVK-TEST-002",
                  amount: 5000,
                  currency: "IDR",
                  status: "PAID",
                  payment_method: "BCA_VA",
                  doku_reference: "DOKU-REF-222",
                  paid_at: "2026-10-27T11:00:00.000Z",
                  created_at: "2026-10-27T10:50:00.000Z",
                },
                {
                  id: "order-3",
                  user_id: "user-103",
                  cv_id: "cv-203",
                  invoice_number: "INV-CVK-TEST-003",
                  amount: 5000,
                  currency: "IDR",
                  status: "PENDING",
                  payment_method: null,
                  doku_reference: null,
                  paid_at: null,
                  created_at: "2026-10-27T12:00:00.000Z",
                },
              ],
              error: null,
            }),
          };
        }
        if (table === "profiles") {
          return {
            select: vi.fn().mockResolvedValue({
              data: [
                { id: "user-101", email: "user1@example.com", full_name: "Budi Pratama" },
                { id: "user-102", email: "user2@example.com", full_name: "Siti Rahma" },
                { id: "user-103", email: "user3@example.com", full_name: "Ahmad Fauzi" },
              ],
              error: null,
            }),
          };
        }
        if (table === "cvs") {
          return {
            select: vi.fn().mockResolvedValue({
              data: [
                { id: "cv-201", title: "CV Frontend Developer" },
                { id: "cv-202", title: "CV Data Analyst" },
                { id: "cv-203", title: "CV Marketing Specialist" },
              ],
              error: null,
            }),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
        };
      }),
    })),
  };
});

describe("Admin Orders & Revenue Management Feature", () => {
  it("should aggregate orders, join profiles & cvs, and accurately calculate total revenue", async () => {
    const { orders, stats } = await getAdminOrdersData();

    expect(orders.length).toBe(3);

    // Order 1 (PAID)
    expect(orders[0].user_email).toBe("user1@example.com");
    expect(orders[0].user_name).toBe("Budi Pratama");
    expect(orders[0].cv_title).toBe("CV Frontend Developer");
    expect(orders[0].status).toBe("PAID");

    // Order 2 (PAID)
    expect(orders[1].user_email).toBe("user2@example.com");
    expect(orders[1].status).toBe("PAID");

    // Order 3 (PENDING)
    expect(orders[2].user_email).toBe("user3@example.com");
    expect(orders[2].status).toBe("PENDING");

    // Financial & Customer Statistics
    // 2 orders of 5000 IDR = 10000 IDR
    expect(stats.totalRevenue).toBe(10000);
    expect(stats.totalPaidOrders).toBe(2);
    expect(stats.totalPendingOrders).toBe(1);
    expect(stats.uniquePaidUsers).toBe(2);
  });

  it("should render Tab 05 Transaksi & Pendapatan with Neobrutalist design and accurate stats", () => {
    const sampleOrders: AdminOrder[] = [
      {
        id: "order-1",
        user_id: "user-101",
        cv_id: "cv-201",
        invoice_number: "INV-CVK-TEST-001",
        amount: 5000,
        currency: "IDR",
        status: "PAID",
        payment_method: "QRIS",
        doku_reference: "DOKU-REF-111",
        paid_at: "2026-10-27T10:00:00.000Z",
        created_at: "2026-10-27T09:55:00.000Z",
        user_email: "budi@example.com",
        user_name: "Budi Pratama",
        cv_title: "CV Frontend Developer",
      },
    ];

    const sampleStats: RevenueStats = {
      totalRevenue: 5000,
      totalPaidOrders: 1,
      totalPendingOrders: 0,
      totalFailedOrders: 0,
      uniquePaidUsers: 1,
    };

    const html = renderToStaticMarkup(
      React.createElement(AdminDashboard, {
        adminEmail: "admin@cvbuilder.id",
        initialKeys: [],
        initialFlags: [],
        initialSettings: [],
        initialLogs: [],
        initialOrders: sampleOrders,
        initialRevenueStats: sampleStats,
      })
    );

    // Verify Tab 05 button
    expect(html).toContain("05 Transaksi &amp; Pendapatan");
    expect(html).toContain("(1)");
  });
});
