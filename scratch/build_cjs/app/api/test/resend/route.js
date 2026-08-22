"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = exports.GET = void 0;
const server_1 = require("next/server");
const email_1 = require("@/lib/email");
const env_1 = require("@/lib/env");
async function GET() {
    return server_1.NextResponse.json({
        apiKeyConfigured: (0, env_1.hasEmailConfig)(),
        fromEmail: env_1.env.email.from,
    });
}
exports.GET = GET;
async function POST(request) {
    if (process.env.NODE_ENV === 'production') {
        return server_1.NextResponse.json({ error: 'Not available in production' }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const checkOnly = searchParams.get('check') === 'true';
    const isConfigured = (0, env_1.hasEmailConfig)();
    const fromEmail = env_1.env.email.from;
    if (checkOnly) {
        return server_1.NextResponse.json({
            apiKeyConfigured: isConfigured,
            fromEmail: fromEmail,
        });
    }
    try {
        const body = await request.json().catch(() => ({}));
        const to = body.to || 'delivered@resend.dev';
        console.log(`[DELT RESEND TEST] Testing email dispatch to ${to}...`);
        if (!isConfigured) {
            return server_1.NextResponse.json({
                success: false,
                apiKeyConfigured: false,
                fromEmail: fromEmail,
                error: 'RESEND_API_KEY is not configured in .env.local',
            }, { status: 400 });
        }
        const result = await (0, email_1.sendOtpEmail)({
            to,
            otpCode: '123456',
            expiresInMinutes: 10,
            subject: 'DELT Resend Test',
        });
        if (!result.delivered) {
            return server_1.NextResponse.json({
                success: false,
                apiKeyConfigured: true,
                fromEmail: fromEmail,
                error: result.error || 'Resend rejected the email',
            }, { status: 502 });
        }
        return server_1.NextResponse.json({
            success: true,
            apiKeyConfigured: true,
            emailId: result.messageId,
            recipient: to,
            from: fromEmail,
        });
    }
    catch (err) {
        return server_1.NextResponse.json({
            success: false,
            error: err?.message || 'Unexpected error during test',
        }, { status: 500 });
    }
}
exports.POST = POST;
