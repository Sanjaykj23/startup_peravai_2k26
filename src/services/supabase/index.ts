import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { APP_CONFIG } from '@/configs';

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || APP_CONFIG.supabase.url;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || APP_CONFIG.supabase.anonKey;

  // Only create real client if user provided an actual URL (not the default mock string)
  if (url && !url.includes('mock-supabase')) {
    try {
      supabaseClient = createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true
        }
      });
      return supabaseClient;
    } catch (e) {
      console.warn('Failed to initialize Supabase client:', e);
    }
  }

  return null;
}
