# OBSIshoma

Jam sholat untuk OBS, seperti jam dinding masjid. Dashboard terpisah, hitung offline.

## Menjalankan
1. Pasang Node.js 16 atau lebih baru.
2. Windows: klik dua kali `start.bat`. Mac/Linux: `./start.sh` (atau `node server.js`).
3. Buka dashboard: http://localhost:3210/dashboard.html
4. Di OBS: Sources → + → Browser, URL `http://localhost:3210/overlay.html`, lebar 1920, tinggi 1080.
   Matikan "Shutdown source when not visible" supaya jadwal tetap jalan di semua scene.

Tidak ada `npm install`; server memakai modul bawaan Node. Port lain: `PORT=4000 node server.js`.
Agar dashboard bisa dibuka dari HP di jaringan yang sama: `HOST=0.0.0.0 node server.js` (hanya di jaringan tepercaya).

## Fitur
- Overlay jam: jam digital, tanggal Masehi dan Hijriah, hitung mundur ke waktu berikutnya, daftar waktu sholat.
- Notifikasi per waktu (Imsak, Subuh, Terbit, Dzuhur, Ashar, Maghrib, Isya): judul, pesan, emoji, gambar/stiker (PNG, JPG, GIF, WebP), suara, durasi.
- Ishoma: hitung mundur istirahat otomatis setelah notifikasi.
- Wilayah: pilih provinsi, kabupaten/kota, kecamatan, sampai desa/kelurahan (38 provinsi, 514 kabupaten/kota, 7.285 kecamatan, 83.612 desa/kelurahan). Koordinat dan zona waktu (WIB/WITA/WIT) terisi otomatis, tetap bisa diedit manual.
- Offline: waktu dihitung dengan adhan-js (terlampir di `public/vendor`) dari jam komputer, tanpa internet.
- Tombol "Tes di OBS" per waktu untuk mencoba tampilan.

## Metode hitung
Bawaan mengikuti Kemenag RI: Subuh 20°, Isya 18°, ihtiyath +2 menit, imsak 10 menit sebelum Subuh.
Selisih satu-dua menit dengan jadwal resmi bisa terjadi; cocokkan dengan jadwal Kemenag/masjid setempat dan sesuaikan ihtiyath bila perlu.
Jam komputer harus akurat (aktifkan sinkronisasi waktu otomatis).

## Data wilayah
Berasal dari cahyadsn/wilayah_boundaries (MIT; kode Kepmendagri No 300.2.2-2430/2025, koordinat = titik tengah batas wilayah). Disimpan lokal di `public/data` (indeks + satu berkas per kabupaten/kota), jadi tetap offline. Untuk membangun ulang: `node tools/build-wilayah.js <folder wilayah_boundaries/db> public/data`.

## Struktur
- `server.js` server lokal (config, unggahan, event ke overlay)
- `public/dashboard.html`, `public/overlay.html`, `public/shared.js`
- `data/` pengaturan dan file unggahan (dibuat otomatis)
