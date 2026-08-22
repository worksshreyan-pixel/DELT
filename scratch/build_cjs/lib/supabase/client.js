"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createClient = void 0;
const ssr_1 = require("@supabase/ssr");
const env_1 = require("@/lib/env");
/**
 * Creates a browser-side Supabase client with cookie storage.
 */
function createClient() {
    if (!(0, env_1.hasSupabasePublicConfig)()) {
        // Return a dummy client to avoid runtime crash when env is not configured
        return (0, ssr_1.createBrowserClient)(env_1.env.supabase.url || 'https://placeholder.supabase.co', env_1.env.supabase.anonKey || 'placeholder-key');
    }
    return (0, ssr_1.createBrowserClient)(env_1.env.supabase.url, env_1.env.supabase.anonKey);
}
exports.createClient = createClient;
