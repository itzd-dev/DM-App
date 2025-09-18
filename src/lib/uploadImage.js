import { supabase } from './supabaseClient';

const BUCKET_NAME = 'product-images'; // ganti jika bucket punya nama lain

export async function uploadImage(file, folder = 'products') {
  if (!file) {
    throw new Error('File tidak ditemukan');
  }
  if (!supabase) {
    throw new Error('Supabase client belum siap');
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(16).slice(2)}.${fileExt}`;
  const filePath = `${folder}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
  return data?.publicUrl ?? null;
}
