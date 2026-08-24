import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

/**
 * Supabase is used for AUTH ONLY (email one-time codes — no passwords, no
 * deep links). All data lives behind our own API; the client just carries
 * the access token. When the env vars are absent the whole accounts
 * feature disappears and the app runs local-only.
 */

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          // Web uses localStorage by default; native needs AsyncStorage.
          ...(Platform.OS === 'web' ? {} : { storage: AsyncStorage }),
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      })
    : null;

export const accountsEnabled = !!supabase;

/** Current access token, or null when signed out / accounts disabled. */
export async function authToken(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
