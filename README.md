# DompetKu 💰
Aplikasi Catatan Keuangan Pribadi dengan Notifikasi WhatsApp

## Tech Stack
- **Backend**: Node.js + Express + MySQL + JWT
- **Frontend**: Vanilla HTML + CSS + JavaScript (single file)
- **Database**: MySQL (via Laragon)
- **Notifikasi**: Fonnte WhatsApp API
- **Public Access**: Ngrok (backend) + Netlify (frontend)

## Struktur Project
```
dompetku/
├── backend/
│   ├── middleware/
│   │   └── auth.js          ← JWT middleware
│   ├── routes/
│   │   ├── auth.js          ← endpoint /api/auth/*
│   │   └── transactions.js  ← endpoint /api/transactions/*
│   ├── utils/
│   │   └── whatsapp.js      ← notifikasi WA via Fonnte
│   ├── db.js                ← koneksi MySQL
│   ├── server.js            ← entry point Express
│   ├── package.json
│   └── .env.example         ← template konfigurasi
└── frontend/
    └── index.html           ← single-file web app
```

## Cara Menjalankan

### 1. Persiapan
- Install [Node.js](https://nodejs.org)
- Install [Laragon](https://laragon.org) (untuk MySQL)
- Install [Ngrok](https://ngrok.com) (untuk public access)

### 2. Setup Database
- Buka Laragon → klik **Start All**
- Buka HeidiSQL → buat database baru bernama **`dompetku`**
- Tabel akan dibuat otomatis saat server pertama kali dijalankan

### 3. Setup Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env: isi JWT_SECRET dan FONNTE_TOKEN
node server.js
```
Backend berjalan di: http://localhost:3000

### 4. Setup Ngrok (Public Access Backend)
```bash
ngrok http 3000
```
Copy URL yang muncul, contoh: `https://xxxx.ngrok-free.app`

### 5. Setup Frontend
- Buka `frontend/index.html` di VS Code
- Ganti baris `const API = '...'` dengan URL Ngrok kamu
- Deploy ke Netlify (drag & drop folder `frontend`)

### 6. Setup Notifikasi WhatsApp (Fonnte)
1. Daftar di [fonnte.com](https://fonnte.com)
2. Tambah device → scan QR Code dengan WhatsApp
3. Dapat token → isi di `.env`: `FONNTE_TOKEN=token_kamu`
4. Restart server
5. Pastikan nomor WA diisi format internasional saat register (contoh: `628123456789`)

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
| POST | /api/transactions | Tambah transaksi baru |
| PUT | /api/transactions/:id | Update transaksi |
| DELETE | /api/transactions/:id | Hapus transaksi |

### Contoh Response

**POST /api/auth/login**
```json
{
  "success": true,
  "message": "Login berhasil!",
  "data": {
    "user": { "id": 1, "name": "Zaky", "email": "zaky@email.com" },
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci..."
  }
}
```

**GET /api/transactions**
```json
{
  "success": true,
  "data": [...],
  "summary": {
    "total_income": 715000,
    "total_expense": 55000,
    "balance": 660000,
    "total_count": 5
  }
}
```

## Best Practices yang Diterapkan
- ✅ JWT Access Token (15 menit) + Refresh Token (7 hari)
- ✅ Password di-hash dengan bcrypt (salt rounds: 12)
- ✅ Helmet.js untuk HTTP security headers
- ✅ Rate limiting (cegah brute force)
- ✅ Input validation di backend
- ✅ CORS configuration
- ✅ Prepared statements via mysql2 (cegah SQL injection)
- ✅ Auto token refresh di frontend
- ✅ Notifikasi WhatsApp via Fonnte (non-blocking)
- ✅ Global error handler
- ✅ Environment variables untuk data sensitif (.env)