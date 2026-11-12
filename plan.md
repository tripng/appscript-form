# Plan: Dukungan Gambar pada Soal

## 1. Tujuan

Menambahkan opsi gambar pada soal di proyek pembuat Google Form ujian (Google Apps Script + clasp). Setiap soal di `questions.js` boleh memiliki field opsional `image`. Jika diisi, `buildForm()` menyisipkan gambar dari Google Drive tepat sebelum soal tersebut. Soal tanpa `image` harus berperilaku persis seperti sekarang. Fitur ini tidak boleh merusak alur form yang sudah ada (section, percabangan kelas, token, pengacakan soal).

## 2. Keputusan yang dikunci

1. **Pendekatan: `form.addImageItem()` (FormApp)**, bukan Forms API `batchUpdate`. Alasan: tidak butuh advanced service dan tidak butuh gambar publik. Pendekatan Forms API (gambar menempel di `questionItem`) hanya dipertimbangkan jika verifikasi V4 gagal, dan itu masuk plan terpisah.
2. **Sumber gambar: Google Drive.** Clasp tidak meng-upload file biner, jadi gambar disimpan di Drive dan dirujuk lewat nilai `image`.
3. **Format nilai `image`:** string yang diperlakukan sebagai **nama file** di folder `CONFIG.imageFolderId`. Jika `imageFolderId` kosong, nilainya diperlakukan sebagai **ID file Drive**.
4. **Field `image` bersifat opsional.** Tidak ada perubahan wajib pada soal yang sudah ada.
5. **Gagal cepat:** jika file gambar tidak ditemukan, `buildForm()` berhenti dengan error yang menyebut nomor soal dan nilai `image`, sebelum membuat form apa pun. Jangan membuat form setengah jadi.
6. **Lebar gambar** diatur lewat `CONFIG.imageWidth` (default 450), rata tengah.
7. **Scope OAuth** yang ditambahkan hanya `https://www.googleapis.com/auth/drive.readonly`. Ini perubahan izin, bukan dependency.
8. **Tidak ada alt text/caption** di versi ini (`addImageItem` mendukung `setAltText`, tetapi diputuskan nanti jika dibutuhkan).

## 3. File yang boleh diubah / dibuat

- `src/config.js`: tambah `imageFolderId` dan `imageWidth`.
- `src/questions.js`: dokumentasi field `image` (komentar JSDoc) dan contoh soal bergambar yang dikomentari.
- `src/builder.js`: logika resolusi gambar, validasi awal, dan penyisipan item gambar.
- `src/appsscript.json`: tambah scope Drive.
- `plan.md`: file ini.

> Catatan: path di atas mengikuti struktur yang diusulkan sebelumnya. Lihat "Pertanyaan terbuka" nomor 1.

## 4. File yang TIDAK boleh diubah

- `.clasp.json`
- `.gitignore`
- `package.json`, `package-lock.json` (tidak ada dependency baru)
- Daftar kelas/nama siswa dan token di `src/config.js` (hanya boleh menambah dua field baru, jangan menyentuh isi yang ada)
- Teks soal, opsi, kunci jawaban, dan poin yang sudah ada di `src/questions.js`
- Fungsi lain di `builder.js` yang tidak terkait gambar (misalnya `updateToken()` jika sudah ada)
- Folder lain apa pun di luar `src/`

Batasan tambahan: jangan tambah dependency baru, jangan ubah skema database (proyek ini tidak memakai database, jadi tidak ada yang perlu disentuh).

## 5. Tugas atomik

Satu tugas = satu commit.

1. **`feat(config): tambah imageFolderId dan imageWidth`**
   Di `src/config.js` tambahkan `imageFolderId: ''` dan `imageWidth: 450` dengan komentar singkat tiap field.

2. **`feat(auth): tambah scope drive.readonly`**
   Di `src/appsscript.json` tambahkan `https://www.googleapis.com/auth/drive.readonly` ke `oauthScopes` tanpa menghapus scope yang ada.

3. **`feat(builder): tambah resolveImageBlob_`**
   Di `src/builder.js` buat fungsi `resolveImageBlob_(value)`. Jika `CONFIG.imageFolderId` terisi, cari file bernama `value` di folder itu (`getFilesByName`); jika kosong, anggap `value` sebagai ID file (`getFileById`). Lempar error jelas jika tidak ditemukan atau lebih dari satu file bernama sama. Kembalikan `getBlob()`.

4. **`feat(builder): validateQuestions_ sebelum buildForm`**
   Buat `validateQuestions_()` yang memanggil `resolveImageBlob_` untuk setiap soal ber-`image` dan mengumpulkan semua error (nomor soal + nilai `image`). Panggil di awal `buildForm()` sebelum `FormApp.create`. Jika ada error, `throw` satu pesan gabungan.

5. **`feat(builder): sisipkan item gambar sebelum soal`**
   Di awal `addQuestion_`, jika `q.image` ada: `form.addImageItem().setImage(blob).setWidth(CONFIG.imageWidth).setAlignment(FormApp.Alignment.CENTER)`. Jangan mengubah kode pembuatan soal setelahnya.

6. **`docs(questions): dokumentasikan field image`**
   Di `src/questions.js` tambahkan komentar JSDoc yang menjelaskan field `image` (opsional, nama file atau ID) dan satu contoh soal bergambar **dalam komentar** dengan nama file placeholder.

## 6. Tugas verifikasi

Jalankan dari root proyek, berurutan:

- **V1, sintaks:**
  ```bash
  for f in src/*.js; do node --check "$f" || exit 1; done
  ```
  Catatan: `node --check` hanya memeriksa sintaks, tidak menjalankan kode.
- **V2, validitas manifest:**
  ```bash
  node -e "JSON.parse(require('fs').readFileSync('src/appsscript.json','utf8')); console.log('appsscript.json OK')"
  ```
- **V3, push ke Apps Script:**
  ```bash
  clasp push
  ```
  Harus selesai tanpa error. Lalu jalankan `buildForm` di editor Apps Script (`clasp open-script`) dan setujui izin Drive yang baru muncul.
- **V4, uji manual (tidak bisa diotomatisasi):**
  1. Aktifkan satu soal bergambar dengan file yang benar-benar ada di Drive, jalankan `buildForm`, buka link siswa di **Execution log**.
  2. Muat ulang form sebagai siswa **minimal 5 kali**. Pastikan gambar selalu tampil tepat sebelum soalnya, tidak terpisah akibat pengacakan.
  3. Ganti nilai `image` dengan nama file yang tidak ada, jalankan lagi. Pastikan `buildForm` berhenti dengan error yang menyebut nomor soal dan **tidak ada form baru** yang terbentuk di Drive.
  4. Hapus semua `image` dari soal, jalankan lagi. Hasilnya harus identik dengan perilaku sebelum fitur ini.

Jika V4 langkah 2 gagal (gambar terpisah dari soal), hentikan pekerjaan dan laporkan. Jangan beralih ke Forms API tanpa plan baru.

## 7. Di luar cakupan

- Gambar sebagai **pilihan jawaban** (`Option.image`)
- Forms API / advanced service `Forms` dan `batchUpdate`
- Upload gambar otomatis dari lokal ke Drive
- Kompresi/resize gambar
- Alt text dan caption gambar
- Mengacak urutan opsi jawaban
- Perubahan alur section, percabangan kelas, token, atau penilaian
- Pengaturan "Release grades" dan opsi lain yang hanya bisa diubah dari UI Forms

## Pertanyaan terbuka

1. **Struktur repo sebenarnya.** Plan ini mengasumsikan `src/config.js`, `src/questions.js`, `src/builder.js`, `src/appsscript.json`. Jika nama atau lokasi file berbeda, sesuaikan bagian 3 dan 4 sebelum mulai, jangan menebak.
2. **Apakah `buildForm()` memakai `addQuestion_` untuk semua tipe soal (PG, PGK, B/S)?** Jika tidak, tentukan titik penyisipan gambar yang tepat.
3. **Di mana gambar disimpan?** Satu folder Drive khusus (isi `imageFolderId`) atau ID file satu per satu? Plan ini mendukung keduanya, tetapi pilih salah satu sebagai konvensi.
4. **Apakah file gambar bisa dibaca oleh akun yang menjalankan script?** (Pemilik sama, atau sudah di-share.)
5. **Bisakah `clasp run` dipakai?** Jika sudah disiapkan (API executable + project GCP standar), V3 bisa diganti perintah otomatis. Jika belum, V3 tetap manual.
6. **Apakah `updateToken()` atau fungsi lain memanggil `addQuestion_`?** Jika ya, pastikan penambahan gambar tidak memicu efek samping di sana.
