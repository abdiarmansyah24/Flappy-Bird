# NEON FLAPPY BIRD - ARCADE GAME

Game Arcade modern HTML5 Canvas bertema Cyber Neon yang terinspirasi dari gameplay Flappy Bird dengan desain visual original, animasi smooth, efek suara sintetis tanpa dependency file luar, dan fitur Victory System!

---

## 🚀 Fitur Utama

- 🎨 **Desain Original & Futuristic**: Menggunakan tema Cyber Neon Sky dengan karakter burung original dan rintangan pilar energi.
- 📱 **Mobile & Desktop Friendly**: Sangat responsif di HP Android/iPhone, Tablet, maupun PC/Laptop dengan fitur pencegah scroll layar.
- 🏆 **High Score Persistence**: Menyimpan skor tertinggi secara otomatis di browser menggunakan `localStorage`.
- 🎉 **Victory System**: Target kemenangan saat mencapai skor **20** dengan efek visual animasi Confetti & Sound Effect selebrasi.
- ⏸️ **Pause & UI Control**: Menu utama, petunjuk cara bermain, fitur pause game, dan restart instan.
- 🔊 **Web Audio Synthesizer**: Efek suara murni dihasilkan melalui kode Web Audio API (tanpa membutuhkan file audio eksternal).
- ⚡ **100% Static & Lightweight**: Cocok untuk di-hosting langsung di **GitHub Pages** tanpa backend atau database.

---

## 🛠️ Teknologi yang Digunakan

1. **HTML5**: Menggunakan `<canvas>` untuk rendering game grafik.
2. **CSS3**: Glassmorphism UI, responsif layout (Flexbox/Grid), dan animasi keyframe.
3. **JavaScript (ES6+)**: Pure Vanilla JS (Game loop `requestAnimationFrame`, Physics Engine, Collision Detection, State Management).
4. **Web Audio API**: Efek suara sintetis murni secara real-time.

---

## 🎮 Cara Memainkan Game

### Kontrol Perangkat

#### 📱 Ponsel / Tablet (HP):
- **Tap Layar / Touch**: Burung akan mengepakkan sayap dan terbang ke atas.

#### 💻 Komputer / Laptop (PC):
- **Tombol SPACE / Klik Mouse / Tombol W / Panah Atas**: Burung melompat / terbang.
- **Tombol ESC / P**: Pause / Lanjutkan game.

---

## 💻 Cara Menjalankan di Komputer Lokal

1. Download atau Clone repositori ini.
2. Buka folder project `flappy-bird/`.
3. Klik 2x file `index.html` untuk membuanya langsung di Google Chrome, Mozilla Firefox, Microsoft Edge, atau browser lainnya.
4. Game siap dimainkan!

---

## 🌐 Cara Upload & Hosting di GitHub Pages

### Langkah 1: Upload Kode ke GitHub
1. Buka website [GitHub](https://github.com) dan masuk ke akun Anda.
2. Buat Repositori Baru (misalnya diberi nama `neon-flappy-bird`).
3. Pilih opsi **Public**.
4. Upload semua file project (`index.html`, `style.css`, `script.js`, `README.md`) ke dalam repositori tersebut.

### Langkah 2: Mengaktifkan GitHub Pages
1. Masuk ke halaman Repositori Anda di GitHub.
2. Klik tab **Settings** (Pengaturan) di bagian atas.
3. Di menu sebelah kiri, pilih menu **Pages**.
4. Pada bagian **Build and deployment** -> **Branch**:
   - Ubah `None` menjadi **`main`** (atau `master`).
   - Folder biarkan tetap **`/(root)`**.
5. Klik **Save**.
6. Tunggu 1 - 2 menit, GitHub Pages akan memberikan link publik website Anda (contoh: `https://username.github.io/neon-flappy-bird/`).

---

## 📁 Struktur File Project

```text
flappy-bird/
│
├── index.html       # Struktur HTML5 dan overlay UI
├── style.css        # Desain glassmorphism & responsive CSS
├── script.js        # Logic game canvas, fisika, & suara
└── README.md        # Dokumentasi project
```
