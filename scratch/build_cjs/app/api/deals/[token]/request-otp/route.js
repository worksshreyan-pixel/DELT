"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = void 0;
const server_1 = require("next/server");
const otp_1 = require("@/lib/otp");
async function POST(request, { params }) {
    try {
        const { token } = await params;
        if (!token) {
            return server_1.NextResponse.json({ error: 'Deal token is required.' }, { status: 400 });
        }
        const body = await request.json();
        const { email } = body;
        if (!email || !email.trim()) {
            return server_1.NextResponse.json({ error: 'Email address is required.' }, { status: 400 });
        }
        const result = (await (0, otp_1.requestDealOtp)(token, email));
        const requestSource = request.headers.get('user-agent') || 'unknown';
        console.log(`[OTP_REQUEST]
traceId=${result.otpTraceId || 'unknown'}
timestamp=${new Date().toISOString()}
dealId=${result.dealId || 'unknown'}
normalizedEmail=${email.trim().toLowerCase()}
requestSource=${requestSource}
success=${result.success}
databaseRowCreated=${result.databaseRowCreated || false}
databaseRowId=${result.databaseRowId || 'none'}`);
        if (!result.success) {
            const status = result.errType === 'DATABASE_INSERT_ERROR' ? 500 : 400;
            return server_1.NextResponse.json({
                error: result.error,
                errType: result.errType,
                cooldownSeconds: result.cooldownSeconds
            }, { status });
        }
        return server_1.NextResponse.json({
            success: true,
            emailSent: result.emailSent,
            simulated: result.simulated,
            message: result.emailSent
                ? 'A 6-digit verification code has been sent to your email.'
                : 'Verification code requested.',
        });
    }
    catch (error) {
        console.error('Error requesting OTP:', error);
        return server_1.NextResponse.json({ error: error?.message || 'Failed to request verification code.' }, { status: 500 });
    }
}
exports.POST = POST;
