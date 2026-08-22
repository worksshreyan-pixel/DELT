"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = void 0;
const server_1 = require("next/server");
const otp_1 = require("@/lib/otp");
async function POST(request) {
    try {
        const body = await request.json();
        const { name, email, password } = body;
        if (!email || !name) {
            return server_1.NextResponse.json({ error: 'Name and email are required.' }, { status: 400 });
        }
        if (password && password.length < 8) {
            return server_1.NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
        }
        const result = await (0, otp_1.requestSignupOtp)({
            email: email.trim().toLowerCase(),
            name: name.trim(),
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
        console.error('[Signup OTP Request Error]', err);
        return server_1.NextResponse.json({ error: 'Unable to send the verification email. Please try again.' }, { status: 500 });
    }
}
exports.POST = POST;
