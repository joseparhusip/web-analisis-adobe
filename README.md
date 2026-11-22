# Stock Research

Aplikasi riset tema & keyword untuk kontributor Adobe Stock: skor peluang per tipe aset, tren Google, keyword turunan, analisis aset dari gambar (AI), generator prompt Google Flow, kalender tema musiman, dan scan keyword massal.

Dibangun dengan **Next.js 15 + TypeScript**, **Tailwind CSS v4**, **Drizzle ORM + libSQL/SQLite** (lokal atau Turso), dan **Recharts**. AI mendukung **Gemini, OpenAI (ChatGPT), Claude, Grok, dan DeepSeek**, diatur dari halaman Pengaturan.

## Fitur

- **Riset keyword** — skor peluang per tipe aset (foto, ilustrasi, vektor, video) dari permintaan vs persaingan.
- **Tren Google** 5 tahun + pola musiman per bulan.
- **Keyword turunan (long-tail)** dari pencarian nyata Google & YouTube.
- **Prompt Google Flow** — generator prompt siap pakai, bisa banyak variasi sekaligus.
- **Analisis aset dari gambar** — metadata (judul, kategori, keyword) + mode "amati & modifikasi".
- **Niche sepi pesaing** & **scan keyword massal**.
- **Kalender tema musiman** dengan jendela waktu upload.
- **Multi-workspace** + kunci password, siap dibagikan.

## Daftar isi

1. [Prasyarat](#1-prasyarat)
2. [Clone repo](#2-clone-repo)
3. [Jalankan di localhost](#3-jalankan-di-localhost)
4. [Environment variables](#4-environment-variables)
5. [Database Turso (produksi)](#5-database-turso-produksi)
6. [Deploy ke Vercel](#6-deploy-ke-vercel)
7. [Ekstensi Chrome](#7-ekstensi-chrome-opsional)
8. [Perintah npm](#8-perintah-npm)
9. [Struktur folder](#9-struktur-singkat)

---

## 1. Prasyarat

Kamu **hanya perlu menginstall 2 hal**: **Git** dan **Node.js**.

> **Next.js, TypeScript, Tailwind, dan semua library lain TIDAK perlu diinstall manual.** Semuanya sudah terdaftar di `package.json` dan terpasang otomatis saat kamu menjalankan `npm install` (langkah 3). `npm` sendiri ikut terpasang bersama Node.js.

### Install Node.js

**Windows / macOS (cara termudah):**

1. Buka [nodejs.org](https://nodejs.org).
2. Unduh versi **LTS** (installer `.msi` untuk Windows, `.pkg` untuk macOS).
3. Jalankan installer-nya, klik **Next/Continue** sampai selesai (biarkan opsi default).
4. **Tutup dan buka ulang** terminal/PowerShell.
5. Verifikasi — harus muncul nomor versinya:
   ```bash
   node -v
   npm -v
   ```

**Linux:**

```bash
# via nvm (disarankan)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
nvm install --lts
```

**Alternatif baris perintah:**

| OS | Perintah |
|----|----------|
| Windows | `winget install OpenJS.NodeJS.LTS` |
| macOS | `brew install node` |

> Butuh **Node.js 20 atau lebih baru**. Kalau `node -v` menampilkan versi di bawah 20, update dulu.

### Install Git

Kalau `git --version` belum muncul: unduh dari [git-scm.com](https://git-scm.com) (Windows/macOS), atau `sudo apt install git` (Linux).

---

## 2. Clone repo

Perintahnya sama di semua OS. Buka terminal (Windows: **PowerShell** atau **Git Bash**; macOS/Linux: **Terminal**):

```bash
git clone https://github.com/joseparhusip/web-analisis-adobe.git
cd web-analisis-adobe
```

---

## 3. Jalankan di localhost

```bash
# 1. Install dependency
npm install

# 2. Siapkan file environment
cp .env.example .env        # macOS/Linux/Git Bash
# Windows PowerShell:
#   Copy-Item .env.example .env

# 3. Jalankan
npm run dev
```

> `npm install` otomatis mengunduh **Next.js, TypeScript, dan semua library** ke folder `node_modules` (butuh internet; agak lama di menit pertama). Setelah itu tidak perlu diulang kecuali ada perubahan dependency.

Buka **http://localhost:3000**.

- Tanpa mengisi apa pun, aplikasi langsung jalan dengan **database file lokal** (`data/research.db`, dibuat otomatis).
- **Fitur AI** butuh API key: isi lewat halaman **Pengaturan** di dalam aplikasi (disarankan), atau set `GEMINI_API_KEY` di `.env`.
- Untuk dev yang lebih cepat: `npm run dev:turbo`.

---

## 4. Environment variables

Semua opsional untuk jalan lokal. Key AI selain Gemini diisi lewat **UI Pengaturan**, bukan env.

| Variabel | Fungsi | Default |
|----------|--------|---------|
| `DATABASE_URL` | Lokasi database. File lokal atau URL Turso. | `file:./data/research.db` |
| `DATABASE_AUTH_TOKEN` | Token Turso (kosong untuk file lokal). | – |
| `ACCESS_PASSWORD` | Kunci login seluruh aplikasi. Kosong = tanpa login. **Wajib diisi saat di-deploy publik.** | – |
| `GEMINI_API_KEY` | Fallback API key Gemini (bisa juga diisi dari UI). | – |
| `GEMINI_MODEL` | Model Gemini default (kosong = otomatis). | – |
| `GEMINI_FALLBACK_MODELS` | Model cadangan Gemini, dipisah koma. | – |
| `SHUTTERSTOCK_CLIENT_ID` / `_SECRET` | Pembanding jumlah aset (opsional). | – |

---

## 5. Database Turso (produksi)

Database file lokal tidak cocok untuk hosting (filesystem-nya sementara, data hilang tiap deploy). Pakai **Turso** (SQLite di cloud, gratis) agar data permanen dan aplikasi bisa online 24 jam tanpa laptop menyala.

1. Daftar di [turso.tech](https://turso.tech) (login GitHub).
2. **Create Database** → nama bebas, lokasi **Singapore** (terdekat dari Indonesia). Biarkan opsi "TursoDB (Rust)" **mati**.
3. Buka database → **Copy URL** (`libsql://...turso.io`).
4. **Create Token** → Expires **Never**, Authorization **Read & Write** → salin tokennya.
5. Masukkan ke env:
   ```
   DATABASE_URL=libsql://nama-db-xxxx.turso.io
   DATABASE_AUTH_TOKEN=token-dari-turso
   ```

Tes lokal dulu: isi dua baris itu di `.env`, jalankan `npm run dev`. Kalau aplikasi jalan normal, berarti Turso tersambung. Tabel dibuat otomatis saat koneksi pertama.

---

## 6. Deploy ke Vercel

1. **Push** kode ke GitHub.
2. Buka [vercel.com](https://vercel.com), login GitHub → **Add New → Project** → pilih repo → **Import**.
3. Framework terdeteksi **Next.js** (biarkan default).
4. Di **Environment Variables**, isi minimal:
   - `DATABASE_URL`, `DATABASE_AUTH_TOKEN` (dari Turso)
   - `ACCESS_PASSWORD` (wajib, karena URL publik)
   - `GEMINI_API_KEY` (atau isi key AI lain nanti dari UI Pengaturan)
5. **Deploy**. Dapat URL `https://namamu.vercel.app`.
6. Buka URL → login dengan `ACCESS_PASSWORD`.

> Alternatif: **Render** (free web service). Build command `npm install && npm run build`, start command `npm run start`. Render tidak membatasi durasi request (aman untuk panggilan AI yang lama), tapi tidur setelah 15 menit nganggur.

Tiap `git push` berikutnya memicu deploy ulang otomatis; data di Turso tetap aman.

---

## 7. Ekstensi Chrome (opsional)

Untuk menangkap jumlah aset & terlaris dari Adobe Stock (Adobe tidak punya API publik untuk ini).

1. Buka `chrome://extensions`, nyalakan **Developer mode**.
2. **Load unpacked** → pilih folder **`extension`** di dalam project ini.
3. Klik ikon ekstensi → **Options**:
   - **Alamat aplikasi**: `http://localhost:3000` (lokal) atau URL Vercel (produksi).
   - **Workspace ID**: sesuai workspace yang dipakai (default: `default`).
4. Di halaman Riset, klik **"Buka terlaris di Adobe Stock"** — datanya tercatat otomatis.

---

## 8. Perintah npm

| Perintah | Fungsi |
|----------|--------|
| `npm run dev` | Mode development |
| `npm run dev:turbo` | Development dengan Turbopack (lebih cepat) |
| `npm run build` | Build produksi |
| `npm run start` | Jalankan hasil build |
| `npm run share` | Build + start (untuk dibagikan via ngrok/produksi lokal) |
| `npm run typecheck` | Cek tipe TypeScript |
| `npm run db:generate` | Generate migrasi Drizzle setelah ubah schema |
| `npm run worker` | Worker penyegar skor keyword (opsional) |

---

## 9. Struktur singkat

```
src/
  app/            Halaman & API (Next.js App Router)
  components/     Komponen UI
  lib/
    ai/           Provider AI (gemini, openai, claude, dll) & generator prompt
    adobe/        Parsing & data Adobe Stock
    calendar/     Event tema musiman & penjadwalan
    research/     Skor peluang, long-tail, niche, scan massal
    db/           Schema & koneksi Drizzle/libSQL
    workspace/    Multi-workspace
    settings/     Pengaturan tersimpan
drizzle/          File migrasi database
extension/        Ekstensi Chrome
```
