# Supabase Schema for Dapur Merifa

Rekomendasi kolom tabel `products` agar selaras dengan struktur data di aplikasi ini dan normalizer yang sudah ditambahkan.

Disarankan kolom:
- id
- name
- price
- category
- image
- description
- featured
- tags (text[])
- allergens (text[])
- rating
- review_count
- sold_count
- is_available
- current_stock
- stock_history (jsonb)

Catatan:
- Normalizer juga memahami snake_case seperti `review_count`, `sold_count`, `is_available`, `current_stock`, `stock_history`.
- Lihat file `docs/supabase_schema.sql` untuk SQL lengkap pembuatan tabel dan contoh kebijakan RLS read-only untuk publik.

