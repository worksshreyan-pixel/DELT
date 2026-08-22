import { createBrowserClient } from '@supabase/ssr';
import { env, hasSupabasePublicConfig } from '@/lib/env';
/**
 * Creates a browser-side Supabase client with cookie storage.
 */
export function createClient() {
    if (!hasSupabasePublicConfig()) {
        // Return a dummy client to avoid runtime crash when env is not configured
        return createBrowserClient(env.supabase.url || 'https://placeholder.supabase.co', env.supabase.anonKey || 'placeholder-key');
    }
    return createBrowserClient(env.supabase.url, env.supabase.anonKey);
}
