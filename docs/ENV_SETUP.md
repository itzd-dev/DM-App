# Environment Setup (Vercel ⇄ Lokal)

Dokumen ini membantu sinkronisasi environment variables antara Vercel dan lokal.

## Variabel yang dibutuhkan

Frontend (terekspose ke browser via Vite):
- `VITE_SUPABASE_URL` — URL Project Supabase
- `VITE_SUPABASE_ANON_KEY` — anon public key Supabase

Serverless Functions (server-side, JANGAN pakai awalan `VITE_`):
- `SUPABASE_URL` — URL Project Supabase
- `SUPABASE_SERVICE_ROLE_KEY` — service role key Supabase (rahasia, JANGAN pernah dipasang di client)

## Vercel Project Settings → Environment Variables
Tambahkan ke Environment: Production, Preview, Development sesuai kebutuhan.
Setelah mengubah/mengisi env, lakukan Redeploy agar efeknya terpasang.

## Sinkronisasi via Vercel CLI

Pastikan Vercel CLI terpasang secara global atau dev-dependency.
- Install global: `npm i -g vercel`
- Atau sebagai dev dependency: `npm i -D vercel`
- Login: `vercel login`
- Link project (sekali): `vercel link`

Script yang tersedia di `package.json`:
- `npm run env:ls` — melihat daftar env di Vercel
- `npm run env:add` — menambah env baru (interaktif)
- `npm run env:rm` — menghapus env (interaktif)
- `npm run env:pull` — menarik env Development ke `.env.local`
- `npm run env:pull:dev` — menarik env Development ke `.env.development.local`
- `npm run env:pull:preview` — menarik env Preview ke `.env.preview.local`
- `npm run env:pull:prod` — menarik env Production ke `.env.production.local`

Catatan:
- Variabel berawalan `VITE_` akan di-inject ke client saat build/dev.
- Variabel tanpa `VITE_` hanya tersedia di server (mis. `api/` functions).
- Jangan pernah mem-push file `.env*` yang berisi secret ke repository publik.

## Contoh Isi `.env.local` (lokal)
```
VITE_SUPABASE_URL="https://xxxx.supabase.co"
VITE_SUPABASE_ANON_KEY="xxxxxxxx"
```

Untuk serverless lokal via `vercel dev`, tambahkan juga:
```
SUPABASE_URL="https://xxxx.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="xxxxxxxx"
```

## Troubleshooting
- API 500 di produksi → cek Vercel → Functions Logs → pastikan `SUPABASE_*` terisi benar.
- Variabel `VITE_*` tidak terbaca di client → perlu redeploy/build ulang karena Vite meng-inline nilai saat build.
- `vercel env pull` gagal → pastikan sudah login dan project sudah di-link (`vercel link`).

