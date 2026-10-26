# SIM-PERSEDIAAN RUTAN KELAS IV B SIAK SRI INDRAPURA

Sistem Informasi Manajemen Persediaan Kantor dan Register Opname Fisik BMN Satuan Kerja Rutan Kelas IV B Siak Sri Indrapura (**Kode UAKPB : 137.04.0900.692310.000.KD**).
Kementerian Imigrasi dan Pemasyarakatan R.I. &bull; Kantor Wilayah Ditjenpas Riau.

---

## 🚀 Panduan Deployment ke Vercel

Aplikasi ini telah dikonfigurasi secara optimal untuk berjalan di **Vercel** dengan arsitektur Static Web Application berkecepatan tinggi, aman (*security headers* aktif), dan tanpa dependensi server yang rumit.

### Metode 1: Hubungkan via GitHub / GitLab (Paling Direkomendasikan)
1. Push direktori ini ke repositori GitHub / GitLab Anda:
   ```bash
   git init
   git add .
   git commit -m "Initial commit SIM-Persediaan Rutan Siak"
   git branch -M main
   git remote add origin https://github.com/<username-anda>/<nama-repo>.git
   git push -u origin main
   ```
2. Buka dashboard [Vercel](https://vercel.com/) dan login.
3. Klik tombol **"Add New..."** &rarr; **"Project"**.
4. Pilih repositori GitHub Anda dan klik **"Import"**.
5. Pada bagian **Build and Output Settings**, biarkan pengaturan default (Vercel otomatis mendeteksi konfigurasi statis dari `vercel.json` dan `package.json`).
6. Klik **"Deploy"**. Dalam hitungan detik website Anda langsung online dengan domain gratis seperti:  
   `https://sim-persediaan-rutan-siak.vercel.app`

---

### Metode 2: Deploy Menggunakan Vercel CLI
Jika Anda memiliki Node.js / Vercel CLI terpasang di komputer:
1. Buka PowerShell / Terminal di folder ini:
   ```bash
   npm i -g vercel
   ```
2. Jalankan perintah deploy:
   ```bash
   vercel
   ```
3. Tekan `Enter` untuk menyetujui semua pengaturan default.
4. Untuk deploy ke domain production:
   ```bash
   vercel --prod
   ```

---

### Metode 3: Buka Secara Langsung di Komputer (Offline / Tanpa Hosting)
Aplikasi ini juga bekerja 100% secara offline tanpa server:
- Cukup **klik dua kali (double click)** pada file `index.html` di komputer Anda untuk membuka aplikasi langsung di browser Google Chrome, Microsoft Edge, atau Firefox.

---

## 👥 Pengelola Keuangan & Kredensial Akun Resmi

Sistem kini dilengkapi dengan **Gerbang Login Otentikasi Terenkripsi** sehingga tidak dapat diakses secara bebas oleh publik. Pengguna dapat login menggunakan **Username** atau **NIP Resmi**:

| No | Nama Pejabat | Jabatan / Peran | Username | Kata Sandi Bawaan | NIP Resmi |
|---|---|---|---|---|---|
| 1 | **Fajar Gustiawan, S.E** | Pengelola Aset & Persediaan (BMN) | `fajar` | `fajar123` | `19950925 201712 1 003` |
| 2 | **Muhammad Kurniawan, S.E.** | Bendahara Pengeluaran | `kurniawan` | `kurniawan123` | `19981003 201712 1 002` |
| 3 | **Rizky Firmansyah, S.E.** | Penyusunan Rencana Anggaran | `rizky` | `rizky123` | `20010424 202203 1 003` |
| 4 | **Dedy Krihastoni, A.Md.IP,S.H** | Kepala Rutan (KPA) | `karutan` | `karutan123` | `19841217 200701 1 004` |
| 5 | **Administrator Sistem** | Super Admin SIM-Persediaan | `admin` | `adminrutan2026` | - |

---

## 📋 Fitur Utama
- **Portal Login & Keamanan Terenkripsi**: Halaman depan login resmi bercorak Kementerian Imigrasi dan Pemasyarakatan dengan enkripsi sesi, proteksi akses publik, live clock WIB, pemilih akun cepat, dan tombol logout konfirmasi.
- **Dashboard Ringkasan Eksekutif**: Indikator KPI total jenis barang, stok tersedia, stok habis, dan kuantitas fisik.
- **Katalog Master Persediaan**: 1.194+ item lengkap dari 60 halaman register fisik PDF resmi, pencarian instan, filter kategori, penyesuaian stok cepat.
- **Buku Mutasi**: Pencatatan Barang Masuk (Pengadaan DIPA) dan Barang Keluar (Distribusi ke Blok WBP, Klinik, KPR, Dapur).
- **Cetak Dokumen Resmi UAKPB & Kop Surat Standar Kemenimipas**:
  - Dilengkapi **Kop Surat Kedinasan dan Logo Resmi** Kementerian Imigrasi dan Pemasyarakatan pada setiap lembar cetak dokumen.
  - Mendukung 5 format dokumen cetak resmi:
    1. *Register Transaksi Harian / Opname Fisik BMN*
    2. *Berita Acara Rekonsiliasi & Pemeriksaan Fisik Barang Persediaan*
    3. *Buku Laporan Mutasi Penerimaan & Distribusi Pengeluaran*
    4. *Laporan Rekapitulasi Fisik Berdasarkan Kategori*
    5. *Surat Laporan Pelaksanaan Pengelolaan Persediaan (Sesuai Format Surat Dinas Satker)*
  - Opsi tanda tangan: 4 Pejabat Lengkap atau Format Surat Satker dengan cap digital TTE BSrE (Badan Siber dan Sandi Negara).
  - Cetak otomatis bersih via browser (`window.print()` / PDF) dengan aturan `@media print` tanpa elemen navigasi website.
- **Data Persistence**: Data tersimpan permanen di `localStorage` peramban.
