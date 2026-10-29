# PANDUAN LENGKAP KONEKSI SUPABASE REAL-TIME CLOUD DATABASE
## SIM-PERSEDIAAN RUTAN KELAS II B SIAK SRI INDRAPURA

Panduan ini membantu Anda menghubungkan aplikasi **SIM-Persediaan Rutan Siak** ke **Supabase Cloud Database (100% Gratis)** agar seluruh data mutasi dan stok barang otomatis **sinkron secara seketika (real-time)** antara PC Admin dan HP Petugas yang sedang memindai barcode lemari (meskipun menggunakan paket data seluler 4G).

---

### ⏱️ Langkah 1: Buat Proyek Baru di Supabase (2 Menit)
1. Buka laman: **[https://supabase.com](https://supabase.com)**
2. Klik tombol hijau **"Start your project"** lalu masuk/daftar menggunakan akun **GitHub** atau **Google**.
3. Klik **"New Project"** (Proyek Baru):
   - **Name (Nama Proyek):** `sim-persediaan-rutan-siak`
   - **Database Password:** Buat kata sandi yang aman (contoh: simpan di catatan Anda).
   - **Region:** Pilih **Singapore (ap-southeast-1)** agar kecepatan akses paling kilat dari Indonesia.
   - **Pricing Plan:** Pilih **Free Plan** (Rp 0 / Gratis Selamanya).
4. Klik **"Create new project"** dan tunggu sekitar 1-2 menit hingga database selesai disiapkan.

---

### 📜 Langkah 2: Jalankan Skrip Database di SQL Editor
1. Pada menu dashboard Supabase di bilah kiri, klik ikon **"SQL Editor"** (ikon lembar bertuliskan `>_`).
2. Klik tombol hijau **"+ New query"**.
3. Buka file **`database/supabase_schema.sql`** yang ada di folder komputer Anda, salin (**Copy**) seluruh isinya, lalu tempel (**Paste**) ke dalam SQL Editor Supabase.
4. Klik tombol hijau **"Run"** di pojok kanan bawah.
5. Anda akan melihat pesan **"Success. No rows returned"**.  
   *(Tabel `inventory`, `transactions`, dan `officers` beserta hak akses real-time kini telah aktif).*

---

### 🔑 Langkah 3: Ambil Kredensial API Supabase
1. Di bilah menu kiri dashboard Supabase, klik ikon **"Project Settings"** (ikon gerigi di paling bawah).
2. Pilih submenu **"API"** (atau buka menu Configuration &rarr; API).
3. Salin 2 data penting berikut:
   - **Project URL:** Contoh: `https://xxxxxxxxxxxxxxxxxxxx.supabase.co`
   - **Project API Keys (anon public):** String panjang yang diawali dengan `eyJhbGciOi...`

---

### 🚀 Langkah 4: Masukkan Kredensial ke Aplikasi Website (1 Klik)
1. Buka website SIM-Persediaan di laptop Anda (bisa lewat link Vercel atau `public/index.html`).
2. Klik menu **"Database Supabase"** di bilah navigasi kiri, atau klik badge **`🟡 Penyimpanan Browser (Offline)`** di bilah atas.
3. Jendela pengaturan Supabase akan terbuka:
   - Tempelkan **Supabase Project URL**.
   - Tempelkan **Supabase Anon Public API Key**.
   - Klik **"Simpan & Hubungkan"**.
4. Klik tombol **"🚀 Unggah 1.194 Master Barang"**:
   - Sistem akan secara otomatis mengunggah seluruh 1.194 data barang dari register resmi BMN beserta buku mutasi ke Supabase Cloud hanya dalam waktu 3 detik!
5. Status di pojok atas website Anda akan langsung berubah menjadi hijau:  
   **`🟢 Supabase Cloud: Real-Time Aktif`**

---

### 📱 Langkah 5: Uji Coba Pengambilan Mandiri di HP
1. Ambil HP Anda (menggunakan sinyal 4G atau WiFi).
2. Buka link formulir ambil barang:  
   `https://persediaankantor-rutansiak.vercel.app/ambil-barang.html`  
   *(atau scan QR Code lemari)*.
3. Di HP Anda, status di atas akan tertulis **`🟢 Supabase Cloud Terhubung`**.
4. Cari barang: ketik **Pena** &rarr; sekarang **ISI PENA SIGNO** akan terbaca **Tersedia: 1 KOTAK**!
5. Masukkan nama pegawai, tanda tangani, lalu klik **"Konfirmasi Ambil Barang"**.
6. **Perhatikan Layar Laptop Anda:**
   - Dalam hitungan detik tanpa perlu di-refresh, stok Pena Signo di laptop langsung berkurang, dan riwayat mutasi pengambilan oleh petugas tersebut langsung muncul di tabel "Mutasi & Transaksi" PC Admin!

---

### 💾 Backup Lokal ke Komputer
Data Anda kini tersimpan aman di cloud 24 jam dan dapat diakses dari mana saja. Namun kapan saja Anda ingin menyimpannya ke dalam harddisk laptop, Anda cukup membuka folder **`database/`** atau menekan tombol cetak laporan resmi BMN.

