# XCY Image Host — 100 MB

Arsitektur:

Browser
  -> Cloudflare Worker (streaming)
  -> Catbox storage
  -> URL publik /files/<token>.xcy

Tidak memakai R2, jadi R2 billing tidak diperlukan.

## Batas
Cloudflare Free membatasi request body Worker sampai 100 MB. Catbox saat ini menerima upload sampai 200 MB, tetapi Worker Free menjadi batas depan 100 MB.

## Deploy via GitHub
1. Buat akun Cloudflare dan buka Workers & Pages.
2. Hubungkan repository GitHub.
3. Deploy project ini sebagai Worker.
4. Build command tidak diperlukan.
5. Entry point: `worker.js`.
6. Setelah deploy, buka domain Worker.

Jika dashboard meminta pengaturan static assets, gunakan folder root (`.`) sebagai assets directory.

## Catatan
File disimpan di Catbox, bukan di GitHub atau Cloudflare R2. URL `.xcy` berisi token yang mengkode URL Catbox sehingga tidak membutuhkan database.
