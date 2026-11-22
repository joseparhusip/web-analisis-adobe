# Panduan Deploy (24 jam, tanpa laptop)

Aplikasi butuh 2 layanan gratis:

- **Turso** = database (sudah kamu buat). Butuh **URL** + **Auth Token**.
- **Vercel** atau **Render** = tempat aplikasi jalan.

Kode sudah siap konek Turso lewat env `DATABASE_URL` + `DATABASE_AUTH_TOKEN`.

---

## Yang disiapkan dulu

1. **Kode di GitHub.** Push project ini ke satu repo GitHub (private boleh). Vercel/Render ambil kodenya dari situ. File `.env.local` dan `data/` tidak ikut ke-push (sudah di-gitignore) — aman.
2. **Nilai env** yang akan diisi di hosting:

| Env | Isi | Wajib |
|---|---|---|
| `DATABASE_URL` | URL Turso, `libsql://stock-research-xxx.turso.io` | ya |
| `DATABASE_AUTH_TOKEN` | token Turso | ya |
| `ACCESS_PASSWORD` | password masuk aplikasi (bebas, rahasiakan) | ya (karena URL publik) |
| `GEMINI_API_KEY` | API key Gemini | untuk fitur AI |
| `GEMINI_MODEL` | mis. `gemini-3.6-flash` (kosongkan = otomatis) | tidak |
| `GEMINI_FALLBACK_MODELS` | mis. `gemini-3.5-flash` | tidak |
| `SHUTTERSTOCK_CLIENT_ID` / `_SECRET` | opsional | tidak |

> Tabel database dibuat otomatis saat aplikasi pertama konek ke Turso. Tidak perlu migrasi manual.

---

## Opsi A — Vercel (paling gampang)

1. Buka vercel.com, **Sign up** pakai GitHub.
2. **Add New → Project**, pilih repo project ini, klik **Import**.
3. Di **Environment Variables**, isi semua env dari tabel di atas.
4. Klik **Deploy**. Tunggu selesai, dapat URL `https://namamu.vercel.app`.

Catatan: Vercel punya batas waktu per request. Panggilan AI yang lama (analisis aset, generate banyak prompt) bisa kepotong kalau plan gratisnya di bawah 60 detik. Kalau sering "Gagal" di fitur AI, pindah ke Render (Opsi B).

---

## Opsi B — Render (aman buat AI yang lama)

1. Buka render.com, **Sign up** pakai GitHub.
2. **New → Web Service**, pilih repo project ini.
3. Isi:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
4. Di **Environment**, tambahkan semua env dari tabel di atas.
5. Klik **Create Web Service**. Dapat URL `https://namamu.onrender.com`.

Catatan: plan gratis Render **tidur setelah 15 menit nganggur**; akses pertama setelah itu lambat ~30–60 detik, lalu normal.

---

## Setelah online

1. Buka URL-nya → muncul halaman **login** → masukkan `ACCESS_PASSWORD`.
2. Semua fitur jalan, data tersimpan di Turso (tidak hilang walau deploy ulang).
3. **Ekstensi Chrome**: buka Options ekstensi, ganti **Alamat aplikasi** ke URL hosting (bukan localhost), dan isi **Workspace ID** sesuai workspace yang dipakai.

## Kalau mau update kode nanti

Push perubahan ke GitHub → Vercel/Render otomatis build ulang dan deploy. Data di Turso tetap aman.
