# Aplikasi Mobile Distributor - AMDK Arroyyan99

## Tentang Aplikasi

Aplikasi mobile-responsive untuk distributor AMDK Arroyyan99 di Bogatama, Tulang Bawang, Lampung.

Aplikasi ini merupakan bagian dari sistem POS dan Distribusi berbasis web yang dapat diakses melalui browser mobile dan terasa seperti native app.

## Fitur Utama

### ✅ 1. Autentikasi & Akses
- Login dengan email dan password
- Auto login (menyimpan sesi)
- Role-based access (khusus distributor)
- Notifikasi jika akun belum di-approve admin

### ✅ 2. Dashboard
- Total penjualan hari ini
- Jumlah transaksi hari ini
- Total stok tersedia
- Produk terlaris
- Notifikasi stok menipis
- Alert untuk produk dengan stok minimum

### ✅ 3. Transaksi Penjualan (FITUR UTAMA)
- Pilih produk dari daftar
- Input jumlah dengan tombol +/-
- Hitung total otomatis
- Pilih pelanggan (opsional)
- Metode pembayaran: Cash / Transfer
- Tampilkan struk digital
- Share/copy struk transaksi

### ✅ 4. Manajemen Stok
- Lihat stok saat ini per produk
- Notifikasi stok minimum
- Riwayat stok masuk (dari pabrik)
- Riwayat stok keluar (penjualan)
- **Tidak bisa edit stok manual** (mencegah manipulasi)

### ✅ 5. Penerimaan Distribusi
- Lihat daftar kiriman dari pabrik
- Detail barang yang dikirim
- Konfirmasi penerimaan barang
- Status: Pending / Diterima
- Stok otomatis bertambah setelah konfirmasi

### ✅ 6. Manajemen Pelanggan
- Tambah pelanggan baru
- Edit data pelanggan
- Cari pelanggan (nama/telepon)
- Riwayat pembelian per pelanggan
- Simpan catatan pelanggan

### ✅ 7. Riwayat Transaksi
- List semua transaksi
- Filter:
  - Hari ini
  - Tanggal tertentu
  - Semua transaksi
- Detail transaksi lengkap

### ✅ 8. Laporan
- Total penjualan harian
- Total penjualan bulanan
- Produk terlaris (top 10)
- Jumlah transaksi per periode

### ✅ 9. Profil & Pengaturan
- Informasi distributor
- Data perusahaan
- Logout

## Teknologi

- **Frontend**: React + Material UI + Tailwind CSS
- **Backend**: Supabase (Auth + Database + Edge Functions)
- **Styling**: Mobile-first responsive design
- **State Management**: React Hooks

## Setup & Deployment

### 1. Deploy Supabase Edge Function

**PENTING**: Sebelum menggunakan aplikasi, Anda HARUS deploy Supabase edge function terlebih dahulu!

Cara deploy:
1. Buka **Make Settings** di Figma Make
2. Cari bagian **Supabase**
3. Klik tombol **Deploy Edge Function**
4. Tunggu hingga deployment selesai

### 2. Demo Account

Setelah edge function di-deploy, sistem akan otomatis membuat akun demo distributor:

**Kredensial Demo:**
```
Email: distributor@arroyyan99.com
Password: distributor123
```

### 3. Demo Data

Sistem otomatis membuat:
- ✅ 3 Produk demo (500ml, 1500ml, Galon 19L)
- ✅ 2 Data distribusi (1 pending, 1 diterima)

## Cara Menggunakan

### Login
1. Buka aplikasi di browser mobile
2. Masukkan email dan password
3. Klik tombol **Login**
4. Jika akun belum di-approve, akan muncul notifikasi

### Melakukan Transaksi Penjualan
1. Klik tab **Transaksi** di bottom navigation
2. Pilih pelanggan (opsional)
3. Klik **Tambah Produk**
4. Pilih produk dari list
5. Gunakan tombol **+** dan **-** untuk mengatur jumlah
6. Pilih metode pembayaran (Cash/Transfer)
7. Klik **Selesaikan Transaksi**
8. Struk akan ditampilkan dan bisa dibagikan

### Konfirmasi Penerimaan Distribusi
1. Klik tab **Stok**
2. Pilih tab **Distribusi**
3. Lihat daftar kiriman dari pabrik
4. Klik **Konfirmasi Penerimaan** pada distribusi yang pending
5. Cek detail barang
6. Klik **Konfirmasi**
7. Stok akan otomatis bertambah

### Menambah Pelanggan
1. Klik tab **Pelanggan**
2. Klik tombol **+** (floating action button)
3. Isi data pelanggan:
   - Nama (wajib)
   - Nomor telepon (wajib)
   - Alamat (opsional)
   - Catatan (opsional)
4. Klik **Simpan**

### Melihat Laporan
1. Klik tab **Profil**
2. Pilih tab **Laporan**
3. Lihat:
   - Laporan Harian (total penjualan hari ini)
   - Laporan Bulanan (total penjualan bulan ini)
   - Produk Terlaris

## Navigasi

Aplikasi menggunakan **Bottom Navigation** dengan 5 menu utama:

1. 🏠 **Dashboard** - Ringkasan & overview
2. 🛒 **Transaksi** - Buat transaksi penjualan
3. 📦 **Stok** - Manajemen stok & distribusi
4. 👥 **Pelanggan** - Manajemen pelanggan
5. 👤 **Profil** - Profil & laporan

## Mobile-First Design

Aplikasi ini dioptimalkan untuk penggunaan di mobile dengan:
- ✅ Touch-friendly buttons
- ✅ Minimal klik untuk transaksi
- ✅ Bottom navigation untuk akses mudah
- ✅ Responsive layout
- ✅ Fast input dengan tombol +/-
- ✅ Material UI components

## Catatan Penting

### Keamanan
- ❌ Distributor **TIDAK BISA** edit stok manual (mencegah manipulasi)
- ✅ Stok hanya berubah melalui:
  - Penjualan (stok berkurang)
  - Penerimaan distribusi (stok bertambah)

### Registrasi
- ❌ **Tidak ada** fitur registrasi di mobile
- ✅ Akun distributor harus dibuat melalui **web admin**
- ✅ Admin yang meng-approve akun distributor

### Data
- Data tersimpan di Supabase (cloud database)
- Setiap distributor memiliki data terpisah
- Transaksi dan pelanggan ter-isolasi per distributor

## Troubleshooting

### Login Gagal
- Pastikan email dan password benar
- Cek apakah akun sudah di-approve oleh admin
- Pastikan edge function sudah di-deploy

### API Error
- Pastikan Supabase edge function sudah di-deploy
- Refresh halaman dan coba lagi
- Cek koneksi internet

### Stok Tidak Update
- Pastikan konfirmasi penerimaan berhasil
- Cek riwayat stok untuk memverifikasi
- Refresh halaman

## Support

Untuk pertanyaan atau bantuan, hubungi administrator sistem.

---

**Perancangan dan Implementasi Sistem Point of Sales dan Distribusi Berbasis Website pada Perusahaan Air Minum Dalam Kemasan (AMDK) Arroyyan99, Bogatama, Tulang Bawang, Lampung**
