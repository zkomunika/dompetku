# DompetKu 💰
Aplikasi Catatan Keuangan Pribadi dengan Notifikasi WhatsApp

## Tech Stack
- **Backend**: Node.js + Express + SQLite + JWT
- **Frontend**: Vanilla HTML + CSS + JavaScript (single file)
- **Notifikasi**: Callmebot WhatsApp API

## Cara Menjalankan

### 1. Setup Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env: isi JWT_SECRET dan (opsional) CALLMEBOT_APIKEY
node server.js
```
Backend berjalan di: http://localhost:3000

### 2. Setup Frontend
Buka `frontend/index.html` di browser.
Atau gunakan Live Server di VS Code (klik kanan → Open with Live Server).

### 3. Setup Notifikasi WhatsApp (Opsional)
1. Simpan nomor **+34 644 43 49 42** di kontak HP kamu sebagai "CallMeBot"
2. Kirim pesan: `I allow callmebot to send me messages`
3. Tunggu balasan berisi API key
4. Masukkan API key ke file `.env` → `CALLMEBOT_APIKEY=xxxxxx`
5. Isi juga `WHATSAPP_NUMBER` dengan nomor HP format internasional (contoh: `628123456789`)

## Endpoints API

### Auth
| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| POST | /api/auth/register | Daftar akun baru | ❌ |
| POST | /api/auth/login | Login | ❌ |
| POST | /api/auth/refresh | Refresh access token | ❌ |
| POST | /api/auth/logout | Logout | ✅ |
| GET | /api/auth/me | Profil user login | ✅ |

### Transaksi (semua butuh JWT)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | /api/transactions | List semua transaksi (+ filter) |
| GET | /api/transactions/:id | Detail satu transaksi |
| POST | /api/transactions | Tambah transaksi |
| PUT | /api/transactions/:id | Update transaksi |
| DELETE | /api/transactions/:id | Hapus transaksi |

## Best Practices yang Diterapkan
- ✅ JWT Access Token (15 menit) + Refresh Token (7 hari)
- ✅ Password di-hash dengan bcrypt (salt rounds: 12)
- ✅ Helmet.js untuk HTTP security headers
- ✅ Rate limiting (cegah brute force)
- ✅ Input validation di backend
- ✅ CORS configuration
- ✅ Prepared statements (cegah SQL injection)
- ✅ Auto token refresh di frontend
- ✅ Notifikasi WhatsApp non-blocking
- ✅ Global error handler
