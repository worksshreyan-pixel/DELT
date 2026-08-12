import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env, hasSupabasePublicConfig } from '@/lib/env';

/**
 * Creates a server-side Supabase client with Next.js cookies support.
 */
export function createServerSupabaseClient() {
  const cookieStore = cookies();

  if (!hasSupabasePublicConfig()) {
    return createServerClient(
      env.supabase.url || 'https://placeholder.supabase.co',
      env.supabase.anonKey || 'placeholder-key',
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch (error) {
              // Handled in Server Component read-only contexts
            }
          },
          remove(name: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value: '', ...options });
            } catch (error) {
              // Handled in Server Component read-only contexts
            }
          },
        },
      }
    );
  }

  return createServerClient(env.supabase.url, env.supabase.anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch (error) {
          // Handled in Server Component read-only contexts
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options });
        } catch (error) {
          // Handled in Server Component read-only contexts
        }
      },
    },
  });
}
