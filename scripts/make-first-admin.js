import { createClient } from '@supabase/supabase-js';
import 'dotenv/config'; // Pastikan Anda memiliki dotenv terinstal dan file .env

// Ganti dengan URL Supabase proyek Anda
const supabaseUrl = process.env.VITE_PUBLIC_SUPABASE_URL || 'https://fvtyargknkxsorfieyjt.supabase.co';
// Ganti dengan Service Role Key Anda (SANGAT RAHASIA!)
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2dHlhcmdrbmt4c29yZmlleWp0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzczMjI5OSwiZXhwIjoyMDczMzA4Mjk5fQ.wP_H_RRmVofwfiefSqbX66UjxWj_J51vsP5r5HfU9CE';

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Pastikan SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY diatur di .env atau langsung di skrip.');
  process.exit(1);
}

const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      persistSession: false, // Penting: Jangan menyimpan sesi admin
    },
  }
);

async function makeFirstAdmin(userId) {
  if (!userId) {
    console.error('Harap berikan userId pengguna yang ingin Anda jadikan admin.');
    process.exit(1);
  }

  console.log(`Mencoba menjadikan pengguna ${userId} sebagai admin...`);

  try {
    const { data: userResponse, error: fetchError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (fetchError) {
      console.error('Error mengambil data pengguna:', fetchError.message);
      return;
    }
    if (!userResponse.user) {
      console.error('Pengguna tidak ditemukan.');
      return;
    }

    const currentAppMetadata = userResponse.user.app_metadata || {};
    const newAppMetadata = {
      ...currentAppMetadata,
      roles: Array.from(new Set([...(currentAppMetadata.roles || []), 'admin'])) // Tambahkan 'admin' jika belum ada
    };

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { app_metadata: newAppMetadata }
    );

    if (error) {
      console.error('Error memperbarui peran pengguna:', error.message);
    } else {
      console.log(`Pengguna ${userId} berhasil diperbarui. Peran baru:`, data.user.app_metadata.roles);
      console.log('Sekarang Anda dapat login dengan pengguna ini dan mengakses fitur admin.');
    }
  } catch (e) {
    console.error('Terjadi kesalahan tak terduga:', e.message);
  }
}

// Ganti dengan ID pengguna yang ingin Anda jadikan admin
const targetUserId = '1eedf6d8-4cdc-4a0a-938a-741106700c23'; // <-- GANTI INI!

makeFirstAdmin(targetUserId);