# SahabatDengar AI

Website responsif desktop dan HP untuk konsep aplikasi komunikasi dua arah bagi pengguna tunarungu dan masyarakat umum, berdasarkan materi presentasi SahabatDengar AI.

## Fitur yang berjalan

- Dashboard responsif dengan navigasi.
- Suara ke teks melalui Web Speech API jika browser mendukungnya.
- Teks ke suara dengan pilihan voice bawaan browser dan pengaturan kecepatan.
- Ruang percakapan dengan pesan yang disimpan pada server lokal ke `data/messages.json`.
- Salin teks, bacakan pesan, hapus riwayat.
- Pratinjau kamera melalui izin browser.
- Pengaturan ukuran teks dan kontras tinggi.
- Endpoint pemeriksaan server `GET /api/health`.

## Batasan demo yang penting

- Pengenalan suara menggunakan kemampuan browser; dukungan dan akurasi bergantung pada browser/perangkat, bahasa, izin mikrofon, dan terkadang koneksi internet.
- Kamera saat ini hanya pratinjau video. Belum ada model AI yang menerjemahkan bahasa isyarat secara otomatis. Untuk itu perlu model computer vision/deep learning dan dataset bahasa isyarat yang sesuai.
- Percakapan disimpan pada berkas lokal, bukan database produksi dan belum memiliki autentikasi. Jangan gunakan untuk menyimpan informasi sensitif.
- Untuk akses kamera/mikrofon dari perangkat lain di jaringan atau saat deployment, gunakan HTTPS. `localhost` biasanya dianggap secure context oleh browser modern.

## Persyaratan

- Node.js 18 atau lebih baru.
- npm (biasanya sudah terpasang bersama Node.js; dipakai untuk menjalankan script).
- Browser modern; Chrome atau Edge disarankan untuk fitur pengenalan suara.

## Menjalankan di Windows / VS Code

1. Ekstrak folder `sahabatdengar-ai.zip`.
2. Buka folder `sahabatdengar-ai` di VS Code.
3. Buka terminal: **Terminal → New Terminal**.
4. Jalankan:

   ```bash
   npm start
   ```

5. Buka browser ke `http://localhost:3000`.

Server menggunakan modul bawaan Node.js, jadi tidak perlu menjalankan `npm install` atau mengunduh dependensi tambahan.

Terminal harus tetap berjalan selama website dipakai. Untuk menghentikan server tekan `Ctrl + C`.

## Membuka dari HP di Wi-Fi yang sama

1. Pastikan laptop dan HP memakai Wi-Fi yang sama.
2. Jalankan server dengan `npm start`.
3. Cari alamat IPv4 laptop melalui `ipconfig` di Command Prompt (contoh format `192.168.1.5`).
4. Di HP buka `http://ALAMAT-IP-LAPTOP:3000`.
5. Jika tidak terbuka, izinkan Node.js di Windows Firewall untuk jaringan privat.

Catatan: akses melalui alamat IP lokal mungkin tidak mengizinkan kamera/mikrofon karena bukan HTTPS. Untuk uji fitur kamera dan mikrofon, paling mudah buka di laptop menggunakan `localhost`; untuk akses HP dengan izin perangkat, gunakan HTTPS.

## Struktur proyek

```text
sahabatdengar-ai/
├── data/
│   └── messages.json       # riwayat chat lokal, dibuat otomatis
├── public/
│   ├── index.html          # struktur halaman
│   ├── style.css           # desain responsif
│   └── app.js              # interaksi frontend
├── package.json
├── server.js               # server Express dan API
└── README.md
```

## API

- `GET /api/health` — status server.
- `GET /api/messages` — ambil maksimal 100 pesan terakhir.
- `POST /api/messages` — simpan pesan JSON `{ "text": "...", "sender": "you", "mode": "text" }`.
- `DELETE /api/messages` — hapus seluruh riwayat lokal.

Ini adalah prototipe tugas yang bisa dijalankan secara lokal, bukan layanan produksi.
