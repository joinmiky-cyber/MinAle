import { createClient } from '@supabase/supabase-js';

const getSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'your-supabase-url') {
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey);
};

export const uploadImage = async (file: File, folder: string = 'places') => {
  const client = getSupabase();
  if (!client) {
    console.error('Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
    throw new Error('Supabase is not configured');
  }

  // We use a single bucket named 'minale' for simplicity, or fall back to 'places'
  const BUCKET_NAME = 'places';

  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
  const filePath = `${folder}/${fileName}`;

  const { error: uploadError } = await client.storage
    .from(BUCKET_NAME)
    .upload(filePath, file);

  if (uploadError) {
    throw uploadError;
  }

  const { data: { publicUrl } } = client.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  return publicUrl;
};
