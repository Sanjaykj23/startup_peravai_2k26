import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Use service role key if available for backend operations, otherwise anon key
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (url && key && !url.includes('mock-supabase')) {
    try {
      supabaseClient = createClient(url, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      });
      return supabaseClient;
    } catch (e) {
      console.warn('Failed to initialize Supabase client:', e);
    }
  }

  return null;
}
