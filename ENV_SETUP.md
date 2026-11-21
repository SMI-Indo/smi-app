# Setup SMI

## Environment lokal

Salin .env.example ke .env.local. Isi DATABASE_URL dengan koneksi runtime PostgreSQL dan DIRECT_URL dengan koneksi langsung atau session pooler untuk Prisma CLI. Prisma CLI membaca .env.local lalu .env dan memilih DIRECT_URL jika tersedia. Runtime memilih DATABASE_URL.

Gunakan NEXTAUTH_URL=http://localhost:3000 untuk pengembangan lokal. Buat NEXTAUTH_SECRET dengan generator kriptografis, misalnya node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))". Simpan nilai environment dan kredensial di luar Git.

## Skema PostgreSQL

- **Database lokal baru.** Pastikan DATABASE_URL dan DIRECT_URL menunjuk ke database lokal yang sama. Jalankan pnpm exec prisma db push lalu pnpm exec prisma generate. Instalasi dependensi juga menjalankan prisma generate lewat postinstall.
- **Database dengan skema yang sudah ada.** Bandingkan tabel dan kolom aktual dengan prisma/schema.prisma. Uji skrip aditif yang diperlukan pada salinan dev dengan skema awal yang setara. Skrip dasar di prisma/sql/ adalah 20261112_liturgical_guide.sql, 20261112_registrations_violations_merchandise.sql, dan 20261114_registration_fields.sql, berurutan. Terapkan skrip berikutnya sesuai fitur dan skema lingkungan.
- **Data contoh.** pnpm exec prisma db seed mengganti beberapa dataset contoh. Jalankan hanya pada database dev/lokal yang boleh kehilangan data tersebut.

## Integrasi dan rilis

- main untuk preview dan master untuk production. Periksa database dan konfigurasi setiap lingkungan secara terpisah. Promosikan fitur setelah verifikasi di preview.
- Isi RESEND_API_KEY dan EMAIL_FROM (alamat pengirim terverifikasi) untuk email. Tanpa konfigurasi ini transaksi tetap tersimpan.
- Login Google nonaktif. Kuis Liturgi default nonaktif dan dikendalikan oleh ENABLE_LITURGY_QUIZ.
- Badge Beta tampil di Vercel production. PREVIEW_BETA_NAVBAR=true menampilkannya di preview. NAV_COMING_SOON berisi daftar fitur yang belum siap, dipisahkan koma. Pilihan yang tersedia adalah event, merchandise, video, quiz, coin, dan membership. Flag ini mengatur tampilan menu dan promosi beranda. Akses rute tetap mengikuti aturan server masing-masing.
- REGISTRATION_HOST opsional. Isi dengan hostname daftar.<domain> tanpa protokol atau path setelah DNS dan proyek Vercel dikonfigurasi. URL /daftar/<slug> dan /daftar-<slug> tetap tersedia. REGISTRATION_VIEW_SECRET opsional untuk kode daftar peserta dan memakai NEXTAUTH_SECRET sebagai fallback.

## Pembatalan pelanggaran

Sebelum merilis alur pembatalan, periksa kolom `cancellationReason`, `cancelledById`, dan `cancelledAt` pada tabel `ViolationRecord`. Uji `prisma/sql/20261114_violation_cancellation.sql` di salinan dev jika ketiga kolom belum ada, lalu verifikasi pencatatan, riwayat, dan dua permintaan pembatalan bersamaan. Kolom ini diperlukan untuk riwayat pengurus meski fitur bukti privat masih nonaktif.

## Bukti pelanggaran privat

Fitur default nonaktif. Uji menggunakan database dan Storage preview sebelum menyetel ENABLE_VIOLATION_EVIDENCE=true.

1. Periksa skema preview dan terapkan prisma/sql/20261114_private_violation_evidence.sql jika diperlukan. Periksa bahwa bucket violation-evidence bersifat privat.
2. Isi SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di server. Simpan service role key tanpa prefix NEXT_PUBLIC_.
3. Generate ulang Prisma Client. Uji unggah PNG/JPEG/WebP dan pembacaan bukti dengan sesi admin, serta penolakan akses anggota dan tamu. Batasnya tiga gambar, masing-masing 1 MiB setelah kompresi.
4. Unggahan dijurnal sebelum request Storage. Kegagalan unggah mempunyai masa tunggu satu jam sebelum pembersihan. POST /api/admin/evidence-cleanup memproses maksimal 100 entri jatuh tempo per pemanggilan dengan sesi admin. Penjadwalan otomatis belum dikonfigurasi. Pertahankan antrean dan akses pembersihan saat unggahan dimatikan.

Reset atau ganti kata sandi mengakhiri sesi berbasis kredensial lama. Sesi JWT dari sebelum perubahan keamanan dapat meminta login ulang.
