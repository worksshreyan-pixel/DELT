"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = void 0;
const server_1 = require("next/server");
const otp_1 = require("@/lib/otp");
async function POST(request) {
    try {
        const body = await request.json();
        const { email } = body;
        if (!email) {
            return server_1.NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }
        const result = await (0, otp_1.requestSignupOtp)({
            email: email.trim().toLowerCase(),
            name: 'Creator',
        });
        if (!result.success) {
            return server_1.NextResponse.json({ error: result.error || 'Failed to resend verification code.', cooldownSeconds: result.cooldownSeconds }, { status: result.cooldownSeconds ? 429 : 400 });
        }
        return server_1.NextResponse.json({
            success: true,
            cooldownSeconds: result.cooldownSeconds || 30,
            message: `Verification code resent to ${email.trim().toLowerCase()}`,
        });
    }
    catch (err) {
        console.error('[Resend Verification Server Error]', err);
        return server_1.NextResponse.json({ error: 'Failed to resend verification code' }, { status: 500 });
    }
}
exports.POST = POST;
