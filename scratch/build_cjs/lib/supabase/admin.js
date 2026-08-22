"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAdminClient = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const env_1 = require("@/lib/env");
/**
 * Creates an admin Supabase client with the service role key.
 * Strictly used in server contexts (API route handlers, webhooks, secure storage operations).
 * NEVER expose to the browser!
 */
function createAdminClient() {
    if (!(0, env_1.hasSupabaseServerConfig)()) {
        return (0, supabase_js_1.createClient)(env_1.env.supabase.url || 'https://placeholder.supabase.co', env_1.env.supabase.serviceRoleKey || 'placeholder-service-key', {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });
    }
    return (0, supabase_js_1.createClient)(env_1.env.supabase.url, env_1.env.supabase.serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}
exports.createAdminClient = createAdminClient;
