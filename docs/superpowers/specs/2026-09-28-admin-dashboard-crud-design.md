# Spesifikasi Desain: Admin Dashboard Terpadu & Sistem CRUD SMI

- **Tanggal**: 2026-09-28
- **Topik**: Dashboard Admin, Manajemen Anggota (CRUD, Email, Password, Role, ACC), CRUD Jadwal Acara (Event), CRUD Galeri Video, dan Sinkronisasi Akun Public Relation ke Supabase.
- **Status**: Disetujui

---

## 1. Latar Belakang & Tujuan
Aplikasi Sahabat Misdinar Indonesia (SMI) sebelumnya telah memiliki proteksi middleware untuk rute `/admin` dan fitur verifikasi/ACC ID anggota di `/admin/page.tsx`, serta pencatatan pelanggaran di `/admin/pelanggaran`. Namun, belum tersedia modul CRUD lengkap untuk pengelolaan profil dan akun anggota (edit data, email, reset password, hapus akun), serta belum ada modul manajemen konten utama (Jadwal Kegiatan / Event dan Galeri Video).

Dokumen ini memuat spesifikasi teknis untuk membangun **Admin Dashboard Terpadu SMI** dengan pendekatan modular sub-rute Next.js App Router, layout sidebar modern yang responsif sesuai *Sacred Community Design System*, serta pembuatan dan sinkronisasi akun admin `publicrelation` ke database Supabase.

---

## 2. Akun Administrator Default & Akun Public Relation

### 2.1 Akun Bawaan (Seed)
* **Email**: `admin@smi.org`
* **Password**: `password123`
* **Role**: `ADMIN`
* **Member ID**: `SMI-ADM-001`
* **Pangkat**: Pengurus Pusat SMI

### 2.2 Akun Admin Public Relation
Ditambahkan ke database Supabase dan berkas `prisma/seed.ts`:
* **Email**: `publicrelation@smi.org`
* **Password**: `password123`
* **Role**: `ADMIN`
* **Member ID**: `SMI-PUBREL-001`
* **Nama**: `Public Relations SMI`
* **Nickname**: `PubRel SMI`
* **Paroki**: `Komunitas Sahabat Misdinar Indonesia`
* **Pangkat**: `Pengurus Humas`
* **isApproved**: `true`

---

## 3. Arsitektur Antarmuka & Tata Letak (Layout)

### 3.1 Layout Admin Terpadu (`src/app/admin/layout.tsx`)
* **Sidebar Kiri (Desktop: Fixed 260px, Mobile: Collapsible Drawer)**:
  * **Header**: Logo sirkular SMI, judul "SMI Pengurus", badge "Portal Admin".
  * **Menu Navigasi** (dengan Material Symbols Outlined):
    * 📊 `dashboard` — **Ringkasan (Overview)** (`/admin`)
    * 👥 `group` — **Manajemen Anggota** (`/admin/members`)
    * 📅 `calendar_month` — **Jadwal Kegiatan** (`/admin/events`)
    * 🎬 `smart_display` — **Galeri Video** (`/admin/videos`)
    * ⚠️ `warning` — **Poin Pelanggaran** (`/admin/pelanggaran`)
  * **Footer Sidebar**:
    * Kartu mini admin yang sedang login (Nama, Email, Avatar).
    * Tombol pintas: `arrow_back` "Kembali ke Web" & `logout` "Keluar".
* **Header / Topbar**:
  * Tombol toggle sidebar untuk layar mobile / tablet.
  * Breadcrumb rute aktif (misal: Portal Admin > Manajemen Anggota).
  * Indikator status real-time & role badge `ADMIN`.
* **Area Konten Utama**:
  * Menggunakan warna latar belakang `#fdf9f3` (Bone White).
  * Sudut kontainer kartu `rounded-2xl` atau `rounded-xl`.
  * Tombol aksi utama bertipe `rounded-full` (*pill-shaped*).

### 3.2 Struktur Sub-Rute
```text
src/app/admin/
├── layout.tsx                # Dedicated admin layout with responsive sidebar
├── page.tsx                  # Overview Dashboard (Ringkasan Statistik & Quick Actions)
├── loading.tsx               # Skeleton loader ringkasan
├── error.tsx                 # Error boundary admin
├── members/
│   ├── page.tsx              # Halaman Manajemen Anggota
│   ├── loading.tsx           # Skeleton tabel anggota
│   └── error.tsx
├── events/
│   ├── page.tsx              # Halaman CRUD Jadwal Kegiatan
│   ├── loading.tsx           # Skeleton jadwal
│   └── error.tsx
├── videos/
│   ├── page.tsx              # Halaman CRUD Galeri Video
│   ├── loading.tsx           # Skeleton video
│   └── error.tsx
└── pelanggaran/
    └── page.tsx              # Halaman Poin Pelanggaran (Existing & Refined)
```

---

## 4. Spesifikasi Modul Fungsional & CRUD

### 4.1 Modul Ringkasan Dashboard (`/admin`)
* **Metrik Statistik (Cards)**:
  1. **Total Anggota Terdaftar**: Menampilkan jumlah total dan badge jumlah anggota menunggu ACC (`isApproved === false`).
  2. **Jadwal Kegiatan**: Jumlah kegiatan aktif (`UPCOMING`) dan kegiatan selesai (`COMPLETED`).
  3. **Galeri Video**: Jumlah seluruh materi tutorial, galeri, dan fun fact.
  4. **Catatan Pelanggaran**: Akumulasi pelanggaran tercatat.
* **Pendaftar Terbaru (Quick Approval)**:
  * Menampilkan 5 pengguna terakhir yang mendaftar dan belum di-ACC.
  * Tombol instan "ACC Sekarang" langsung dari dashboard tanpa harus berpindah halaman.
* **Pintasan Aksi (Quick Action Buttons)**:
  * "Tambah Jadwal Baru" -> langsung membuka modal form jadwal.
  * "Tambah Video Baru" -> langsung membuka modal form video.

### 4.2 Modul Manajemen Anggota (`/admin/members`)
* **Komponen Client**: `AdminMembersManager.tsx`
* **Fitur**:
  * **Pencarian & Penyaringan**:
    * Search bar instan berdasarkan Nama, Email, atau ID Anggota.
    * Filter tab: Semua (`ALL`), Menunggu ACC (`PENDING`), Aktif (`APPROVED`), Pengurus (`ADMIN`).
  * **Tabel Anggota**:
    * Kolom: Avatar/Nama, Email, Paroki, Pangkat, ID Anggota, Koin, Poin Pelanggaran, Status ACC, Aksi.
  * **Modal Edit Anggota Lengkap**:
    * Field yang dapat diedit: Nama Lengkap, Nama Panggilan, Email, Asal Paroki, Pangkat (Pilihan: Mula, Madya, Utama, Pembina, Pengurus), Role (`MEMBER` / `ADMIN`), Jumlah Koin, ID Unik Anggota (`memberId`), Status ACC (`isApproved`).
  * **Modal Reset Password**:
    * Admin dapat memasukkan kata sandi baru (minimal 6 karakter) untuk anggota tertentu.
  * **Aksi Hapus Anggota**:
    * Konfirmasi dialog sebelum penghapusan data secara permanen dari basis data.

### 4.3 Modul Jadwal Kegiatan / Event (`/admin/events`)
* **Komponen Client**: `AdminEventsManager.tsx`
* **Fitur**:
  * **Tampilan Data**:
    * Tampilan kartu responsif / tabel jadwal.
    * Filter kategori: `ALL`, `WEBINAR`, `TEMU_ONLINE`, `WORKSHOP`, `ACARA`.
    * Filter status: `UPCOMING`, `COMPLETED`.
  * **Formulir Tambah & Edit Event**:
    * Judul Kegiatan (wajib)
    * Deskripsi (opsional)
    * Kategori (Dropdown: WEBINAR, TEMU_ONLINE, WORKSHOP, ACARA)
    * Tanggal pelaksanaan (Date picker)
    * Waktu/Jam (Teks, misal: "19:00 - 21:00 WIB")
    * Lokasi / Platform (Teks, misal: "Zoom Meeting & YouTube Live SMI")
    * Status (Dropdown: UPCOMING, COMPLETED)
  * **Aksi Hapus Event**:
    * Dialog konfirmasi hapus jadwal.

### 4.4 Modul Galeri Video (`/admin/videos`)
* **Komponen Client**: `AdminVideosManager.tsx`
* **Fitur**:
  * **Tampilan Data**:
    * Kartu video dengan thumbnail, durasi, jumlah views, kategori, dan lencana "Featured" (Unggulan).
    * Filter kategori: `ALL`, `TUTORIAL`, `GALLERY`, `FUN_FACT`.
  * **Formulir Tambah & Edit Video**:
    * Judul Video (wajib)
    * Deskripsi (opsional)
    * Kategori (TUTORIAL, GALLERY, FUN_FACT)
    * URL Video (Tautan YouTube valid)
    * URL Thumbnail (Otomatis diekstrak dari YouTube ID `img.youtube.com/vi/<id>/hqdefault.jpg` jika dikosongkan)
    * Durasi (misal: "12:45")
    * Pembuat / Author (default: "SMI Media")
    * Toggle Featured / Unggulan di Beranda
  * **Aksi Hapus Video**:
    * Dialog konfirmasi hapus video.

---

## 5. Spesifikasi API Backend (`src/app/api/admin/`)

Semua endpoint dilindungi oleh verifikasi session NextAuth dengan role `ADMIN`.

| Endpoint | Method | Deskripsi |
|---|---|---|
| `/api/admin/stats` | `GET` | Mengambil data agregasi untuk Ringkasan Dashboard |
| `/api/admin/members` | `GET` | Mengambil daftar anggota lengkap |
| `/api/admin/members` | `POST` | Toggle approval atau update cepat ID anggota |
| `/api/admin/members/[id]` | `PUT` | Mengupdate seluruh atribut profil anggota |
| `/api/admin/members/[id]` | `DELETE` | Menghapus akun anggota |
| `/api/admin/members/[id]/reset-password` | `POST` | Reset password anggota oleh admin |
| `/api/admin/events` | `GET` | Mengambil daftar jadwal event |
| `/api/admin/events` | `POST` | Menambah jadwal event baru |
| `/api/admin/events/[id]` | `PUT` | Mengubah jadwal event |
| `/api/admin/events/[id]` | `DELETE` | Menghapus jadwal event |
| `/api/admin/videos` | `GET` | Mengambil daftar galeri video |
| `/api/admin/videos` | `POST` | Menambah video baru |
| `/api/admin/videos/[id]` | `PUT` | Mengubah data video |
| `/api/admin/videos/[id]` | `DELETE` | Menghapus video |

---

## 6. Standar Kualitas, Desain & Aturan Teknis
1. **Warna Dasar**: Tetap konsisten menggunakan `#fdf9f3` (Bone White) untuk seluruh kontainer utama.
2. **Bentuk Tombol**: Semua tombol aksi utama bertipe bulat penuh (`rounded-full` / pill-shaped).
3. **Ikonografi**: Seluruh ikon hanya menggunakan `Material Symbols Outlined`.
4. **Optimasi Gambar**: Foto dan thumbnail wajib menggunakan `<Image />` dari `next/image`.
5. **Server Component & Leaf Client Component**:
   * Penampung halaman utama (`page.tsx`) mengambil data awal via Server-Side Prisma.
   * Komponen form/modal dan interaktivitas diturunkan ke client component daun.
6. **Loading & Error State**: Setiap rute memiliki `loading.tsx` berskeleton rapi dan `error.tsx` informatif.

---

## 7. Rencana Rilis, Migrasi & Deployment
1. Update skrip `prisma/seed.ts` agar menyertakan akun `publicrelation@smi.org` dan memastikan integritas data.
2. Sinkronisasi skema ke Supabase via `npx prisma db push`.
3. Jalankan seed ke Supabase database (`npx prisma db seed`).
4. Commit dan push seluruh perubahan ke GitHub repository `PubRelSMI/smi-app` di branch `master`.
