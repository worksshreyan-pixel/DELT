import { createClient } from '@supabase/supabase-js';
import { env, hasSupabaseServerConfig } from '@/lib/env';
/**
 * Creates an admin Supabase client with the service role key.
 * Strictly used in server contexts (API route handlers, webhooks, secure storage operations).
 * NEVER expose to the browser!
 */
export function createAdminClient() {
    if (!hasSupabaseServerConfig()) {
        return createClient(env.supabase.url || 'https://placeholder.supabase.co', env.supabase.serviceRoleKey || 'placeholder-service-key', {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });
    }
    return createClient(env.supabase.url, env.supabase.serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}
