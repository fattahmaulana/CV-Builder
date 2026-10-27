# Panduan Deployment & Operasional Produksi — CVBuilder

Dokumen ini memuat panduan lengkap konfigurasi infrastruktur, variabel lingkungan, keamanan, dan deployment aplikasi **CVBuilder** ke platform **Vercel** dengan backend **Supabase**, gateway pembayaran **DOKU**, integrasi **Google Sheets**, dan **Google Gemini API**.

---

## 1. Arsitektur Sistem

- **Frontend & App Server**: Next.js 16 (Turbopack, React 19, TypeScript Strict, Tailwind CSS v4).
- **Database & Auth**: Supabase Postgres (11 tabel dengan isolasi ketat Row Level Security / RLS) + Supabase SSR Auth (Google OAuth).
- **AI Enhancement**: Google Gemini API via SDK resmi `@google/genai` dengan penyensoran PII (UU PDP No. 27/2022) dan sanitasi prompt injection.
- **Pembayaran**: DOKU Checkout (Rp5.000 per CV, 3x revisi dalam 7 hari) dengan verifikasi tanda tangan HMAC-SHA256 constant-time dan pencegahan *replay attack*.
- **Ekspor Dokumen**:
  - **PDF ATS**: `@react-pdf/renderer` (server-side stream, 100% teks dapat dipilih, tanpa Chromium/Puppeteer).
  - **Word DOCX**: `docx` library (standar OpenXML Heading styles).
- **Pelacak Lamaran**: Google Sheets API dengan cakupan minimal `https://www.googleapis.com/auth/drive.file` dan enkripsi token AES-256-GCM.

---

## 2. Matriks Variabel Lingkungan (.env)

Buat file `.env.local` pada tahap pengembangan atau tambahkan ke **Vercel Project Settings > Environment Variables**:

| Nama Variabel | Wajib? | Keterangan | Contoh Nilai |
|---|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Ya | URL domain utama aplikasi | `https://cvbuilder.id` atau `http://localhost:3000` |
| `NEXT_PUBLIC_SUPABASE_URL` | Ya | URL endpoint project Supabase | `https://xxxxxxxxxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Ya | Anon public key Supabase | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Ya | Service role key Supabase (Server Only) | `eyJhbGciOi...` |
| `GEMINI_API_KEY` | Ya | API Key dari Google AI Studio | `AIzaSy...` |
| `DOKU_CLIENT_ID` | Ya | Client ID dari DOKU Merchant Portal | `MALL-12345678` |
| `DOKU_SECRET_KEY` | Ya | Shared secret key untuk verifikasi HMAC | `SK-abcdef123456...` |
| `DOKU_API_URL` | Ya | URL Base API DOKU | `https://api.doku.com` (Prod) atau `https://api-sandbox.doku.com` (Dev) |
| `DOKU_CHECKOUT_URL` | Ya | URL Halaman Checkout DOKU | `https://checkout.doku.com` (Prod) atau `https://sandbox.doku.com` (Dev) |
| `GOOGLE_CLIENT_ID` | Ya | OAuth 2.0 Client ID dari Google Cloud Console | `xxxxxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Ya | OAuth 2.0 Client Secret dari Google Cloud Console | `GOCSPX-xxxxxx` |
| `ENCRYPTION_KEY` | Ya | Kunci 32-byte (64 hex characters) untuk AES-256-GCM | `0123456789abcdef...` (generate via crypto) |

> **Catatan Pembuatan ENCRYPTION_KEY**:
> Jalankan perintah berikut di terminal untuk menghasilkan kunci enkripsi 32-byte yang aman:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

---

## 3. Langkah Migrasi Database (Supabase)

1. Masuk ke dasbor Supabase Anda di [https://supabase.com](https://supabase.com).
2. Buka menu **SQL Editor > New query**.
3. Buka file migrasi lokal:
   `supabase/migrations/20261026000000_init_cvkerja_schema.sql`
4. Tempelkan seluruh isi SQL dan jalankan (*Run*).
5. Pastikan seluruh 11 tabel terbentuk dengan RLS aktif:
   - `profiles`
   - `consents`
   - `cvs`
   - `cv_versions`
   - `orders`
   - `payment_events`
   - `applications`
   - `google_connections`
   - `job_cache`
   - `ai_usage_logs`
   - `rate_limits`

---

## 4. Konfigurasi Gateway Pembayaran DOKU

1. Daftarkan akun di [DOKU Back Office](https://bo.doku.com).
2. Di menu **Settings > Notification URL**, atur URL Webhook:
   `https://[DOMAIN_ANDA]/api/payments/webhook`
3. Pilih metode pembayaran aktif: **QRIS Only** (GoPay, OVO, ShopeePay, DANA, BCA, Mandiri, BRI, BNI & seluruh M-Banking).
4. Catat **Client ID** dan **Secret Key**, lalu masukkan ke variabel lingkungan Vercel.

---

## 5. Konfigurasi Google Cloud Console (Sheets Integration)

1. Buat project baru di [Google Cloud Console](https://console.cloud.google.com).
2. Aktifkan **Google Drive API** dan **Google Sheets API**.
3. Di **APIs & Services > Credentials > Create Credentials > OAuth 2.0 Client ID**:
   - Tipe Aplikasi: *Web Application*.
   - **Authorized redirect URIs**:
     - Pengembangan: `http://localhost:3000/api/tracker/google/callback`
     - Produksi: `https://[DOMAIN_ANDA]/api/tracker/google/callback`
4. Di **OAuth consent screen**:
   - Cakupan (*Scope*): Tambahkan HANYA `https://www.googleapis.com/auth/drive.file`.
   - Hal ini memastikan CVBuilder hanya dapat mengakses spreadsheet yang dibuatnya sendiri dan mempermudah proses verifikasi Google App.

---

## 6. Deployment ke Vercel

### Opsi A: Menggunakan Vercel Git Integration (Direkomendasikan)
1. *Push* kode ke repositori GitHub / GitLab Anda.
2. Di dasbor [Vercel](https://vercel.com), klik **Add New Project** dan impor repositori `CVBuilder`.
3. Framework Preset akan otomatis terdeteksi sebagai **Next.js**.
4. Buka bagian **Environment Variables** dan tambahkan semua variabel dari tabel di atas.
5. Klik **Deploy**.

### Opsi B: Menggunakan Vercel CLI
```bash
npm install -g vercel
vercel login
vercel --prod
```

---

## 7. Verifikasi Keamanan Pasca-Deploy (Checklist Produksi)

- [ ] **HTTP Security Headers**: Header `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, dan `Content-Security-Policy` aktif pada setiap response.
- [ ] **Uji Webhook DOKU**: Lakukan uji transaksi di mode sandbox, pastikan status order otomatis berubah menjadi `PAID` dan token revisi bertambah.
- [ ] **Uji Ekspor Dokumen**: Buat dokumen uji coba dan unduh berkas `.pdf` serta `.docx`. Pastikan teks terbaca secara linier dan dapat disorot (*selectable*).
- [ ] **Kepatuhan UU PDP No. 27/2022**: Pastikan modal persetujuan (*consent*) muncul sebelum pembuatan CV pertama, dan data pribadi disensor sebelum dikirimkan ke model AI.
- [ ] **Audit Klaim Pemasaran**: Tidak ada klaim dilarang (*"pasti lolos"*, *"auto lolos"*, *"100% lolos"*) di seluruh halaman publik.
