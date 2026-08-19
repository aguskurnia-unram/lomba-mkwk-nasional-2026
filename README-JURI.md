# Setup Penilaian Juri (Cloudflare D1)

Fitur "Penilaian Juri" di `/panitia/nilai/` butuh database Cloudflare D1 yang
belum dibuat otomatis — sesi ini tidak punya kredensial akun Cloudflare Anda,
jadi 3 langkah di bawah perlu dijalankan sekali oleh Anda (dari komputer yang
sudah login Cloudflare, atau `wrangler login` dulu).

## 1. Buat database D1

```bash
npx wrangler d1 create mkwk-juri-db
```

Perintah ini mencetak `database_id`. Blok `d1_databases` sengaja **belum ada**
di `wrangler.jsonc` (dihapus sementara agar `wrangler deploy` untuk seluruh
situs tidak gagal gara-gara ID placeholder) — tambahkan kembali di akhir
file, sebelum kurung kurawal penutup terakhir:

```jsonc
  },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "mkwk-juri-db",
      "database_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  // ← dari output perintah di atas
    }
  ]
}
```

## 2. Terapkan skema tabel

```bash
npx wrangler d1 execute mkwk-juri-db --remote --file=./migrations/0001_init.sql
```

## 3. Deploy

```bash
npx wrangler deploy
```

Setelah ini, `/panitia/nilai/` bisa dibuka dan skor yang diisi juri akan
tersimpan sungguhan (bukan hanya di browser mereka).

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

## Alternatif tanpa server (siap pakai sekarang)

Jika setup D1 di atas belum sempat dilakukan, gunakan workbook
`Penilaian-Juri-Lomba-Project-MKWK-Nasional-2026.xlsx` yang sudah dikirim
terpisah — unggah ke Google Drive (otomatis jadi Google Sheets), lalu bagikan
ke dewan juri untuk diisi bersama. Sheet ini punya rubrik, kolom skor per
juri, dan rekap peringkat otomatis yang sama seperti versi web.
