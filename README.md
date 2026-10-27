# CVBuilder 💼✨
### Ekosistem Karir Terpadu: Pembuat CV ATS Harvard, Direktori Lowongan & Pelacak Lamaran Kerja

[![Next.js](https://img.shields.io/badge/Next.js-16.4.3-black?logo=next.js&style=flat-square)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3.0-blue?logo=react&style=flat-square)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&style=flat-square)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?logo=tailwind-css&style=flat-square)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?logo=supabase&style=flat-square)](https://supabase.com/)
[![Google Gemini AI](https://img.shields.io/badge/Google%20Gemini-2.5%20Flash-4285F4?logo=google&style=flat-square)](https://ai.google.dev/)
[![Payment Gateway](https://img.shields.io/badge/Payment-QRIS%20SociaBuzz-FF6B9D?style=flat-square)](https://sociabuzz.com/)
[![Tests](https://img.shields.io/badge/Tests-33%20Files%20%7C%20215%20Passed-10B981?style=flat-square)](https://vitest.dev/)

**CVBuilder** adalah platform ekosistem karir modern yang dirancang khusus untuk pencari kerja di Indonesia, terutama *fresh graduates* dan profesional. Menggabungkan **CV Generator ATS Harvard**, **Optimasi Gemini AI**, **Direktori Lowongan Kerja Real-Time**, **Job Application Tracker (Google Sheets Sync)**, serta **Sistem Pembayaran QRIS Nasional** dengan estetika visual **Neobrutalism** yang tegas dan responsif.

---

## 🌟 Fitur Utama

### 1. 📄 Pembuat CV Standar ATS Harvard (PDF & DOCX Word)
- **Format 1 Kolom Linier Murni**: Mengikuti kaidah akademik Harvard Resume yang ramah parser Applicant Tracking System (ATS).
- **Dual Export Berkas**:
  - **PDF ATS Asli**: Di-generate server-side menggunakan `@react-pdf/renderer` (100% selectable and searchable text, tanpa headless browser Puppeteer/Chromium).
  - **DOCX Word**: Dokumen Word yang dapat diedit langsung menggunakan pustaka `docx` standar OpenXML.
- **Autosave Engine**: Penyimpanan draft otomatis berbasis *debounce* (1.5 detik) dengan retry berulang hingga 3x ber-backoff eksponensial.
- **Pilihan Template**: Format Klasik Harvard ATS dan Format Foto Profil Profesional.

### 2. 🤖 Asisten Karir Google Gemini AI Terintegrasi
- **Optimasi Kalimat Aksi & Metrik**: Mengubah uraian tugas pasif menjadi pernyataan pencapaian terukur berorientasi hasil (XYZ formula: *Accomplished [X] as measured by [Y], by doing [Z]*).
- **Penyelarasan Kata Kunci Lowongan**: Rekomendasi kata kunci relevan berdasarkan deskripsi lowongan kerja target.
- **Privasi & Keamanan (UU PDP No. 27 Tahun 2022)**:
  - **PII Sanitizer**: Menyensor data sensitif (NIK, nomor telepon, alamat rumah, email pribadi) sebelum dikirimkan ke model AI.
  - **Prompt Defense**: Filter injeksi prompt dan pembatasan scope hanya untuk konteks CV profesional.
- **Multi-Key Rotation**: Pool API key Gemini dinamis di server dengan failover otomatis jika limit kuota tercapai.

### 3. 💳 Pembayaran Resmi QRIS Nasional (SociaBuzz Payment Gateway)
- **Skema Terjangkau**: Rp5.000 per CV (akses unduhan permanen berkas PDF & DOCX + garansi 3x revisi gratis selama 7 hari).
- **Metode Pembayaran**: **QRIS ONLY** (mendukung BCA Mobile, Mandiri Livin, BRImo, BNI Mobile, GoPay, OVO, ShopeePay, DANA, LinkAja).
- **Otomatis Tanpa Konfirmasi Manual**:
  - Barcode QRIS di-generate secara lokal dengan format Base64 Data URL (tajam, instan, tanpa ketergantungan pihak ketiga).
  - Webhook callback dan auto-polling status real-time setiap 3 detik.
  - Pengalihan otomatis ke halaman unduh saat transfer terverifikasi lunas.

### 4. 📊 Pelacak Lamaran Kerja & Google Sheets Sync
- **Board Manajemen Lamaran**: Pantau status lamaran (*Belum Dikirim*, *Terkirim*, *Wawancara*, *Tawaran*, *Ditolak*).
- **Google Sheets 2-Way Sync**: Hubungkan langsung ke akun Google Drive pengguna dengan izin minimal `drive.file` dan enkripsi token AES-256-GCM.

### 5. 🔍 Direktori Lowongan Fresh Graduate (`/lowongan`)
- Lowongan terkurasi ramah lulusan baru dari BUMN, perbankan nasional, instansi terpercaya, dan perusahaan teknologi.
- Fitur penyesuaian langsung: Terapkan deskripsi lowongan ke CV dalam satu klik.

### 6. 🛡️ Panel Admin & Keamanan Tingkat Enterprise
- Autentikasi aman berbasis Supabase Auth dengan **Row Level Security (RLS)** ketat di setiap tabel.
- Manajemen API Key Gemini dan ringkasan transaksi pesanan di halaman `/admin`.

---

## 🏗️ Tech Stack

| Layer | Teknologi |
|---|---|
| **Framework** | Next.js 16.4.3 (App Router, Turbopack) |
| **Bahasa** | TypeScript 5 (Strict Mode) |
| **Frontend UI** | React 19, Tailwind CSS v4, Motion / GSAP, Lucide Icons |
| **Desain** | Neobrutalism Tokens (3px black borders, hard-drop shadows, vibrant flat palettes) |
| **Database & Auth** | Supabase (PostgreSQL, Row Level Security, Auth SSR) |
| **Artificial Intelligence** | Google Gemini AI (`@google/genai` 2.5 Flash) |
| **Dokumen Generator** | `@react-pdf/renderer` (PDF) & `docx` (Word OpenXML) |
| **Payment Gateway** | SociaBuzz QRIS API & Webhook Service |
| **Testing** | Vitest 5 (33 Test Files, 215 Unit & Integration Tests) |

---

## 📁 Struktur Direktori

```text
CVBuilder/
├── src/
│   ├── app/                         # Next.js App Router Pages & API Routes
│   │   ├── admin/                   # Admin Dashboard & Gemini API Key Manager
│   │   ├── api/                     # Backend Endpoints (CV, Payments, AI, Sheets)
│   │   ├── auth/                    # Login, Register, Callback SSR
│   │   ├── cv/                      # Editor CV, Stepper, Download Page
│   │   ├── dashboard/               # Dashboard Pengguna
│   │   ├── lowongan/                # Direktori Lowongan Kerja
│   │   ├── payment/                 # Halaman Checkout QRIS & Sukses
│   │   ├── tracker/                 # Job Application Tracker
│   │   └── webhook/                 # SociaBuzz & Gateway Callback Endpoint
│   ├── components/
│   │   ├── cv/                      # HarvardCvPreview, Steppers, Watermark
│   │   ├── landing/                 # Hero, TransformDemo, Features, FAQ, Footer
│   │   └── ui/                      # CVBuilderLogo3D, Neobrutalist UI Elements
│   ├── lib/
│   │   ├── ai/                      # Gemini Client, Key Rotation, Prompt Defense, PII Sanitizer
│   │   ├── docx/                    # ATS Harvard DOCX Generator
│   │   ├── pdf/                     # ATS Harvard PDF Document Engine
│   │   ├── sheets/                  # Google Sheets API Service
│   │   ├── sociabuzz/               # SociaBuzz Client, CookieJar, Webhook & QRIS Engine
│   │   └── supabase/                # Browser, Server, & Admin Supabase Clients
│   ├── tests/                       # 33 Vitest Test Suites (215 Tests)
│   └── types/                       # Definisi Tipe TypeScript (CV, Orders, DB)
├── supabase/
│   └── migrations/                  # Skema Database PostgreSQL & Kebijakan RLS
├── public/                          # Aset Statis, Font, Favicon, SVG Logo
├── .env.example                     # Contoh Variabel Lingkungan
├── package.json
└── tsconfig.json
```

---

## 🚀 Panduan Menjalankan Proyek Secara Lokal

### Prasyarat
- **Node.js**: Versi 20.x atau lebih baru.
- **npm**: Versi 10.x atau lebih baru.
- **Akun Supabase**: Proyek Supabase aktif (lokal atau cloud di [supabase.com](https://supabase.com)).

### Langkah Instalasi

1. **Clone Repositori**:
   ```bash
   git clone https://github.com/fattahmaulana/CV-Builder.git
   cd CV-Builder
   ```

2. **Instal Dependensi**:
   ```bash
   npm install
   ```

3. **Konfigurasi Variabel Lingkungan**:
   Salin berkas `.env.example` menjadi `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Lalu lengkapi konfigurasi di `.env.local`:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

   # App Base URL
   NEXT_PUBLIC_APP_URL=http://localhost:3000

   # Google Gemini AI (Opsional: Multi-key dipisahkan koma)
   GEMINI_API_KEY=AIzaSy...

   # SociaBuzz QRIS Payment Gateway
   SOCIABUZZ_BASE_URL=https://sociabuzz.com
   SOCIABUZZ_USERNAME=your_sociabuzz_username
   SOCIABUZZ_API_KEY=your_sociabuzz_api_key

   # Google Cloud OAuth (Untuk Google Sheets Job Tracker)
   GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   TOKEN_ENCRYPTION_KEY=32_character_hex_encryption_key_here
   ```

4. **Jalankan Skema Database Supabase**:
   Eksekusi migrasi SQL yang tersedia di `supabase/migrations/20261026000000_init_cvkerja_schema.sql` pada menu **SQL Editor** di Dashboard Supabase Anda.

5. **Jalankan Pengujian Unit & Integrasi**:
   ```bash
   npm test
   ```

6. **Jalankan Server Development**:
   ```bash
   npm run dev
   ```
   Buka peramban Anda di [http://localhost:3000](http://localhost:3000).

---

## 🧪 Pengujian & Jaminan Mutu

Proyek ini memiliki cakupan pengujian komprehensif menggunakan **Vitest**:
```bash
# Menjalankan seluruh pengujian unit & integrasi (33 files, 215 tests)
npm test

# Memeriksa static type checker TypeScript strict mode
npx tsc --noEmit

# Menjalankan tes koneksi dan rotasi API Gemini AI
npm run check:ai
```

---

## 📄 Lisensi

Didistribusikan di bawah lisensi MIT. Lihat berkas `LICENSE` untuk informasi lebih lanjut.

---

**Dibuat dengan dedikasi untuk pencari kerja Indonesia.** 🇮🇩
