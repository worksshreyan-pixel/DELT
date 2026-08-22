"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServerSupabaseClient = void 0;
const ssr_1 = require("@supabase/ssr");
const headers_1 = require("next/headers");
const env_1 = require("@/lib/env");
/**
 * Creates a server-side Supabase client with Next.js cookies support.
 */
async function createServerSupabaseClient() {
    const cookieStore = await (0, headers_1.cookies)();
    if (!(0, env_1.hasSupabasePublicConfig)()) {
        return (0, ssr_1.createServerClient)(env_1.env.supabase.url || 'https://placeholder.supabase.co', env_1.env.supabase.anonKey || 'placeholder-key', {
            cookies: {
                get(name) {
                    return cookieStore.get(name)?.value;
                },
                set(name, value, options) {
                    try {
                        cookieStore.set({ name, value, ...options });
                    }
                    catch (error) {
                        // Handled in Server Component read-only contexts
                    }
                },
                remove(name, options) {
                    try {
                        cookieStore.set({ name, value: '', ...options });
                    }
                    catch (error) {
                        // Handled in Server Component read-only contexts
                    }
                },
            },
        });
    }
    return (0, ssr_1.createServerClient)(env_1.env.supabase.url, env_1.env.supabase.anonKey, {
        cookies: {
            get(name) {
                return cookieStore.get(name)?.value;
            },
            set(name, value, options) {
                try {
                    cookieStore.set({ name, value, ...options });
                }
                catch (error) {
                    // Handled in Server Component read-only contexts
                }
            },
            remove(name, options) {
                try {
                    cookieStore.set({ name, value: '', ...options });
                }
                catch (error) {
                    // Handled in Server Component read-only contexts
                }
            },
        },
    });
}
exports.createServerSupabaseClient = createServerSupabaseClient;
