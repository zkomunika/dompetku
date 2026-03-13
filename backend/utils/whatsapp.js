// utils/whatsapp.js - Kirim notifikasi WhatsApp via Fonnte
const https = require('https');

/**
 * Kirim pesan WhatsApp via Fonnte API
 * @param {string} phone - Nomor WA format internasional tanpa + (contoh: 628123456789)
 * @param {string} message - Pesan yang akan dikirim
 */
const sendWhatsApp = (phone, message) => {
  return new Promise((resolve, reject) => {
    const token = process.env.FONNTE_TOKEN;

    // Jika tidak ada token, skip
    if (!token || token === 'your_fonnte_token_here') {
      console.log('[WA Skipped] Fonnte token belum dikonfigurasi');
      return resolve({ skipped: true });
    }

    const postData = JSON.stringify({
      target: phone,
      message: message,
      countryCode: '62'
    });

    const options = {
      hostname: 'api.fonnte.com',
      path: '/send',
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`[WA Sent] ke ${phone}: ${message.substring(0, 50)}...`);
        resolve({ success: true, response: data });
      });
    });

    req.on('error', (err) => {
      console.error('[WA Error]', err.message);
      resolve({ success: false, error: err.message });
    });

    req.write(postData);
    req.end();
  });
};

/**
 * Template pesan notifikasi
 */
const notifTemplates = {
  newTransaction: (name, type, amount, category) => {
    const typeLabel = type === 'income' ? '💰 Pemasukan' : '💸 Pengeluaran';
    const amountFormatted = new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR', minimumFractionDigits: 0
    }).format(amount);
    return `🔔 *DompetKu Notification*\n\nHalo ${name}!\n${typeLabel} baru telah dicatat.\n\n📂 Kategori: ${category}\n💵 Jumlah: ${amountFormatted}\n\n_Dicatat via DompetKu App_`;
  },

  deleteTransaction: (name, category, amount) => {
    const amountFormatted = new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR', minimumFractionDigits: 0
    }).format(amount);
    return `🗑️ *DompetKu Notification*\n\nHalo ${name}!\nTransaksi telah dihapus.\n\n📂 Kategori: ${category}\n💵 Jumlah: ${amountFormatted}\n\n_DompetKu App_`;
  },

  loginAlert: (name) => {
    const now = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
    return `🔐 *DompetKu Security Alert*\n\nHalo ${name}!\nLogin baru terdeteksi pada akun Anda.\n\n🕐 Waktu: ${now} WIB\n\nJika bukan Anda, segera ganti password!\n\n_DompetKu App_`;
  }
};

module.exports = { sendWhatsApp, notifTemplates };