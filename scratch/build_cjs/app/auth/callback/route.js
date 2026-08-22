"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = void 0;
const server_1 = require("@/lib/supabase/server");
const server_2 = require("next/server");
async function GET(request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const tokenHash = searchParams.get('token_hash');
    const type = searchParams.get('type');
    const next = searchParams.get('next') || '/dashboard';
    const supabase = await (0, server_1.createServerSupabaseClient)();
    // 1. PKCE Code Exchange
    if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            return server_2.NextResponse.redirect(`${origin}${next}`);
        }
    }
    // 2. Token Hash OTP Verification
    if (tokenHash) {
        const otpType = type || 'signup';
        const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: otpType,
        });
        if (!error) {
            return server_2.NextResponse.redirect(`${origin}${next}`);
        }
    }
    // Gracefully return user to login with helpful error message
    return server_2.NextResponse.redirect(`${origin}/login?error=verification_link_expired`);
}
exports.GET = GET;
