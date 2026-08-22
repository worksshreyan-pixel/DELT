"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = void 0;
const server_1 = require("next/server");
const otp_1 = require("@/lib/otp");
let verifyRequestCount = 0;
async function POST(request, { params }) {
    try {
        const { token } = await params;
        if (!token) {
            return server_1.NextResponse.json({ error: 'Deal token is required.' }, { status: 400 });
        }
        const body = await request.json();
        const { email, otp } = body;
        if (!email || !email.trim()) {
            return server_1.NextResponse.json({ error: 'Email address is required.' }, { status: 400 });
        }
        if (!otp || !otp.trim()) {
            return server_1.NextResponse.json({ error: 'Verification code is required.' }, { status: 400 });
        }
        verifyRequestCount++;
        const result = (await (0, otp_1.verifyDealOtp)(token, email, otp));
        console.log(`[OTP_VERIFY]
traceId=${result.otpTraceId || 'unknown'}
dealId=${result.dealId || 'unknown'}
normalizedEmail=${email.trim().toLowerCase()}
lookupStarted=${result.lookupStarted || 'unknown'}
matchingRowFound=${result.matchingRowFound || false}
matchingRowId=${result.matchingRowId || 'none'}
matchingRowCreatedAt=${result.matchingRowCreatedAt || 'none'}
matchingRowExpiresAt=${result.matchingRowExpiresAt || 'none'}
matchingRowVerified=${result.matchingRowVerified || false}
matchingRowAttempts=${result.matchingRowAttempts || 0}
hashComparisonResult=${result.hashComparisonResult || false}
verificationResult=${result.verificationResult || 'unknown'}`);
        if (!result.valid) {
            return server_1.NextResponse.json({ error: result.error || 'Invalid verification code.' }, { status: 401 });
        }
        return server_1.NextResponse.json({
            authorized: true,
            clientSessionToken: result.clientSessionToken,
            deal: result.deal,
        });
    }
    catch (error) {
        console.error('Error verifying OTP:', error);
        return server_1.NextResponse.json({ error: error?.message || 'Verification failed.' }, { status: 500 });
    }
}
exports.POST = POST;
