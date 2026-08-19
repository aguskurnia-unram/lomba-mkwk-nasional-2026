# Setup Penilaian Juri (Cloudflare D1)

**Status: database sudah dibuat & skema sudah diterapkan.** ✅

Database `mkwk-juri-db` (`database_id: f8b65ade-6ab8-4d84-a5ae-6227c6a4de39`)
dibuat lewat dashboard Cloudflare (D1 → Console), tabel `scores` beserta
index-nya sudah dieksekusi di sana, dan binding `DB` sudah dipasang ke Worker
`lomba-mkwk-nasional-2026` lewat dashboard juga. `wrangler.jsonc` di repo ini
sudah mencerminkan `database_id` yang sama, supaya deploy berikutnya (lewat
CLI atau pipeline apa pun) tidak menghapus binding yang sudah ada di
dashboard.

## Yang tersisa: deploy

```bash
npx wrangler deploy
```

atau tunggu auto-deploy Anda jalan (kalau situs ini auto-deploy dari `main`).
Setelah deploy, `/panitia/nilai/` akan menunjukkan status **"Terhubung"**
(bukan lagi banner "Tidak terhubung"), dan skor yang diisi juri benar-benar
tersimpan ke database — bisa dibuka dari perangkat mana pun selama memakai
sandi & nama juri yang sama.

### Kalau ingin menerapkan skema lewat CLI juga (opsional, aman diulang)

Skema di `migrations/0001_init.sql` memakai `CREATE TABLE IF NOT EXISTS`,
jadi menjalankannya lagi lewat CLI tidak akan merusak apa pun kalau suatu
saat Anda ingin menyamakan riwayat migrasi CLI:

```bash
npx wrangler d1 execute mkwk-juri-db --remote --file=./migrations/0001_init.sql
```

---

## Ganti sandi akses (opsional)

Sandi `LombaMKWK` dipakai untuk membuka `/panitia/`, `/panitia/nilai/`, **dan**
sebagai token yang divalidasi server di `src/worker.js` untuk `POST/GET
/api/scores`. Untuk menggantinya, ubah nilai `JURI_TOKEN` di `wrangler.jsonc`
(bagian `vars`) lalu `wrangler deploy` ulang — dan perbarui juga `PASSWORD`
di `panitia/index.html` serta `panitia/nilai/index.html` (dicari dengan
`grep -rn LombaMKWK`) supaya ketiganya tetap konsisten.

Catatan: ini bukan otentikasi tingkat produksi (satu sandi dipakai bersama,
tidak ada akun per-juri) — cukup untuk mencegah orang random menemukan
tautan dan mengisi skor asal, tapi siapa pun yang tahu sandi bisa menulis
atas nama juri lain. Untuk kompetisi dengan risiko lebih tinggi, pertimbangkan
otentikasi per-juri (mis. Cloudflare Access).

## Alternatif tanpa server (tetap tersedia)

Kalau sewaktu-waktu web-nya bermasalah, workbook
`Penilaian-Juri-Lomba-Project-MKWK-Nasional-2026.xlsx` yang sudah dikirim
terpisah tetap bisa dipakai — unggah ke Google Drive (otomatis jadi Google
Sheets), lalu bagikan ke dewan juri untuk diisi bersama. Sheet ini punya
rubrik, kolom skor per juri, dan rekap peringkat otomatis yang sama seperti
versi web.
