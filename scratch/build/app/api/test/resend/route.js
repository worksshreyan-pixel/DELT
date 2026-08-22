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
import { sendOtpEmail } from '@/lib/email';
import { env, hasEmailConfig } from '@/lib/env';
export function GET() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, NextResponse.json({
                    apiKeyConfigured: hasEmailConfig(),
                    fromEmail: env.email.from,
                })];
        });
    });
}
export function POST(request) {
    return __awaiter(this, void 0, void 0, function () {
        var searchParams, checkOnly, isConfigured, fromEmail, body, to, result, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (process.env.NODE_ENV === 'production') {
                        return [2 /*return*/, NextResponse.json({ error: 'Not available in production' }, { status: 403 })];
                    }
                    searchParams = new URL(request.url).searchParams;
                    checkOnly = searchParams.get('check') === 'true';
                    isConfigured = hasEmailConfig();
                    fromEmail = env.email.from;
                    if (checkOnly) {
                        return [2 /*return*/, NextResponse.json({
                                apiKeyConfigured: isConfigured,
                                fromEmail: fromEmail,
                            })];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, request.json().catch(function () { return ({}); })];
                case 2:
                    body = _a.sent();
                    to = body.to || 'delivered@resend.dev';
                    console.log("[DELT RESEND TEST] Testing email dispatch to ".concat(to, "..."));
                    if (!isConfigured) {
                        return [2 /*return*/, NextResponse.json({
                                success: false,
                                apiKeyConfigured: false,
                                fromEmail: fromEmail,
                                error: 'RESEND_API_KEY is not configured in .env.local',
                            }, { status: 400 })];
                    }
                    return [4 /*yield*/, sendOtpEmail({
                            to: to,
                            otpCode: '123456',
                            expiresInMinutes: 10,
                            subject: 'DELT Resend Test',
                        })];
                case 3:
                    result = _a.sent();
                    if (!result.delivered) {
                        return [2 /*return*/, NextResponse.json({
                                success: false,
                                apiKeyConfigured: true,
                                fromEmail: fromEmail,
                                error: result.error || 'Resend rejected the email',
                            }, { status: 502 })];
                    }
                    return [2 /*return*/, NextResponse.json({
                            success: true,
                            apiKeyConfigured: true,
                            emailId: result.messageId,
                            recipient: to,
                            from: fromEmail,
                        })];
                case 4:
                    err_1 = _a.sent();
                    return [2 /*return*/, NextResponse.json({
                            success: false,
                            error: (err_1 === null || err_1 === void 0 ? void 0 : err_1.message) || 'Unexpected error during test',
                        }, { status: 500 })];
                case 5: return [2 /*return*/];
            }
        });
    });
}
