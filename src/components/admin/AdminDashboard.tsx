"use client";

import * as React from "react";
import Link from "next/link";
import type { ApiKeyRecord, ApiKeyStatus, AdminOrder, RevenueStats } from "@/types/admin";
import { Button } from "@/components/ui/button";
import {
  Key,
  Shield,
  Activity,
  Sliders,
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowLeft,
  X,
  Zap,
  Server,
  Lock,
  Coins,
  Users,
  CreditCard,
  Search,
  RefreshCw,
  FileText,
} from "lucide-react";


export interface FeatureFlag {
  key: string;
  enabled: boolean;
  description: string | null;
}

export interface AppSetting {
  key: string;
  value: unknown;
  description: string | null;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  ip_hash: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

interface AdminDashboardProps {
  adminEmail: string;
  initialKeys: ApiKeyRecord[];
  initialFlags: FeatureFlag[];
  initialSettings: AppSetting[];
  initialLogs: AuditLog[];
  initialOrders?: AdminOrder[];
  initialRevenueStats?: RevenueStats;
}

export function AdminDashboard({
  adminEmail,
  initialKeys,
  initialFlags,
  initialSettings,
  initialLogs,
  initialOrders = [],
  initialRevenueStats = {
    totalRevenue: 0,
    totalPaidOrders: 0,
    totalPendingOrders: 0,
    totalFailedOrders: 0,
    uniquePaidUsers: 0,
  },
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = React.useState<
    "keys" | "flags" | "settings" | "logs" | "payments"
  >("keys");
  const [keys, setKeys] = React.useState<ApiKeyRecord[]>(initialKeys);
  const [flags, setFlags] = React.useState<FeatureFlag[]>(initialFlags);
  const [settings, setSettings] = React.useState<AppSetting[]>(initialSettings);
  const [logs, setLogs] = React.useState<AuditLog[]>(initialLogs);

  // Orders & Revenue state
  const [orders, setOrders] = React.useState<AdminOrder[]>(initialOrders);
  const [revenueStats, setRevenueStats] = React.useState<RevenueStats>(initialRevenueStats);
  const [isRefreshingOrders, setIsRefreshingOrders] = React.useState(false);
  const [orderSearchQuery, setOrderSearchQuery] = React.useState("");
  const [orderStatusFilter, setOrderStatusFilter] = React.useState<
    "ALL" | "PAID" | "PENDING" | "FAILED"
  >("ALL");

  // Modal State for adding new API key
  const [isAddKeyOpen, setIsAddKeyOpen] = React.useState(false);
  const [newKeyLabel, setNewKeyLabel] = React.useState("");
  const [newPlainKey, setNewPlainKey] = React.useState("");
  const [newPriority, setNewPriority] = React.useState(1);
  const [isAddingKey, setIsAddingKey] = React.useState(false);


  // Key Test state
  const [testingKeyId, setTestingKeyId] = React.useState<string | null>(null);
  const [testResults, setTestResults] = React.useState<Record<string, { success: boolean; latencyMs: number; error?: string }>>({});

  // Feature flag toggling
  const handleToggleFlag = async (flagKey: string, currentEnabled: boolean) => {
    const nextEnabled = !currentEnabled;
    setFlags((prev) =>
      prev.map((f) => (f.key === flagKey ? { ...f, enabled: nextEnabled } : f))
    );

    try {
      const res = await fetch("/api/admin/flags", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: flagKey, enabled: nextEnabled }),
      });
      if (!res.ok) throw new Error("Gagal mengubah feature flag");
    } catch (err) {
      console.error(err);
      // Revert on failure
      setFlags((prev) =>
        prev.map((f) => (f.key === flagKey ? { ...f, enabled: currentEnabled } : f))
      );
    }
  };

  // Test an API Key
  const handleTestKey = async (id: string) => {
    setTestingKeyId(id);
    try {
      const res = await fetch(`/api/admin/keys/${id}/test`, { method: "POST" });
      const json = await res.json();
      setTestResults((prev) => ({
        ...prev,
        [id]: {
          success: json.success,
          latencyMs: json.latencyMs,
          error: json.error,
        },
      }));

      // Update key status in list if changed
      if (json.status) {
        setKeys((prev) =>
          prev.map((k) => (k.id === id ? { ...k, status: json.status } : k))
        );
      }
    } catch (err: unknown) {
      setTestResults((prev) => ({
        ...prev,
        [id]: {
          success: false,
          latencyMs: 0,
          error: err instanceof Error ? err.message : "Test request failed",
        },
      }));
    } finally {
      setTestingKeyId(null);
    }
  };

  // Add new API key
  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlainKey.trim()) return;

    setIsAddingKey(true);
    try {
      const res = await fetch("/api/admin/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "gemini",
          label: newKeyLabel.trim(),
          plainKey: newPlainKey.trim(),
          priority: newPriority,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan key");

      setKeys((prev) => [json.key, ...prev]);
      setIsAddKeyOpen(false);
      setNewKeyLabel("");
      setNewPlainKey("");
      setNewPriority(1);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Gagal menambahkan API key");
    } finally {
      setIsAddingKey(false);
    }
  };

  // Delete key
  const handleDeleteKey = async (id: string) => {
    if (!confirm("Hapus API key ini secara permanen?")) return;

    try {
      const res = await fetch(`/api/admin/keys/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus key");
      setKeys((prev) => prev.filter((k) => k.id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Gagal menghapus");
    }
  };

  // Toggle key status active/inactive
  const handleToggleKeyStatus = async (id: string, currentStatus: ApiKeyStatus) => {
    const nextStatus: ApiKeyStatus = currentStatus === "aktif" ? "nonaktif" : "aktif";
    try {
      const res = await fetch(`/api/admin/keys/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error("Gagal mengubah status");
      setKeys((prev) =>
        prev.map((k) => (k.id === id ? { ...k, status: nextStatus } : k))
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Gagal mengubah status");
    }
  };

  // Refresh Orders & Revenue
  const handleRefreshOrders = async () => {
    setIsRefreshingOrders(true);
    try {
      const res = await fetch("/api/admin/orders");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memuat data transaksi");
      setOrders(json.orders || []);
      if (json.stats) setRevenueStats(json.stats);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Gagal memuat transaksi");
    } finally {
      setIsRefreshingOrders(false);
    }
  };

  // Filtered orders list
  const filteredOrders = React.useMemo(() => {
    return orders.filter((order) => {
      const q = orderSearchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        order.user_email.toLowerCase().includes(q) ||
        order.user_name.toLowerCase().includes(q) ||
        order.invoice_number.toLowerCase().includes(q) ||
        (order.doku_reference && order.doku_reference.toLowerCase().includes(q)) ||
        order.cv_title.toLowerCase().includes(q);

      const matchesStatus =
        orderStatusFilter === "ALL" ||
        (orderStatusFilter === "PAID" && order.status === "PAID") ||
        (orderStatusFilter === "PENDING" && order.status === "PENDING") ||
        (orderStatusFilter === "FAILED" &&
          (order.status === "FAILED" || order.status === "EXPIRED"));

      return matchesSearch && matchesStatus;
    });
  }, [orders, orderSearchQuery, orderStatusFilter]);


  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col font-[family-name:var(--font-body)]">
      {/* Top Admin Action Header */}
      <header className="sticky top-0 z-40 bg-[var(--accent)] border-b-[3px] border-black px-4 sm:px-6 py-3.5 shadow-[0_3px_0_0_#000]">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-2 rounded-[3px] border-2 border-black bg-white hover:bg-neutral-100 text-black hard-drop-sm transition-transform cursor-pointer"
              title="Kembali ke Dashboard Pengguna"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>

            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold uppercase bg-black text-white px-2 py-0.5 rounded-[2px]">
                ADMIN
              </span>
              <h1 className="text-base sm:text-lg font-black font-[family-name:var(--font-heading)] text-black">
                Panel Pusat Kendali CVBuilder
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-[3px] bg-white border-2 border-black text-xs font-mono font-bold shadow-[2px_2px_0_0_#000]">
              <Shield className="h-3.5 w-3.5 text-black" />
              <span>{adminEmail}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Admin Content Layout */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab("keys")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-[3px] text-xs font-bold border-2 transition-transform cursor-pointer ${
              activeTab === "keys"
                ? "bg-[var(--accent)] text-black border-black shadow-[3px_3px_0_0_#000]"
                : "bg-white text-black border-black hard-drop-sm hover:bg-neutral-100"
            }`}
          >
            <Key className="h-4 w-4" />
            <span>01 API Key Manager ({keys.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("flags")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-[3px] text-xs font-bold border-2 transition-transform cursor-pointer ${
              activeTab === "flags"
                ? "bg-[var(--accent)] text-black border-black shadow-[3px_3px_0_0_#000]"
                : "bg-white text-black border-black hard-drop-sm hover:bg-neutral-100"
            }`}
          >
            <Sliders className="h-4 w-4" />
            <span>02 Feature Flags ({flags.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-[3px] text-xs font-bold border-2 transition-transform cursor-pointer ${
              activeTab === "settings"
                ? "bg-[var(--accent)] text-black border-black shadow-[3px_3px_0_0_#000]"
                : "bg-white text-black border-black hard-drop-sm hover:bg-neutral-100"
            }`}
          >
            <Server className="h-4 w-4" />
            <span>03 Pengaturan Sistem ({settings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("logs")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-[3px] text-xs font-bold border-2 transition-transform cursor-pointer ${
              activeTab === "logs"
                ? "bg-[var(--accent)] text-black border-black shadow-[3px_3px_0_0_#000]"
                : "bg-white text-black border-black hard-drop-sm hover:bg-neutral-100"
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>04 Audit Log ({logs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("payments")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-[3px] text-xs font-bold border-2 transition-transform cursor-pointer ${
              activeTab === "payments"
                ? "bg-[var(--accent)] text-black border-black shadow-[3px_3px_0_0_#000]"
                : "bg-white text-black border-black hard-drop-sm hover:bg-neutral-100"
            }`}
          >
            <Coins className="h-4 w-4" />
            <span>
              05 Transaksi &amp; Pendapatan (
              {orders.filter((o) => o.status === "PAID").length})
            </span>
          </button>
        </div>

        {/* TAB 1: API KEY MANAGER */}
        {activeTab === "keys" && (
          <div className="space-y-4">
            {/* Header Action Bar */}
            <div className="bg-[var(--surface)] border-[3px] border-black rounded-[3px] p-4 sm:p-5 shadow-[4px_4px_0_0_#000] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-base font-black font-[family-name:var(--font-heading)] text-black flex items-center gap-2">
                  <Key className="h-5 w-5 text-black" />
                  <span>Manajemen API Key Google Gemini (AES-256-GCM)</span>
                </h2>
                <p className="text-xs text-neutral-700 mt-1">
                  Kunci dienkripsi dengan standar militer AES-256-GCM. Sistem otomatis merotasi kunci (least-used) dan melakukan cooldown 60 detik jika terkena HTTP 429.
                </p>
              </div>

              <button
                onClick={() => setIsAddKeyOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold border-2 border-black rounded-[3px] bg-[var(--accent)] hover:bg-yellow-300 text-black hard-drop-sm cursor-pointer shrink-0"
              >
                <Plus className="h-4 w-4 text-black" />
                <span>Tambah API Key Baru</span>
              </button>
            </div>

            {/* Keys Table Container */}
            <div className="bg-[var(--surface)] border-[3px] border-black rounded-[3px] shadow-[5px_5px_0_0_#000] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b-2 border-black bg-neutral-100 font-black text-black uppercase tracking-wider font-mono">
                      <th className="p-3">Label &amp; Provider</th>
                      <th className="p-3">Masked Key</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Prioritas</th>
                      <th className="p-3">Statistik Hari Ini</th>
                      <th className="p-3">Terakhir Digunakan</th>
                      <th className="p-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-neutral-200">
                    {keys.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-neutral-600 font-semibold">
                          Belum ada API key di database. Klik tombol &quot;Tambah API Key Baru&quot; di atas. Sistem saat ini fallback ke GEMINI_API_KEY dari environment variable.
                        </td>
                      </tr>
                    ) : (
                      keys.map((k) => {
                        const testResult = testResults[k.id];
                        const isTesting = testingKeyId === k.id;

                        return (
                          <tr key={k.id} className="hover:bg-amber-50/50 transition-colors">
                            <td className="p-3 font-bold text-black">
                              <div>{k.label}</div>
                              <span className="text-[10px] font-mono text-neutral-500 uppercase">
                                {k.provider}
                              </span>
                            </td>

                            <td className="p-3 font-mono font-bold text-black">
                              <span className="px-2 py-0.5 rounded-[2px] bg-neutral-100 border border-black">
                                {k.masked_key}
                              </span>
                            </td>

                            <td className="p-3">
                              {k.status === "aktif" && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-bold border-2 border-black bg-emerald-300 text-black shadow-[2px_2px_0_0_#000]">
                                  <CheckCircle2 className="h-3 w-3 text-black" />
                                  <span>Aktif</span>
                                </span>
                              )}
                              {k.status === "cooldown" && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-bold border-2 border-black bg-[var(--accent)] text-black shadow-[2px_2px_0_0_#000]">
                                  <Clock className="h-3 w-3 text-black animate-spin" />
                                  <span>Cooldown 60s</span>
                                </span>
                              )}
                              {k.status === "tidak_valid" && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-bold border-2 border-black bg-rose-300 text-black shadow-[2px_2px_0_0_#000]">
                                  <AlertTriangle className="h-3 w-3 text-black" />
                                  <span>Tidak Valid</span>
                                </span>
                              )}
                              {k.status === "habis" && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-bold border-2 border-black bg-neutral-300 text-black">
                                  <span>Kuota Habis</span>
                                </span>
                              )}
                              {k.status === "nonaktif" && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-bold border-2 border-black bg-neutral-200 text-neutral-600">
                                  <span>Nonaktif</span>
                                </span>
                              )}
                            </td>

                            <td className="p-3 font-mono font-bold text-black">
                              Level {k.priority}
                            </td>

                            <td className="p-3 font-mono text-[11px]">
                              <div>
                                Req: <strong className="text-black">{k.requests_today}</strong> | Err:{" "}
                                <strong className="text-rose-700">{k.errors_today}</strong>
                              </div>
                              {k.last_error && (
                                <div className="text-[10px] text-rose-700 truncate max-w-xs mt-0.5">
                                  {k.last_error}
                                </div>
                              )}
                            </td>

                            <td className="p-3 text-[11px] text-neutral-700 font-mono">
                              {k.last_used_at
                                ? new Date(k.last_used_at).toLocaleTimeString("id-ID")
                                : "Belum ada"}
                            </td>

                            <td className="p-3 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                {/* Test Button */}
                                <button
                                  onClick={() => handleTestKey(k.id)}
                                  disabled={isTesting}
                                  className="px-2.5 py-1 text-[11px] font-bold border-2 border-black rounded-[3px] bg-white hover:bg-[var(--accent)] text-black hard-drop-sm cursor-pointer disabled:opacity-50"
                                  title="Tes koneksi ke Gemini API"
                                >
                                  {isTesting ? (
                                    <Clock className="h-3.5 w-3.5 animate-spin" />
                                  ) : testResult ? (
                                    testResult.success ? (
                                      <span className="text-emerald-800 font-mono">
                                        ✓ {testResult.latencyMs}ms
                                      </span>
                                    ) : (
                                      <span className="text-rose-700 font-mono">✗ Gagal</span>
                                    )
                                  ) : (
                                    <span className="flex items-center gap-1">
                                      <Zap className="h-3 w-3" />
                                      Tes
                                    </span>
                                  )}
                                </button>

                                {/* Toggle Active Button */}
                                <button
                                  onClick={() => handleToggleKeyStatus(k.id, k.status)}
                                  className="px-2 py-1 text-[11px] font-bold border-2 border-black rounded-[3px] bg-neutral-100 hover:bg-neutral-200 text-black hard-drop-sm cursor-pointer"
                                >
                                  {k.status === "aktif" ? "Matikan" : "Aktifkan"}
                                </button>

                                {/* Delete Button */}
                                <button
                                  onClick={() => handleDeleteKey(k.id)}
                                  className="p-1 border-2 border-black rounded-[3px] bg-white hover:bg-rose-200 text-rose-700 hard-drop-sm cursor-pointer"
                                  title="Hapus Key"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FEATURE FLAGS */}
        {activeTab === "flags" && (
          <div className="bg-[var(--surface)] border-[3px] border-black rounded-[3px] p-6 shadow-[5px_5px_0_0_#000] space-y-4">
            <div>
              <h2 className="text-base font-black font-[family-name:var(--font-heading)] text-black flex items-center gap-2">
                <Sliders className="h-5 w-5 text-black" />
                <span>Feature Flags (Dynamic Runtime Toggles)</span>
              </h2>
              <p className="text-xs text-neutral-700 mt-1">
                Aktifkan atau nonaktifkan fitur platform secara real-time tanpa perlu deployment ulang kode.
              </p>
            </div>

            <div className="divide-y-2 divide-neutral-200">
              {flags.map((flag) => (
                <div key={flag.key} className="py-4 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-mono font-black text-sm text-black">{flag.key}</h3>
                    <p className="text-xs text-neutral-700 mt-0.5">{flag.description}</p>
                  </div>

                  <button
                    onClick={() => handleToggleFlag(flag.key, flag.enabled)}
                    className={`px-4 py-1.5 text-xs font-mono font-black border-2 border-black rounded-[3px] hard-drop-sm cursor-pointer transition-all ${
                      flag.enabled
                        ? "bg-emerald-300 text-black shadow-[2px_2px_0_0_#000]"
                        : "bg-neutral-200 text-neutral-700"
                    }`}
                  >
                    {flag.enabled ? "STATUS: ON" : "STATUS: OFF"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: APP SETTINGS */}
        {activeTab === "settings" && (
          <div className="bg-[var(--surface)] border-[3px] border-black rounded-[3px] p-6 shadow-[5px_5px_0_0_#000] space-y-4">
            <div>
              <h2 className="text-base font-black font-[family-name:var(--font-heading)] text-black flex items-center gap-2">
                <Server className="h-5 w-5 text-black" />
                <span>Pengaturan Sistem &amp; Model AI</span>
              </h2>
              <p className="text-xs text-neutral-700 mt-1">
                Parameter global aplikasi yang tersimpan di basis data `app_settings`.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {settings.map((item) => (
                <div
                  key={item.key}
                  className="p-4 border-2 border-black rounded-[3px] bg-amber-50/50 shadow-[3px_3px_0_0_#000] space-y-1"
                >
                  <span className="font-mono font-bold text-xs uppercase text-neutral-500">
                    {item.key}
                  </span>
                  <div className="font-mono font-black text-sm text-black">
                    {typeof item.value === "object" ? JSON.stringify(item.value) : String(item.value)}
                  </div>
                  <p className="text-[11px] text-neutral-700">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: AUDIT LOG */}
        {activeTab === "logs" && (
          <div className="bg-[var(--surface)] border-[3px] border-black rounded-[3px] p-6 shadow-[5px_5px_0_0_#000] space-y-4">
            <div>
              <h2 className="text-base font-black font-[family-name:var(--font-heading)] text-black flex items-center gap-2">
                <Activity className="h-5 w-5 text-black" />
                <span>Audit Log Aktivitas Administrator</span>
              </h2>
              <p className="text-xs text-neutral-700 mt-1">
                Catatan kekal (immutable) tindakan administratif: siapa mengubah apa, kapan, dengan IP ter-hash (SHA-256) untuk kepatuhan privasi.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-black bg-neutral-100 font-mono font-black text-black uppercase">
                    <th className="p-3">Waktu (UTC)</th>
                    <th className="p-3">Tindakan</th>
                    <th className="p-3">Target</th>
                    <th className="p-3">IP Hash (SHA-256)</th>
                    <th className="p-3">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 font-mono">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-neutral-600 font-sans">
                        Belum ada riwayat aktivitas yang tercatat di audit log.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-neutral-50">
                        <td className="p-3 text-[11px]">
                          {new Date(log.created_at).toLocaleString("id-ID")}
                        </td>
                        <td className="p-3">
                          <span className="font-bold border border-black bg-[var(--accent)] px-2 py-0.5 rounded-[2px] text-black text-[10px]">
                            {log.action}
                          </span>
                        </td>
                        <td className="p-3 font-bold">
                          {log.target_type} {log.target_id ? `(${log.target_id.slice(0, 8)}...)` : ""}
                        </td>
                        <td className="p-3 text-neutral-600 text-[10px]">
                          {log.ip_hash || "unknown"}
                        </td>
                        <td className="p-3 text-[10px] text-neutral-800 max-w-xs truncate">
                          {JSON.stringify(log.details)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: TRANSAKSI & PENDAPATAN */}
        {activeTab === "payments" && (
          <div className="space-y-6">
            {/* Header Action Banner */}
            <div className="bg-[var(--surface)] border-[3px] border-black rounded-[3px] p-4 sm:p-5 shadow-[4px_4px_0_0_#000] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-base font-black font-[family-name:var(--font-heading)] text-black flex items-center gap-2">
                  <Coins className="h-5 w-5 text-black" />
                  <span>Monitoring Pendapatan &amp; Pengguna Berbayar</span>
                </h2>
                <p className="text-xs text-neutral-700 mt-1">
                  Daftar transaksi pelanggan yang telah membayar (PAID), invoice DOKU, dan kalkulasi total penerimaan kas secara real-time.
                </p>
              </div>

              <button
                onClick={handleRefreshOrders}
                disabled={isRefreshingOrders}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold border-2 border-black rounded-[3px] bg-white hover:bg-neutral-100 text-black hard-drop-sm cursor-pointer shrink-0 disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-4 w-4 text-black ${
                    isRefreshingOrders ? "animate-spin" : ""
                  }`}
                />
                <span>{isRefreshingOrders ? "Memuat..." : "Refresh Data"}</span>
              </button>
            </div>

            {/* Financial & User Summary Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Stat 1: Total Revenue */}
              <div className="bg-[#FFE500] border-[3px] border-black rounded-[3px] p-5 shadow-[4px_4px_0_0_#000] flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-black font-mono">
                    Total Pendapatan
                  </span>
                  <div className="p-2 bg-black text-[#FFE500] rounded-[2px] border border-black">
                    <Coins className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-2xl sm:text-3xl font-black font-[family-name:var(--font-heading)] text-black">
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      minimumFractionDigits: 0,
                    }).format(revenueStats.totalRevenue)}
                  </div>
                  <p className="text-[11px] font-bold text-neutral-800 mt-1">
                    Dari {revenueStats.totalPaidOrders} transaksi lunas terverifikasi
                  </p>
                </div>
              </div>

              {/* Stat 2: Total Paid Orders */}
              <div className="bg-white border-[3px] border-black rounded-[3px] p-5 shadow-[4px_4px_0_0_#000] flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-neutral-700 font-mono">
                    Transaksi Lunas
                  </span>
                  <div className="p-2 bg-emerald-100 text-emerald-800 rounded-[2px] border-2 border-black">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-2xl sm:text-3xl font-black font-[family-name:var(--font-heading)] text-black">
                    {revenueStats.totalPaidOrders}{" "}
                    <span className="text-sm font-bold text-neutral-600">Pesanan</span>
                  </div>
                  <p className="text-[11px] text-neutral-600 mt-1">
                    Status PAID &amp; hak unduh aktif
                  </p>
                </div>
              </div>

              {/* Stat 3: Unique Paid Users */}
              <div className="bg-white border-[3px] border-black rounded-[3px] p-5 shadow-[4px_4px_0_0_#000] flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-neutral-700 font-mono">
                    Pengguna Berbayar
                  </span>
                  <div className="p-2 bg-blue-100 text-blue-800 rounded-[2px] border-2 border-black">
                    <Users className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-2xl sm:text-3xl font-black font-[family-name:var(--font-heading)] text-black">
                    {revenueStats.uniquePaidUsers}{" "}
                    <span className="text-sm font-bold text-neutral-600">Kandidat</span>
                  </div>
                  <p className="text-[11px] text-neutral-600 mt-1">
                    User unik yang telah membayar
                  </p>
                </div>
              </div>

              {/* Stat 4: Pending Orders */}
              <div className="bg-white border-[3px] border-black rounded-[3px] p-5 shadow-[4px_4px_0_0_#000] flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-neutral-700 font-mono">
                    Menunggu Pembayaran
                  </span>
                  <div className="p-2 bg-amber-100 text-amber-800 rounded-[2px] border-2 border-black">
                    <Clock className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-2xl sm:text-3xl font-black font-[family-name:var(--font-heading)] text-black">
                    {revenueStats.totalPendingOrders}{" "}
                    <span className="text-sm font-bold text-neutral-600">Pesanan</span>
                  </div>
                  <p className="text-[11px] text-neutral-600 mt-1">
                    Invoice pending / belum dibayar
                  </p>
                </div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white border-[3px] border-black rounded-[3px] p-4 shadow-[4px_4px_0_0_#000] flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              {/* Search Field */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Cari email user, nama kandidat, invoice, DOKU ref, atau judul CV..."
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs border-2 border-black rounded-[3px] bg-neutral-50 text-black placeholder:text-neutral-500 focus:outline-none focus:bg-white focus:shadow-[2px_2px_0_0_#FFE500]"
                />
                {orderSearchQuery && (
                  <button
                    onClick={() => setOrderSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-black p-0.5"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setOrderStatusFilter("ALL")}
                  className={`px-3 py-1.5 text-xs font-bold border-2 border-black rounded-[3px] transition-transform cursor-pointer ${
                    orderStatusFilter === "ALL"
                      ? "bg-black text-white shadow-[2px_2px_0_0_#FFE500]"
                      : "bg-white text-black hover:bg-neutral-100"
                  }`}
                >
                  Semua ({orders.length})
                </button>
                <button
                  onClick={() => setOrderStatusFilter("PAID")}
                  className={`px-3 py-1.5 text-xs font-bold border-2 border-black rounded-[3px] transition-transform cursor-pointer ${
                    orderStatusFilter === "PAID"
                      ? "bg-emerald-300 text-black shadow-[2px_2px_0_0_#000]"
                      : "bg-white text-black hover:bg-neutral-100"
                  }`}
                >
                  Lunas ({orders.filter((o) => o.status === "PAID").length})
                </button>
                <button
                  onClick={() => setOrderStatusFilter("PENDING")}
                  className={`px-3 py-1.5 text-xs font-bold border-2 border-black rounded-[3px] transition-transform cursor-pointer ${
                    orderStatusFilter === "PENDING"
                      ? "bg-amber-200 text-black shadow-[2px_2px_0_0_#000]"
                      : "bg-white text-black hover:bg-neutral-100"
                  }`}
                >
                  Pending ({orders.filter((o) => o.status === "PENDING").length})
                </button>
                <button
                  onClick={() => setOrderStatusFilter("FAILED")}
                  className={`px-3 py-1.5 text-xs font-bold border-2 border-black rounded-[3px] transition-transform cursor-pointer ${
                    orderStatusFilter === "FAILED"
                      ? "bg-rose-300 text-black shadow-[2px_2px_0_0_#000]"
                      : "bg-white text-black hover:bg-neutral-100"
                  }`}
                >
                  Gagal (
                  {
                    orders.filter(
                      (o) => o.status === "FAILED" || o.status === "EXPIRED"
                    ).length
                  }
                  )
                </button>
              </div>
            </div>

            {/* Orders Table Container */}
            <div className="bg-[var(--surface)] border-[3px] border-black rounded-[3px] shadow-[5px_5px_0_0_#000] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b-2 border-black bg-neutral-100 font-black text-black uppercase tracking-wider font-mono">
                      <th className="p-3">Waktu &amp; Tanggal</th>
                      <th className="p-3">Pelanggan (User)</th>
                      <th className="p-3">Produk / CV</th>
                      <th className="p-3">No. Invoice</th>
                      <th className="p-3">Metode</th>
                      <th className="p-3">Nominal</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Ref DOKU</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="p-8 text-center text-neutral-600 font-sans"
                        >
                          <div className="flex flex-col items-center justify-center gap-2">
                            <CreditCard className="h-8 w-8 text-neutral-400" />
                            <p className="font-bold text-sm text-black">
                              Tidak ada data transaksi yang sesuai filter
                            </p>
                            <p className="text-xs text-neutral-500">
                              Coba reset kata kunci pencarian atau ubah filter status pembayaran.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => {
                        const isPaid = order.status === "PAID";
                        const isPending = order.status === "PENDING";

                        return (
                          <tr
                            key={order.id}
                            className={`hover:bg-neutral-50 transition-colors ${
                              isPaid ? "bg-emerald-50/30" : ""
                            }`}
                          >
                            {/* Waktu */}
                            <td className="p-3 font-mono text-[11px] whitespace-nowrap">
                              <div className="font-bold text-black">
                                {new Date(
                                  order.paid_at || order.created_at
                                ).toLocaleDateString("id-ID", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </div>
                              <div className="text-[10px] text-neutral-500">
                                {new Date(
                                  order.paid_at || order.created_at
                                ).toLocaleTimeString("id-ID", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                            </td>

                            {/* Pelanggan */}
                            <td className="p-3">
                              <div className="font-bold text-black flex items-center gap-1.5">
                                <span>{order.user_name}</span>
                                {isPaid && (
                                  <span
                                    title="Pengguna Berbayar"
                                    className="px-1.5 py-0.2 text-[9px] font-black uppercase bg-emerald-200 text-emerald-900 border border-emerald-500 rounded-[2px]"
                                  >
                                    PAID USER
                                  </span>
                                )}
                              </div>
                              <div className="font-mono text-[11px] text-neutral-700">
                                {order.user_email}
                              </div>
                            </td>

                            {/* Produk / CV */}
                            <td className="p-3 max-w-[200px]">
                              <div className="font-bold text-black truncate flex items-center gap-1">
                                <FileText className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
                                <span className="truncate">{order.cv_title}</span>
                              </div>
                              <div className="text-[10px] text-neutral-500 font-mono">
                                ID: {order.cv_id.slice(0, 8)}...
                              </div>
                            </td>

                            {/* Invoice */}
                            <td className="p-3 font-mono text-[11px] font-bold text-black whitespace-nowrap">
                              {order.invoice_number}
                            </td>

                            {/* Metode Pembayaran */}
                            <td className="p-3 font-mono text-[11px] whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded-[2px] bg-neutral-100 border border-neutral-300 font-bold text-neutral-800">
                                {order.payment_method || "DOKU Checkout"}
                              </span>
                            </td>

                            {/* Nominal */}
                            <td className="p-3 font-mono text-xs font-black text-black whitespace-nowrap">
                              {new Intl.NumberFormat("id-ID", {
                                style: "currency",
                                currency: order.currency || "IDR",
                                minimumFractionDigits: 0,
                              }).format(order.amount)}
                            </td>

                            {/* Status */}
                            <td className="p-3 whitespace-nowrap">
                              {isPaid ? (
                                <span className="inline-flex items-center gap-1 font-bold border-2 border-black bg-emerald-300 text-black px-2.5 py-0.5 rounded-[2px] text-[10px] shadow-[1px_1px_0_0_#000]">
                                  <CheckCircle2 className="h-3 w-3" />
                                  <span>LUNAS</span>
                                </span>
                              ) : isPending ? (
                                <span className="inline-flex items-center gap-1 font-bold border-2 border-black bg-amber-200 text-black px-2.5 py-0.5 rounded-[2px] text-[10px] shadow-[1px_1px_0_0_#000]">
                                  <Clock className="h-3 w-3" />
                                  <span>MENUNGGU</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 font-bold border-2 border-black bg-rose-300 text-black px-2.5 py-0.5 rounded-[2px] text-[10px] shadow-[1px_1px_0_0_#000]">
                                  <AlertTriangle className="h-3 w-3" />
                                  <span>{order.status}</span>
                                </span>
                              )}
                            </td>

                            {/* Ref DOKU */}
                            <td className="p-3 font-mono text-[10px] text-neutral-600 whitespace-nowrap">
                              {order.doku_reference || "-"}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer Summary */}
              <div className="bg-neutral-100 border-t-2 border-black px-4 py-2.5 flex items-center justify-between text-[11px] font-mono text-neutral-700">
                <span>
                  Menampilkan {filteredOrders.length} dari {orders.length} total pesanan
                </span>
                <span className="font-bold text-black">
                  Subtotal Lunas Terpilih:{" "}
                  {new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    minimumFractionDigits: 0,
                  }).format(
                    filteredOrders
                      .filter((o) => o.status === "PAID")
                      .reduce((sum, o) => sum + o.amount, 0)
                  )}
                </span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal: Tambah API Key Baru */}
      {isAddKeyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-[var(--surface)] border-[3px] border-black rounded-[3px] shadow-[8px_8px_0_0_#000] max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b-[3px] border-black bg-[var(--accent)] flex items-center justify-between text-black">
              <h3 className="font-black font-[family-name:var(--font-heading)] text-base flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Tambah API Key Gemini
              </h3>
              <button
                onClick={() => setIsAddKeyOpen(false)}
                className="border-2 border-black bg-white hover:bg-rose-200 text-black p-1 rounded-[2px] hard-drop-sm cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateKey} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Label / Nama Kunci *
                </label>
                <input
                  type="text"
                  required
                  value={newKeyLabel}
                  onChange={(e) => setNewKeyLabel(e.target.value)}
                  placeholder="e.g. Gemini Production Primary"
                  className="w-full px-3 py-2 text-xs border-2 border-black rounded-[3px] bg-white text-black focus:outline-none focus:shadow-[2.5px_2.5px_0_0_#FFE500]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Plain API Key * (Disimpan dengan enkripsi AES-256-GCM)
                </label>
                <input
                  type="password"
                  required
                  value={newPlainKey}
                  onChange={(e) => setNewPlainKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-3 py-2 text-xs font-mono border-2 border-black rounded-[3px] bg-white text-black focus:outline-none focus:shadow-[2.5px_2.5px_0_0_#FFE500]"
                />
                <p className="text-[10px] text-neutral-600 mt-1">
                  Hanya 4 karakter terakhir yang akan ditampilkan di antarmuka web.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Prioritas (Makin tinggi makin diutamakan saat setara)
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={newPriority}
                  onChange={(e) => setNewPriority(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono border-2 border-black rounded-[3px] bg-white text-black focus:outline-none focus:shadow-[2.5px_2.5px_0_0_#FFE500]"
                />
              </div>

              <div className="pt-2 border-t-2 border-black flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddKeyOpen(false)}
                  className="px-3 py-1.5 text-xs font-bold border-2 border-black rounded-[3px] bg-white hover:bg-neutral-100 text-black hard-drop-sm cursor-pointer"
                >
                  Batal
                </button>

                <Button
                  variant="primary"
                  size="sm"
                  disabled={isAddingKey}
                  className="font-bold border-2 border-black"
                >
                  {isAddingKey ? "Menyimpan..." : "Simpan & Enkripsi"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
