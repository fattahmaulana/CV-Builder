"use client";

import * as React from "react";
import Link from "next/link";
import {
  Briefcase,
  Plus,
  RefreshCw,
  ExternalLink,
  Search,
  CheckCircle2,
  Trash2,
  ArrowLeft,
  X,
  Calendar,
  Building,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";


export type ApplicationStatus = "Belum dikirim" | "Terkirim" | "Wawancara" | "Tawaran" | "Ditolak";

export interface ApplicationRecord {
  id: string;
  company: string;
  position: string;
  status: ApplicationStatus;
  applied_date: string | null;
  job_url: string | null;
  cv_version: string | null;
  notes: string | null;
  created_at: string;
}

interface TrackerClientProps {
  initialApplications: ApplicationRecord[];
  isConnectedToSheets?: boolean;
  spreadsheetUrl?: string | null;
  lastSyncedAt?: string | null;
  connectedEmail?: string | null;
  needsReconnect?: boolean;
}

export function TrackerClient({
  initialApplications,
}: TrackerClientProps) {
  const [applications, setApplications] = React.useState<ApplicationRecord[]>(initialApplications);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");

  // Add Application Modal state
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [newCompany, setNewCompany] = React.useState("");
  const [newPosition, setNewPosition] = React.useState("");
  const [newStatus, setNewStatus] = React.useState<ApplicationStatus>("Terkirim");
  const [newDate, setNewDate] = React.useState(new Date().toISOString().split("T")[0]);
  const [newJobUrl, setNewJobUrl] = React.useState("");
  const [newNotes, setNewNotes] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);


  // Add New Application
  const handleCreateApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany.trim() || !newPosition.trim()) {
      alert("Nama perusahaan dan posisi pekerjaan wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/tracker/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: newCompany,
          position: newPosition,
          status: newStatus,
          applied_date: newDate,
          job_url: newJobUrl,
          notes: newNotes,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Gagal menyimpan lamaran");
      }

      setApplications((prev) => [json.application, ...prev]);
      setIsModalOpen(false);
      setNewCompany("");
      setNewPosition("");
      setNewNotes("");
      setNewJobUrl("");
    } catch (err: unknown) {
      console.error("Create application error:", err);
      alert(err instanceof Error ? err.message : "Gagal membuat lamaran");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update Status
  const handleStatusChange = async (appId: string, nextStatus: ApplicationStatus) => {
    try {
      const res = await fetch(`/api/tracker/applications/${appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!res.ok) throw new Error("Gagal memperbarui status");

      setApplications((prev) =>
        prev.map((app) => (app.id === appId ? { ...app, status: nextStatus } : app))
      );
    } catch (err) {
      console.error("Update status error:", err);
      alert("Gagal memperbarui status lamaran.");
    }
  };

  // Delete Application
  const handleDeleteApplication = async (appId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus catatan lamaran ini?")) return;

    try {
      const res = await fetch(`/api/tracker/applications/${appId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus lamaran");

      setApplications((prev) => prev.filter((app) => app.id !== appId));
    } catch (err) {
      console.error("Delete error:", err);
      alert("Gagal menghapus lamaran.");
    }
  };

  // Filtered applications
  const filteredApps = applications.filter((app) => {
    const matchesSearch =
      app.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.position.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const counts = {
    total: applications.length,
    terkirim: applications.filter((a) => a.status === "Terkirim").length,
    wawancara: applications.filter((a) => a.status === "Wawancara").length,
    tawaran: applications.filter((a) => a.status === "Tawaran").length,
    ditolak: applications.filter((a) => a.status === "Ditolak").length,
  };

  const getStatusStyle = (status: ApplicationStatus) => {
    switch (status) {
      case "Terkirim":
        return "bg-[#4D7CFF] text-white border-2 border-black";
      case "Wawancara":
        return "bg-[#FFE500] text-black border-2 border-black";
      case "Tawaran":
        return "bg-[#10B981] text-black border-2 border-black";
      case "Ditolak":
        return "bg-[#FF6B9D] text-black border-2 border-black";
      default:
        return "bg-white text-black border-2 border-black";
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-black flex flex-col">
      {/* Navigation Header */}
      <header className="border-b-[3px] border-black bg-white sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] border-2 border-black bg-[#FFFBEB] hover:bg-[#FFE500] text-xs font-black hard-drop-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4 stroke-[2.5]" />
            <span>Kembali ke Dashboard</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-xs font-black px-2.5 py-1 rounded-[2px] bg-[#FFE500] text-black border-2 border-black shadow-[1.5px_1.5px_0_0_#000] font-mono">
              Job Application Tracker
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 w-full space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b-[3px] border-black">
          <div>
            <div className="inline-block border-2 border-black bg-[#FFE500] text-black px-2.5 py-0.5 rounded-[2px] font-mono text-[11px] font-black uppercase tracking-wider mb-2 shadow-[2px_2px_0_0_#000]">
              Manajemen Karir
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-[family-name:var(--font-display)] tracking-tight text-black">
              Pelacak Lamaran Kerja
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-stone-700 mt-1 leading-relaxed max-w-xl">
              Pantau dan kelola seluruh status lowongan pekerjaan yang Anda lamar di satu tempat secara rapi dan terorganisir.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-black bg-[#FFE500] hover:bg-[#FDD835] text-black border-[3px] border-black rounded-[3px] shadow-[4px_4px_0_0_#000] hover:shadow-[2px_2px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              <span>Tambah Lamaran Baru</span>
            </button>
          </div>
        </div>

        {/* Metric Cards - 5 Neobrutalist Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          {/* Total */}
          <div className="p-4 rounded-[3px] bg-white border-[3px] border-black shadow-[4px_4px_0_0_#000]">
            <span className="text-[11px] font-black text-stone-700 uppercase tracking-wider block mb-1">
              Total Dilamar
            </span>
            <span className="text-3xl font-black font-[family-name:var(--font-display)] text-black">
              {counts.total}
            </span>
          </div>

          {/* Terkirim */}
          <div className="p-4 rounded-[3px] bg-[#4D7CFF] text-white border-[3px] border-black shadow-[4px_4px_0_0_#000]">
            <span className="text-[11px] font-black uppercase tracking-wider block mb-1 text-white/90">
              Terkirim
            </span>
            <span className="text-3xl font-black font-[family-name:var(--font-display)] text-white">
              {counts.terkirim}
            </span>
          </div>

          {/* Wawancara */}
          <div className="p-4 rounded-[3px] bg-[#FFE500] text-black border-[3px] border-black shadow-[4px_4px_0_0_#000]">
            <span className="text-[11px] font-black uppercase tracking-wider block mb-1">
              Wawancara
            </span>
            <span className="text-3xl font-black font-[family-name:var(--font-display)] text-black">
              {counts.wawancara}
            </span>
          </div>

          {/* Tawaran */}
          <div className="p-4 rounded-[3px] bg-[#10B981] text-black border-[3px] border-black shadow-[4px_4px_0_0_#000]">
            <span className="text-[11px] font-black uppercase tracking-wider block mb-1">
              Tawaran (Offer)
            </span>
            <span className="text-3xl font-black font-[family-name:var(--font-display)] text-black">
              {counts.tawaran}
            </span>
          </div>

          {/* Ditolak */}
          <div className="p-4 rounded-[3px] bg-[#FF6B9D] text-black border-[3px] border-black shadow-[4px_4px_0_0_#000]">
            <span className="text-[11px] font-black uppercase tracking-wider block mb-1">
              Ditolak
            </span>
            <span className="text-3xl font-black font-[family-name:var(--font-display)] text-black">
              {counts.ditolak}
            </span>
          </div>
        </div>

        {/* Action Controls: Search, Filter, Add Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="h-4 w-4 absolute left-3 top-2.5 text-stone-500 stroke-[2.5]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari perusahaan atau posisi..."
                className="w-full pl-9 pr-3 py-2 text-xs font-bold text-black bg-white border-2 border-black rounded-[3px] shadow-[2px_2px_0_0_#000] focus:shadow-[2px_2px_0_0_#FFE500] focus:outline-none"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs font-bold text-black bg-white border-2 border-black rounded-[3px] shadow-[2px_2px_0_0_#000] focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              <option value="Belum dikirim">Belum dikirim</option>
              <option value="Terkirim">Terkirim</option>
              <option value="Wawancara">Wawancara</option>
              <option value="Tawaran">Tawaran</option>
              <option value="Ditolak">Ditolak</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-black bg-[#FFE500] hover:bg-[#FDD835] text-black border-[3px] border-black rounded-[3px] hard-drop cursor-pointer shadow-[3px_3px_0_0_#000] transition-colors"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>Tambah Lamaran</span>
          </button>
        </div>

        {/* Application List Table */}
        <div className="bg-white border-[3px] border-black rounded-[3px] shadow-[6px_6px_0_0_#000] overflow-hidden">
          {filteredApps.length === 0 ? (
            <div className="text-center py-16 px-6 bg-[#FFFBEB]">
              <div className="h-14 w-14 rounded-[4px] bg-white border-[3px] border-black shadow-[3px_3px_0_0_#000] mx-auto flex items-center justify-center mb-3">
                <Briefcase className="h-7 w-7 text-black stroke-[2.2]" />
              </div>
              <h3 className="text-base font-black text-black">
                Belum ada lamaran yang tercatat
              </h3>
              <p className="text-xs font-semibold text-stone-700 mt-1 mb-5 max-w-sm mx-auto">
                Mulai catat setiap lamaran kerja yang Anda kirimkan agar tidak lupa proses follow-up.
              </p>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-black bg-[#FFE500] text-black border-2 border-black rounded-[3px] hard-drop cursor-pointer"
              >
                <Plus className="h-4 w-4 stroke-[3]" />
                <span>Tambah Lamaran Pertama</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FFFBEB] border-b-[3px] border-black text-[11px] font-black text-black uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Perusahaan &amp; Posisi</th>
                    <th className="py-3.5 px-4">Status Lamaran</th>
                    <th className="py-3.5 px-4">Tanggal Melamar</th>
                    <th className="py-3.5 px-4">Catatan / Follow Up</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black">
                  {filteredApps.map((app) => (
                    <tr key={app.id} className="hover:bg-[#FFFBEB]/60 transition-colors">
                      <td className="py-4 px-4">
                        <p className="font-black text-black text-sm">
                          {app.company}
                        </p>
                        <p className="text-xs font-semibold text-stone-700 mt-0.5">
                          {app.position}
                        </p>
                        {app.job_url && (
                          <a
                            href={app.job_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-black hover:underline mt-1 underline-offset-2"
                          >
                            <span>Tautan Lowongan</span>
                            <ExternalLink className="h-3 w-3 stroke-[2.5]" />
                          </a>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <select
                          value={app.status}
                          onChange={(e) => handleStatusChange(app.id, e.target.value as ApplicationStatus)}
                          className={`text-xs font-black px-2.5 py-1 rounded-[2px] cursor-pointer focus:outline-none shadow-[1.5px_1.5px_0_0_#000] ${getStatusStyle(
                            app.status
                          )}`}
                        >
                          <option value="Belum dikirim">Belum dikirim</option>
                          <option value="Terkirim">Terkirim</option>
                          <option value="Wawancara">Wawancara</option>
                          <option value="Tawaran">Tawaran</option>
                          <option value="Ditolak">Ditolak</option>
                        </select>
                      </td>

                      <td className="py-4 px-4 text-black font-mono font-bold">
                        {app.applied_date
                          ? new Date(app.applied_date).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "-"}
                      </td>

                      <td className="py-4 px-4 text-stone-800 font-semibold max-w-xs truncate">
                        {app.notes || <span className="text-stone-400 italic">Tidak ada catatan</span>}
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {app.status === "Belum dikirim" && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(app.id, "Terkirim")}
                              className="px-2.5 py-1 text-[11px] font-black border-2 border-black rounded-[2px] bg-[#4D7CFF] text-white hover:bg-[#3b66df] transition-colors hard-drop-sm cursor-pointer whitespace-nowrap"
                              title="Tandai Sudah Kirim"
                            >
                              Tandai Terkirim
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteApplication(app.id)}
                            className="p-1.5 text-black border-2 border-black rounded-[2px] bg-white hover:bg-[#FF6B9D] transition-colors hard-drop-sm cursor-pointer"
                            title="Hapus Catatan"
                          >
                            <Trash2 className="h-4 w-4 stroke-[2.5]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Add Application Modal with Neobrutalism Styling */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-white border-[3px] border-black rounded-[3px] shadow-[8px_8px_0_0_#000] max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b-2 border-black mb-5">
              <h3 className="text-base font-black font-[family-name:var(--font-display)] text-black">
                Catat Lamaran Kerja Baru
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 border-2 border-black rounded-[2px] bg-white hover:bg-[#FF6B9D] hard-drop-sm cursor-pointer transition-colors"
              >
                <X className="h-4 w-4 stroke-[2.5]" />
              </button>
            </div>

            <form onSubmit={handleCreateApplication} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-black mb-1">
                  Nama Perusahaan *
                </label>
                <input
                  type="text"
                  required
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  placeholder="e.g. PT Telkom Indonesia Tbk"
                  className="w-full px-3 py-2 text-xs font-bold text-black border-2 border-black rounded-[3px] shadow-[2px_2px_0_0_#000] focus:shadow-[2px_2px_0_0_#FFE500] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-black mb-1">
                  Posisi Pekerjaan *
                </label>
                <input
                  type="text"
                  required
                  value={newPosition}
                  onChange={(e) => setNewPosition(e.target.value)}
                  placeholder="e.g. Management Trainee / Junior Developer"
                  className="w-full px-3 py-2 text-xs font-bold text-black border-2 border-black rounded-[3px] shadow-[2px_2px_0_0_#000] focus:shadow-[2px_2px_0_0_#FFE500] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-black mb-1">
                    Status Lamaran
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as ApplicationStatus)}
                    className="w-full px-3 py-2 text-xs font-bold text-black border-2 border-black rounded-[3px] shadow-[2px_2px_0_0_#000] focus:outline-none cursor-pointer"
                  >
                    <option value="Belum dikirim">Belum dikirim</option>
                    <option value="Terkirim">Terkirim</option>
                    <option value="Wawancara">Wawancara</option>
                    <option value="Tawaran">Tawaran</option>
                    <option value="Ditolak">Ditolak</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-black mb-1">
                    Tanggal Melamar
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold text-black border-2 border-black rounded-[3px] shadow-[2px_2px_0_0_#000] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-black mb-1">
                  Tautan Lowongan (Opsional)
                </label>
                <input
                  type="url"
                  value={newJobUrl}
                  onChange={(e) => setNewJobUrl(e.target.value)}
                  placeholder="https://linkedin.com/jobs/view/..."
                  className="w-full px-3 py-2 text-xs font-bold text-black border-2 border-black rounded-[3px] shadow-[2px_2px_0_0_#000] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-black mb-1">
                  Catatan / Tanggal Follow Up
                </label>
                <textarea
                  rows={3}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g. Diarahkan oleh Pak Andi, jadwal interview user minggu depan..."
                  className="w-full px-3 py-2 text-xs font-bold text-black border-2 border-black rounded-[3px] shadow-[2px_2px_0_0_#000] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-black border-2 border-black bg-white rounded-[3px] hard-drop-sm cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-black text-black border-[3px] border-black bg-[#FFE500] hover:bg-[#FDD835] rounded-[3px] hard-drop cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Lamaran"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

