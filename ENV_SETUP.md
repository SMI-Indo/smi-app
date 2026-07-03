# 📋 Panduan Setup Environment Variables — SMI App

Sebelum menjalankan aplikasi, Anda perlu menyiapkan file `.env.local` dengan semua nilai yang dibutuhkan.

---

## Langkah Pertama

Salin template file `.env.example` menjadi `.env.local`:

```bash
copy .env.example .env.local
```

Kemudian isi setiap nilai sesuai panduan di bawah ini.

---

## 1. 🗄️ DATABASE_URL & DIRECT_URL (Supabase PostgreSQL)

**Layanan:** [Supabase](https://supabase.com) — Gratis tier tersedia (500MB database)

**Langkah Setup:**
1. Daftar/masuk di [supabase.com](https://supabase.com)
2. Klik **New Project**, beri nama proyek (contoh: `smi-app`)
3. Pilih region: **Southeast Asia (Singapore)** untuk performa terbaik
4. Buat password database yang kuat — **catat di tempat aman**, tidak bisa dilihat lagi!
5. Tunggu proyek selesai dibuat (~2 menit)
6. Pergi ke **Settings → Database → Connection string**
7. Salin nilai **URI (Transaction mode)** → isikan ke `DATABASE_URL`
8. Salin nilai **URI (Session mode / Direct)** → isikan ke `DIRECT_URL`

> **Catatan:** `DATABASE_URL` menggunakan connection pooler (port 6543), `DIRECT_URL` menggunakan koneksi langsung (port 5432). Prisma Migrate membutuhkan `DIRECT_URL`.

---

## 2. 🔐 NEXTAUTH_SECRET

Generate secret key secara acak menggunakan salah satu cara berikut:

**Cara 1 — via terminal (PowerShell):**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

**Cara 2 — via website:**
Kunjungi [https://generate-secret.vercel.app](https://generate-secret.vercel.app) dan salin hasilnya.

Isi `NEXTAUTH_SECRET` dengan nilai yang dihasilkan.
`NEXTAUTH_URL` = `http://localhost:3000` (untuk development lokal).

---

## 3. 🔵 GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET

**Layanan:** [Google Cloud Console](https://console.cloud.google.com)

**Langkah Setup:**
1. Buka [console.cloud.google.com](https://console.cloud.google.com)
2. Buat project baru atau pilih project yang sudah ada
3. Pergi ke **APIs & Services → OAuth consent screen**
   - User type: **External**
   - Isi nama aplikasi: `Sahabat Misdinar Indonesia`
   - Isi email dukungan dan developer
   - Simpan dan lanjutkan
4. Pergi ke **APIs & Services → Credentials**
5. Klik **+ Create Credentials → OAuth 2.0 Client IDs**
   - Application type: **Web application**
   - Nama: `SMI App (localhost)`
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
6. Klik **Create** — salin **Client ID** dan **Client Secret**

---

## 4. 🔷 FACEBOOK_CLIENT_ID & FACEBOOK_CLIENT_SECRET

**Layanan:** [Meta for Developers](https://developers.facebook.com)

**Langkah Setup:**
1. Buka [developers.facebook.com](https://developers.facebook.com) dan masuk dengan akun Facebook
2. Klik **My Apps → Create App**
3. Pilih tipe: **Consumer** → klik Next
4. Beri nama app: `SMI App` → klik Create App
5. Di dashboard app, cari produk **Facebook Login** → klik **Set Up**
6. Pilih platform: **Web** → masukkan URL: `http://localhost:3000`
7. Pergi ke **Facebook Login → Settings**:
   - Valid OAuth Redirect URIs: `http://localhost:3000/api/auth/callback/facebook`
8. Pergi ke **Settings → Basic**:
   - Salin **App ID** → isikan ke `FACEBOOK_CLIENT_ID`
   - Salin **App Secret** (klik Show) → isikan ke `FACEBOOK_CLIENT_SECRET`

---

## 5. 🖼️ CLOUDINARY (Penyimpanan Gambar & Media)

**Layanan:** [Cloudinary](https://cloudinary.com) — Gratis 25GB storage & 25GB bandwidth/bulan

**Digunakan untuk:** Avatar anggota, Kartu Anggota PNG, Thumbnail video

**Langkah Setup:**
1. Daftar di [cloudinary.com](https://cloudinary.com)
2. Setelah masuk, buka **Dashboard**
3. Di bagian **Account Details**, salin:
   - **Cloud Name** → isikan ke `CLOUDINARY_CLOUD_NAME` & `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
   - **API Key** → isikan ke `CLOUDINARY_API_KEY`
   - **API Secret** → isikan ke `CLOUDINARY_API_SECRET`

---

## ✅ Setelah Semua Nilai Terisi

### 1. Tambahkan `.env.local` ke `.gitignore`
Pastikan file `.gitignore` sudah berisi baris berikut (seharusnya sudah ada):
```
.env.local
```

### 2. Jalankan Prisma Migration
```bash
npx prisma migrate dev --name init
```

### 3. Generate Prisma Client
```bash
npx prisma generate
```

### 4. Jalankan Development Server
```bash
pnpm dev
```

Aplikasi akan berjalan di [http://localhost:3000](http://localhost:3000)

---

## 🚀 Setelah Selesai Setup

Beritahu developer bahwa file `.env.local` sudah siap diisi agar pengembangan komponen UI dan logika backend dapat dilanjutkan ke tahap berikutnya.

---

> ⚠️ **PENTING:** Jangan pernah commit file `.env.local` ke Git repository. File ini berisi kredensial rahasia yang harus dijaga kerahasiaannya.
