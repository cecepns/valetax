# Inventory Management System

Sistem manajemen inventory yang komprehensif dengan fitur lengkap untuk mengelola stok barang, transaksi masuk/keluar, dan pelaporan.

## Fitur Utama

### A. Login
- Autentikasi dengan email dan password
- JWT token untuk keamanan session

### B. Dashboard
- Total stok barang
- Total barang masuk/keluar berdasarkan periode
- Top 5 barang dengan stok terbanyak
- Top 5 barang keluar terbanyak
- Daftar barang dengan stok habis

### C. Data Produk
- Form tambah/edit produk dengan barcode ID, kode barang, nama, stok awal, kategori, dan merk
- Tabel daftar produk dengan pencarian dan filter
- Indikator stok (hijau: aman, kuning: rendah, merah: habis)

### D. Barang Keluar
- Form dengan auto-fill berdasarkan kode barang
- Validasi barcode scan sesuai produk
- Tracking nomor resi
- Update otomatis stok produk

### E. Barang Masuk
- Form dengan auto-fill berdasarkan kode barang
- Tracking platform dan nomor resi
- Update otomatis stok produk

### F. Barang Rusak
- Pencatatan barang rusak dengan alasan kerusakan
- Form lengkap dengan kategori dan merk

### G. Generator Barcode
- Generate barcode untuk produk
- Multiple ukuran (kecil, sedang, besar)
- Download dan print barcode
- Support format CODE128

### H. Laporan
- Laporan stok dengan detail masuk/keluar
- Laporan barang masuk berdasarkan periode
- Laporan barang keluar berdasarkan periode
- Export ke CSV dan print

### I. List Order
- Manajemen order dengan harga
- Perhitungan harga rata-rata per produk
- Summary dan detail order

## Teknologi

### Frontend
- React.js 18 dengan Vite
- TailwindCSS untuk styling
- React Router untuk navigasi
- Axios untuk HTTP requests
- React Icons untuk ikon
- JsBarcode untuk generate barcode
- React-to-print untuk printing

### Backend
- Express.js
- MySQL dengan mysql2
- JWT untuk autentikasi
- bcryptjs untuk hashing password
- CORS untuk cross-origin requests

### Database
- MySQL dengan schema lengkap
- Triggers untuk update stok otomatis
- Views untuk reporting
- Indexes untuk performa optimal

## Instalasi

### 1. Clone Repository
```bash
git clone <repository-url>
cd inventory-management-app
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Database
1. Buat database MySQL
2. Import file `database/inventory_db.sql`
3. Copy `backend/.env.example` ke `backend/.env`
4. Sesuaikan konfigurasi database di `.env`

### 4. Jalankan Aplikasi

#### Development Mode
```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
npm run server
```

#### Production Build
```bash
npm run build
npm run preview
```

## Konfigurasi Database

### Environment Variables
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=inventory_db
JWT_SECRET=your-secret-key
PORT=5000
```

### Default Login
- Email: `admin@inventory.com`
- Password: `admin123`

## Struktur Database

### Tables
- `users` - Data pengguna
- `products` - Master data produk
- `incoming_goods` - Transaksi barang masuk
- `outgoing_goods` - Transaksi barang keluar
- `damaged_goods` - Data barang rusak
- `orders` - Data order dengan harga

### Views
- `stock_summary` - Ringkasan stok
- `low_stock_alert` - Alert stok rendah

### Triggers
- Auto update stok saat barang masuk/keluar

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/verify` - Verify token

### Dashboard
- `GET /api/dashboard/stats` - Dashboard statistics

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Transactions
- `GET/POST /api/incoming-goods` - Barang masuk
- `GET/POST /api/outgoing-goods` - Barang keluar
- `GET/POST/PUT/DELETE /api/damaged-goods` - Barang rusak
- `GET/POST/PUT/DELETE /api/orders` - Orders

### Reports
- `GET /api/reports` - Generate reports

## Fitur Keamanan

- JWT authentication
- Password hashing dengan bcrypt
- Input validation
- SQL injection protection
- CORS configuration

## Troubleshooting

### Stock Calculation Issues
Jika terjadi masalah dengan perhitungan stok yang tidak akurat:

1. **Identifikasi Masalah**: Stok terlihat berlipat ganda atau tidak sesuai
2. **Jalankan Migration**: 
   ```bash
   mysql -u root -p inventory_db < supabase/migrations/20250629161510_fix_stock_calculation.sql
   ```
3. **Test Stock Calculation**:
   ```bash
   node test_stock_fix.js
   ```
4. **Manual Recalculation** (jika diperlukan):
   - Login sebagai manager
   - Gunakan endpoint: `POST /api/utils/recalculate-stock`

**Penyebab**: Database triggers dan manual API updates menyebabkan double update pada stok.
**Solusi**: API hanya menggunakan triggers untuk INSERT, manual update untuk UPDATE/DELETE.

## Responsive Design

- Mobile-first approach
- Breakpoints: mobile (<768px), tablet (768-1024px), desktop (>1024px)
- Touch-friendly interface
- Optimized untuk berbagai ukuran layar

## Print & Export

- Print laporan dengan format yang rapi
- Export CSV untuk analisis data
- Print barcode untuk labeling produk

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Kontribusi

1. Fork repository
2. Buat feature branch
3. Commit changes
4. Push ke branch
5. Buat Pull Request

## License

MIT License - lihat file LICENSE untuk detail.