# Admin Dashboard & Sistem CRUD SMI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun Admin Dashboard terpadu dengan navigasi sidebar responsif untuk manajemen metrik ringkasan, CRUD anggota lengkap (edit email, data profil, reset password, hapus akun), CRUD Jadwal Acara (Event), dan CRUD Galeri Video, serta memastikan sinkronisasi ke Supabase dan push ke GitHub `PubRelSMI/smi-app`.

**Architecture:** Menggunakan arsitektur modular Next.js 14+ App Router dengan layout admin terpadu (`src/app/admin/layout.tsx`) berbasis *Sacred Community Design System*. Setiap modul memiliki sub-rute mandiri dengan Server Component untuk pengambilan data real-time, leaf Client Components untuk interaktivitas formulir/modal, serta endpoint API aman yang diproteksi session role `ADMIN`.

**Tech Stack:** Next.js 14/15 App Router, React, TypeScript, Tailwind CSS, Prisma ORM, PostgreSQL (Supabase), NextAuth.js, Bcryptjs, Material Symbols Outlined.

## Global Constraints
- Palet warna latar belakang kontainer wajib menggunakan nada hangat `#fdf9f3` (Bone White).
- Semua tombol aksi utama harus bertipe bulat penuh (`rounded-full` / pill-shaped).
- Ikonografi terstandarisasi hanya dari pustaka `Material Symbols Outlined`.
- Semua aset gambar wajib dirender menggunakan komponen `<Image />` dari `next/image`.
- Batasi penggunaan arahan `'use client'` hanya pada komponen daun interaktif.
- Setiap rute admin wajib dilengkapi `loading.tsx` (skeleton) dan `error.tsx`.

---

### Task 1: Pembaruan Konfigurasi Lingkungan & Tombol Google Coming Soon

**Files:**
- Modify: `src/app/(auth)/login/page.tsx`
- Modify: `.env.local`
- Modify: `.env.prod`
- Modify: `prisma/seed.ts`

**Interfaces:**
- Memastikan tombol Google login bertuliskan `Masuk dengan Google [COMING SOON]` dan dinonaktifkan.
- Memastikan akun `publicrelation@smi.org` dan `publicrelationsahabatmisdinar@gmail.com` tercatat dalam seed dan database Supabase sebagai ADMIN.

- [ ] **Step 1: Verifikasi teks Google Coming Soon di halaman login**
Pastikan tombol di `src/app/(auth)/login/page.tsx` memiliki label `Masuk dengan Google [COMING SOON]` dan atribut `disabled`.

- [ ] **Step 2: Update prisma/seed.ts dengan akun admin Public Relation**
Tambahkan `publicrelation@smi.org` dan `publicrelationsahabatmisdinar@gmail.com` sebagai `ADMIN` ter-ACC pada berkas `prisma/seed.ts`.

- [ ] **Step 3: Commit konfigurasi awal**
```bash
git add src/app/\(auth\)/login/page.tsx prisma/seed.ts docs/
git commit -m "feat(auth): add coming soon to google login and update seed admin credentials"
```

---

### Task 2: API Endpoints Admin untuk Anggota, Event, dan Video

**Files:**
- Create: `src/app/api/admin/stats/route.ts`
- Create: `src/app/api/admin/members/[id]/route.ts`
- Create: `src/app/api/admin/members/[id]/reset-password/route.ts`
- Create: `src/app/api/admin/events/route.ts`
- Create: `src/app/api/admin/events/[id]/route.ts`
- Create: `src/app/api/admin/videos/route.ts`
- Create: `src/app/api/admin/videos/[id]/route.ts`

**Interfaces:**
- Helper proteksi: `getServerSession(authOptions)` memeriksa `user.role === 'ADMIN'`.
- Response: JSON `{ success: boolean, data?: any, error?: string }`.

- [ ] **Step 1: Implementasi API Stats (`/api/admin/stats/route.ts`)**
Mengembalikan agregasi total user, total user pending ACC, total events aktif, total video, dan 5 pendaftar terbaru.

- [ ] **Step 2: Implementasi API Update & Delete Anggota (`/api/admin/members/[id]/route.ts`)**
Mendukung `PUT` untuk update seluruh atribut profil (name, nickname, email, parish, rank, role, coins, isApproved, memberId) dan `DELETE` untuk menghapus anggota (dengan proteksi admin tidak dapat menghapus dirinya sendiri).

- [ ] **Step 3: Implementasi API Reset Password Anggota (`/api/admin/members/[id]/reset-password/route.ts`)**
Mendukung `POST` dengan body `{ newPassword }`, melakukan hash bcrypt, dan menyimpan password baru.

- [ ] **Step 4: Implementasi API CRUD Events (`/api/admin/events/route.ts` & `[id]/route.ts`)**
Mendukung `GET` (daftar event), `POST` (buat event baru), `PUT` (update event), `DELETE` (hapus event).

- [ ] **Step 5: Implementasi API CRUD Videos (`/api/admin/videos/route.ts` & `[id]/route.ts`)**
Mendukung `GET` (daftar video), `POST` (tambah video dengan thumbnail auto-detect), `PUT` (update video), `DELETE` (hapus video).

- [ ] **Step 6: Commit backend API**
```bash
git add src/app/api/admin/
git commit -m "feat(api): implement admin stats, members, events, and videos endpoints"
```

---

### Task 3: Layout Admin Sidebar Terpadu

**Files:**
- Modify: `src/app/admin/layout.tsx`
- Create: `src/components/admin/AdminSidebar.tsx`
- Create: `src/components/admin/AdminHeader.tsx`

**Interfaces:**
- Props `AdminSidebar`: `{ currentPath: string, adminUser: { name: string, email: string, role: string } }`
- Responsive toggle untuk drawer sidebar mobile menggunakan state client.

- [ ] **Step 1: Buat komponen `AdminSidebar.tsx`**
Sidebar kiri dengan logo SMI, menu navigasi (Overview, Anggota, Jadwal, Video, Pelanggaran), badge "Portal Admin", kartu profil admin aktif, dan tombol "Kembali ke Web".

- [ ] **Step 2: Buat komponen `AdminHeader.tsx`**
Header atas dengan hamburger menu toggle (mobile), breadcrumb title, dan status indikator.

- [ ] **Step 3: Update `src/app/admin/layout.tsx`**
Integrasikan sidebar dan header dengan layout fleksibel (`flex min-h-screen bg-background`), melayani seluruh sub-rute admin.

- [ ] **Step 4: Commit layout admin**
```bash
git add src/app/admin/layout.tsx src/components/admin/AdminSidebar.tsx src/components/admin/AdminHeader.tsx
git commit -m "feat(admin): build unified responsive admin sidebar layout"
```

---

### Task 4: Halaman Overview Dashboard (`/admin`)

**Files:**
- Modify: `src/app/admin/page.tsx`
- Create: `src/components/admin/AdminOverviewClient.tsx`
- Create: `src/app/admin/loading.tsx`
- Create: `src/app/admin/error.tsx`

**Interfaces:**
- Server Component mengambil data statistik awal via Prisma.
- Client Component menampilkan kartu metrik, pintasan cepat (tambah event, tambah video), dan tabel 5 pendaftar pending dengan tombol aksi cepat ACC.

- [ ] **Step 1: Buat komponen `AdminOverviewClient.tsx`**
Desain kartu metrik bergradien lembut, grid statistik, tombol shortcut aksi cepat, dan tabel pendaftar pending dengan animasi status.

- [ ] **Step 2: Update `src/app/admin/page.tsx`**
Ambil data statistik secara server-side dan render `AdminOverviewClient`.

- [ ] **Step 3: Buat `loading.tsx` dan `error.tsx`**
Skeleton loader rapi dan error fallback khusus rute admin overview.

- [ ] **Step 4: Commit modul overview**
```bash
git add src/app/admin/page.tsx src/components/admin/AdminOverviewClient.tsx src/app/admin/loading.tsx src/app/admin/error.tsx
git commit -m "feat(admin): build admin overview dashboard with stats and quick approval"
```

---

### Task 5: Modul Manajemen Anggota Lengkap (`/admin/members`)

**Files:**
- Create: `src/app/admin/members/page.tsx`
- Create: `src/app/admin/members/loading.tsx`
- Create: `src/app/admin/members/error.tsx`
- Create: `src/components/admin/AdminMembersManager.tsx`

**Interfaces:**
- Fitur: Pencarian instan (nama/email/memberId), filter status (All, Pending, Approved, Admin), modal Edit Profil Lengkap, modal Reset Password, modal Konfirmasi Hapus Anggota.

- [ ] **Step 1: Buat komponen `AdminMembersManager.tsx`**
Komponen client interaktif lengkap dengan tabel data responsif, form modal edit profil, form modal ganti password baru, dan dialog konfirmasi hapus.

- [ ] **Step 2: Buat halaman `src/app/admin/members/page.tsx`**
Server Component yang melakukan query `prisma.user.findMany()` dan menyalurkannya ke `AdminMembersManager`.

- [ ] **Step 3: Buat `loading.tsx` dan `error.tsx` untuk members**
Skeleton loader tabel pengguna.

- [ ] **Step 4: Commit modul members**
```bash
git add src/app/admin/members/ src/components/admin/AdminMembersManager.tsx
git commit -m "feat(admin): implement full member management with edit, reset password, and delete"
```

---

### Task 6: Modul CRUD Jadwal Kegiatan / Event (`/admin/events`)

**Files:**
- Create: `src/app/admin/events/page.tsx`
- Create: `src/app/admin/events/loading.tsx`
- Create: `src/app/admin/events/error.tsx`
- Create: `src/components/admin/AdminEventsManager.tsx`

**Interfaces:**
- Fitur: Tampilan daftar kegiatan, filter kategori (WEBINAR, TEMU_ONLINE, WORKSHOP, ACARA), filter status (UPCOMING, COMPLETED), modal Tambah/Edit Event, dan aksi Hapus Event.

- [ ] **Step 1: Buat komponen `AdminEventsManager.tsx`**
Formulir input judul, deskripsi, kategori, tanggal, waktu, link/lokasi, dan status dengan validasi.

- [ ] **Step 2: Buat halaman `src/app/admin/events/page.tsx`**
Server Component yang memuat data `prisma.event.findMany({ orderBy: { date: 'asc' } })`.

- [ ] **Step 3: Buat `loading.tsx` dan `error.tsx` untuk events**
Skeleton loader jadwal.

- [ ] **Step 4: Commit modul events**
```bash
git add src/app/admin/events/ src/components/admin/AdminEventsManager.tsx
git commit -m "feat(admin): build event scheduling CRUD management"
```

---

### Task 7: Modul CRUD Galeri Video (`/admin/videos`)

**Files:**
- Create: `src/app/admin/videos/page.tsx`
- Create: `src/app/admin/videos/loading.tsx`
- Create: `src/app/admin/videos/error.tsx`
- Create: `src/components/admin/AdminVideosManager.tsx`

**Interfaces:**
- Fitur: Galeri video dengan thumbnail preview, filter kategori (TUTORIAL, GALLERY, FUN_FACT), modal Tambah/Edit Video (auto ekstrak thumbnail YouTube `img.youtube.com/vi/<id>/hqdefault.jpg`), toggle Featured, dan aksi Hapus Video.

- [ ] **Step 1: Buat komponen `AdminVideosManager.tsx`**
Formulir input URL YouTube, judul, deskripsi, kategori, durasi, pembuat konten, dan switch Featured.

- [ ] **Step 2: Buat halaman `src/app/admin/videos/page.tsx`**
Server Component yang memuat data `prisma.video.findMany({ orderBy: { createdAt: 'desc' } })`.

- [ ] **Step 3: Buat `loading.tsx` dan `error.tsx` untuk videos**
Skeleton loader kartu video.

- [ ] **Step 4: Commit modul videos**
```bash
git add src/app/admin/videos/ src/components/admin/AdminVideosManager.tsx
git commit -m "feat(admin): build video gallery CRUD management with youtube thumbnail extraction"
```

---

### Task 8: Pengujian Menyeluruh, Build Check, & Push ke GitHub `PubRelSMI/smi-app`

**Files:**
- Touch: all created/modified files

- [ ] **Step 1: Jalankan build check Next.js**
Pastikan tidak ada kesalahan kompilasi TypeScript atau linting:
```bash
pnpm build
```

- [ ] **Step 2: Jalankan verifikasi query database**
Pastikan database Supabase dapat melayani seluruh query data admin secara instan.

- [ ] **Step 3: Push commit ke GitHub `PubRelSMI/smi-app`**
```bash
git push origin master
```
