"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = void 0;
const server_1 = require("next/server");
const otp_1 = require("@/lib/otp");
async function POST(request) {
    try {
        const body = await request.json();
        const { name, email, password } = body;
        if (!name || !email || !password) {
            return server_1.NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
        }
        if (password.length < 8) {
            return server_1.NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
        }
        const result = await (0, otp_1.requestSignupOtp)({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password,
        });
        if (!result.success) {
            return server_1.NextResponse.json({ error: result.error || 'Failed to send verification code.', cooldownSeconds: result.cooldownSeconds }, { status: result.cooldownSeconds ? 429 : 400 });
        }
        return server_1.NextResponse.json({
            success: true,
            cooldownSeconds: result.cooldownSeconds || 30,
            message: `Verification code sent to ${email.trim().toLowerCase()}`,
        });
    }
    catch (err) {
        console.error('[Signup Server Error]', err);
        return server_1.NextResponse.json({ error: 'Internal server error during signup' }, { status: 500 });
    }
}
exports.POST = POST;
