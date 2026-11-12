# appscript-form

Google Apps Script + clasp project: pembuat Google Form ujian (offline).

Ujian berbasis Google Forms menggunakan FormApp (clasp push). Skrip otomatis
membangun form ujian dari konfigurasi di `src/config.js` dan daftar soal
`src/questions.js`, lalu mencetak URL edit & URL siswa ke log.

## Struktur

- `src/config.js` — judul, keterangan, kelas, token, poin.
- `src/questions.js` — kumpulan soal (PG, PGK, BS).
- `src/builder.js` — logika `buildForm()`.
- `src/appsscript.json` — manifest clasp (timezone, runtime, oauthScopes).
- `.clasp.json` — ID script Apps Script dan rootDir `src`.

## Setup lokal

1. Install dependency:

   ```bash
   npm install
   ```

2. Login ke clasp (jika belum):

   ```bash
   npx clasp login
   ```

3. Sinkronkan kode ke Apps Script:

   ```bash
   npx clasp push
   ```

4. Jalankan skrip di editor Apps Script, atau lewat clasp:

   ```bash
   npx clasp run buildForm
   ```

## Catatan

Node module hanya untuk type definition (`@types/google-apps-script`). Build
`public/` tidak digunakan — isi `src/` yang dikirim ke Apps Script.

## Hak cipta

© 2026 tripng. All rights reserved.
