"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = void 0;
const server_1 = require("next/server");
const otp_1 = require("@/lib/otp");
async function POST(request) {
    try {
        const body = await request.json();
        const { email, otp } = body;
        if (!email || !otp) {
            return server_1.NextResponse.json({ error: 'Email and verification code are required.' }, { status: 400 });
        }
        const result = await (0, otp_1.verifySignupOtp)({
            email: email.trim().toLowerCase(),
            otp: otp.trim(),
        });
        if (!result.valid) {
            return server_1.NextResponse.json({ error: result.error || 'Incorrect code. Please try again.' }, { status: 400 });
        }
        return server_1.NextResponse.json({
            success: true,
            message: 'Email verified',
        });
    }
    catch (err) {
        console.error('[Signup OTP Verify Error]', err);
        return server_1.NextResponse.json({ error: 'Verification failed. Please try again.' }, { status: 500 });
    }
}
exports.POST = POST;
