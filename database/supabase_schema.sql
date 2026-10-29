-- ====================================================================
-- SIM-PERSEDIAAN KANTOR RUTAN KELAS II B SIAK SRI INDRAPURA
-- SKRIP STRUKTUR TABEL & REALTIME SUPABASE POSTGRESQL
-- KODE UAKPB : 137.04.0900.692310.000.KD
-- ====================================================================
-- Petunjuk:
-- 1. Buka Dashboard Supabase Anda (https://supabase.com/dashboard)
-- 2. Pilih Proyek Anda -> Buka menu "SQL Editor" di bilah kiri
-- 3. Salin seluruh isi skrip ini, tempelkan di SQL Editor, lalu klik "Run" (Jalankan)
-- ====================================================================

-- 1. TABEL MASTER INVENTARIS PERSEDIAAN (1.194 ITEM REGISTER BMN)
create table if not exists public."inventory" (
    "id" bigint primary key,
    "page" int default 1,
    "noDok" text default '',
    "tglBuku" text default '',
    "kdSubKelompok" text default '',
    "kdBarang" text default '',
    "namaBarang" text not null,
    "satuan" text default 'PCS',
    "periode" text default '2026-06',
    "stokAwal" numeric default 0,
    "stokMasuk" numeric default 0,
    "stokKeluar" numeric default 0,
    "stokAkhir" numeric default 0,
    "kategori" text default 'Umum',
    "lokasi" text default 'Lemari Persediaan BMN',
    "kondisi" text default 'Tersedia',
    "hargaEstimasi" numeric default 0,
    "keterangan" text default '',
    "updated_at" timestamptz default now()
);

-- 2. TABEL REGISTER TRANSAKSI MUTASI (MASUK / KELUAR / AMBIL MANDIRI QR)
create table if not exists public."transactions" (
    "id" text primary key,
    "tanggal" text not null,
    "waktu" text default '',
    "jenis" text not null, -- 'MASUK' atau 'KELUAR'
    "subJenis" text default 'REGULER', -- 'REGULER', 'MANDIRI_QR', dll.
    "noDok" text default '',
    "namaBarang" text not null,
    "barangId" bigint references public."inventory"("id") on delete set null,
    "kdBarang" text default '',
    "jumlah" numeric not null default 0,
    "satuan" text default 'PCS',
    "sumber" text default '',
    "tujuan" text default '',
    "petugas" text default '',
    "penerima" text default '',
    "keterangan" text default '',
    "signature" text default '', -- Base64 Paraf / Tanda Tangan Digital Pengambil
    "created_at" timestamptz default now()
);

-- 3. TABEL PEJABAT PENGELOLA PERSEDIAAN (KPA, PPK, BMN, BENDAHARA)
create table if not exists public."officers" (
    "id" text primary key,
    "nama" text not null,
    "jabatan" text default '',
    "peran" text default '',
    "nip" text default '',
    "pangkat" text default '',
    "kontak" text default '',
    "isPrimary" boolean default false,
    "updated_at" timestamptz default now()
);

-- ====================================================================
-- 4. AKTIFKAN FITUR REAL-TIME REPLICATION
-- Ini memungkinkan HP dan PC langsung sinkron tanpa refresh saat ada transaksi baru
-- ====================================================================
alter table public."inventory" replica identity full;
alter table public."transactions" replica identity full;

-- Tambahkan tabel ke publikasi realtime Supabase
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'inventory'
  ) then
    alter publication supabase_realtime add table public."inventory";
  end if;
  
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'transactions'
  ) then
    alter publication supabase_realtime add table public."transactions";
  end if;
end $$;

-- ====================================================================
-- 5. PENGATURAN ROW LEVEL SECURITY (RLS) & HAK AKSES PUBLIK (ANON)
-- Mengizinkan aplikasi website dan HP mengakses baca-tulis menggunakan Anon Key
-- ====================================================================
alter table public."inventory" enable row level security;
alter table public."transactions" enable row level security;
alter table public."officers" enable row level security;

-- Kebijakan Akses Inventory
drop policy if exists "Akses Penuh Inventory" on public."inventory";
create policy "Akses Penuh Inventory" on public."inventory"
    for all using (true) with check (true);

-- Kebijakan Akses Transactions
drop policy if exists "Akses Penuh Transactions" on public."transactions";
create policy "Akses Penuh Transactions" on public."transactions"
    for all using (true) with check (true);

-- Kebijakan Akses Officers
drop policy if exists "Akses Penuh Officers" on public."officers";
create policy "Akses Penuh Officers" on public."officers"
    for all using (true) with check (true);

