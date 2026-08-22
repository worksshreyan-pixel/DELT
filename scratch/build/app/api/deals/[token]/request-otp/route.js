var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { NextResponse } from 'next/server';
import { requestDealOtp } from '@/lib/otp';
export function POST(request, _a) {
    var params = _a.params;
    return __awaiter(this, void 0, void 0, function () {
        var token, body, email, result, requestSource, status_1, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 4, , 5]);
                    return [4 /*yield*/, params];
                case 1:
                    token = (_b.sent()).token;
                    if (!token) {
                        return [2 /*return*/, NextResponse.json({ error: 'Deal token is required.' }, { status: 400 })];
                    }
                    return [4 /*yield*/, request.json()];
                case 2:
                    body = _b.sent();
                    email = body.email;
                    if (!email || !email.trim()) {
                        return [2 /*return*/, NextResponse.json({ error: 'Email address is required.' }, { status: 400 })];
                    }
                    return [4 /*yield*/, requestDealOtp(token, email)];
                case 3:
                    result = (_b.sent());
                    requestSource = request.headers.get('user-agent') || 'unknown';
                    console.log("[OTP_REQUEST]\ntraceId=".concat(result.otpTraceId || 'unknown', "\ntimestamp=").concat(new Date().toISOString(), "\ndealId=").concat(result.dealId || 'unknown', "\nnormalizedEmail=").concat(email.trim().toLowerCase(), "\nrequestSource=").concat(requestSource, "\nsuccess=").concat(result.success, "\ndatabaseRowCreated=").concat(result.databaseRowCreated || false, "\ndatabaseRowId=").concat(result.databaseRowId || 'none'));
                    if (!result.success) {
                        status_1 = result.errType === 'DATABASE_INSERT_ERROR' ? 500 : 400;
                        return [2 /*return*/, NextResponse.json({
                                error: result.error,
                                errType: result.errType,
                                cooldownSeconds: result.cooldownSeconds
                            }, { status: status_1 })];
                    }
                    return [2 /*return*/, NextResponse.json({
                            success: true,
                            emailSent: result.emailSent,
                            simulated: result.simulated,
                            message: result.emailSent
                                ? 'A 6-digit verification code has been sent to your email.'
                                : 'Verification code requested.',
                        })];
                case 4:
                    error_1 = _b.sent();
                    console.error('Error requesting OTP:', error_1);
                    return [2 /*return*/, NextResponse.json({ error: (error_1 === null || error_1 === void 0 ? void 0 : error_1.message) || 'Failed to request verification code.' }, { status: 500 })];
                case 5: return [2 /*return*/];
            }
        });
    });
}
