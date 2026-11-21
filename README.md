# Sahabat Misdinar Indonesia

Aplikasi web untuk jadwal dan pendaftaran kegiatan, keanggotaan, pembelajaran liturgi, dan administrasi pengurus.

## Pengembangan lokal

Siapkan Node.js, pnpm, dan PostgreSQL untuk pengembangan. Gunakan database lokal atau proyek Supabase dev yang terpisah dari production.

1. Salin .env.example ke .env.local dan isi konfigurasi sesuai [panduan environment](ENV_SETUP.md).
2. Jalankan pnpm install --frozen-lockfile.
3. Untuk database lokal baru, siapkan skema sesuai panduan environment.
4. Jalankan pnpm dev dan buka [localhost:3000](http://localhost:3000).

## Pemeriksaan

| Kebutuhan | Perintah |
| --- | --- |
| Lint | pnpm lint |
| Tes | pnpm test |
| Build | pnpm build |
| Jalankan hasil build | pnpm start |

Branch main digunakan untuk preview. Branch master digunakan untuk production. Kesiapan promosi dinilai per fitur.
