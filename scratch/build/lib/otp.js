// ==============================================================================
// DELT — Server-Side Secure OTP Verification & Token Engine
// Database-backed OTP engine for Client Deal Access & Creator Signup Verification
// ==============================================================================
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
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendOtpEmail } from '@/lib/email';
import { parseDescription } from '@/lib/utils';
var OTP_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || 'delt_otp_default_hmac_secret_key_2026';
var OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
var MAX_ATTEMPTS = 5;
var COOLDOWN_SECONDS = 30;
/**
 * Universal email normalizer used across request, store, and verify operations.
 */
export function normalizeEmail(email) {
    if (!email)
        return '';
    return email.trim().toLowerCase();
}
function maskEmail(email) {
    var parts = email.split('@');
    if (parts.length !== 2)
        return '***';
    var name = parts[0];
    var domain = parts[1];
    var maskedName = name.length <= 2 ? name[0] + '*' : name.slice(0, 2) + '*'.repeat(Math.max(1, name.length - 2));
    return "".concat(maskedName, "@").concat(domain);
}
/**
 * Computes a salted HMAC SHA-256 hash of an OTP code.
 */
function hashOtp(otp, purpose, identifier) {
    return crypto
        .createHmac('sha256', OTP_SECRET)
        .update("".concat(otp, ":").concat(purpose, ":").concat(identifier.trim().toLowerCase()))
        .digest('hex');
}
var inMemorySignupOtpStore = new Map();
// ------------------------------------------------------------------------------
// 1. Creator Signup OTP — Request & Resend
// ------------------------------------------------------------------------------
export function requestSignupOtp(params) {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var email, name, password, normalizedEmail, admin, usersData, existingUser, err_1, existingOtp, elapsedSeconds, randomOtp, otpHash, now, expiresAt, emailRes;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    email = params.email, name = params.name, password = params.password;
                    normalizedEmail = normalizeEmail(email);
                    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
                        return [2 /*return*/, { success: false, emailSent: false, simulated: false, error: 'Please enter a valid email address.' }];
                    }
                    admin = createAdminClient();
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 7, , 8]);
                    return [4 /*yield*/, admin.auth.admin.listUsers()];
                case 2:
                    usersData = (_b.sent()).data;
                    existingUser = (_a = usersData === null || usersData === void 0 ? void 0 : usersData.users) === null || _a === void 0 ? void 0 : _a.find(function (u) { var _a; return ((_a = u.email) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === normalizedEmail; });
                    if (existingUser && existingUser.email_confirmed_at) {
                        return [2 /*return*/, {
                                success: false,
                                emailSent: false,
                                simulated: false,
                                error: 'An account with this email already exists. Please log in.',
                            }];
                    }
                    if (!(!existingUser && password)) return [3 /*break*/, 4];
                    return [4 /*yield*/, admin.auth.admin.createUser({
                            email: normalizedEmail,
                            password: password,
                            user_metadata: { displayName: name.trim() },
                            email_confirm: false,
                        })];
                case 3:
                    _b.sent();
                    return [3 /*break*/, 6];
                case 4:
                    if (!(existingUser && password)) return [3 /*break*/, 6];
                    return [4 /*yield*/, admin.auth.admin.updateUserById(existingUser.id, {
                            password: password,
                            user_metadata: { displayName: name.trim() },
                        })];
                case 5:
                    _b.sent();
                    _b.label = 6;
                case 6: return [3 /*break*/, 8];
                case 7:
                    err_1 = _b.sent();
                    console.error('[Signup User Check Error]', err_1);
                    return [3 /*break*/, 8];
                case 8:
                    existingOtp = inMemorySignupOtpStore.get(normalizedEmail);
                    if (existingOtp) {
                        elapsedSeconds = Math.floor((Date.now() - existingOtp.lastSentAt) / 1000);
                        if (elapsedSeconds < COOLDOWN_SECONDS) {
                            return [2 /*return*/, {
                                    success: false,
                                    emailSent: false,
                                    simulated: false,
                                    cooldownSeconds: COOLDOWN_SECONDS - elapsedSeconds,
                                    error: "Please wait ".concat(COOLDOWN_SECONDS - elapsedSeconds, " seconds before requesting a new code."),
                                }];
                        }
                    }
                    randomOtp = crypto.randomInt(100000, 1000000).toString();
                    otpHash = hashOtp(randomOtp, 'SIGNUP_VERIFICATION', normalizedEmail);
                    now = Date.now();
                    expiresAt = now + OTP_EXPIRY_MS;
                    inMemorySignupOtpStore.set(normalizedEmail, {
                        email: normalizedEmail,
                        otpHash: otpHash,
                        attempts: 0,
                        expiresAt: expiresAt,
                        lastSentAt: now,
                    });
                    return [4 /*yield*/, sendOtpEmail({
                            to: normalizedEmail,
                            otpCode: randomOtp,
                            expiresInMinutes: 10,
                            subject: 'Your DELT verification code',
                        })];
                case 9:
                    emailRes = _b.sent();
                    if (!emailRes.delivered) {
                        inMemorySignupOtpStore.delete(normalizedEmail);
                        return [2 /*return*/, {
                                success: false,
                                emailSent: false,
                                simulated: Boolean(emailRes.simulated),
                                error: emailRes.error || 'Failed to send verification email through Resend.',
                            }];
                    }
                    return [2 /*return*/, {
                            success: true,
                            emailSent: true,
                            simulated: Boolean(emailRes.simulated),
                            cooldownSeconds: COOLDOWN_SECONDS,
                        }];
            }
        });
    });
}
// ------------------------------------------------------------------------------
// 2. Creator Signup OTP — Verification
// ------------------------------------------------------------------------------
export function verifySignupOtp(params) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function () {
        var email, otp, normalizedEmail, trimmedOtp, otpEntry, expectedHash, actualHash, expectedBuffer, actualBuffer, matches, remaining, admin, usersData, user, displayName, err_2;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    email = params.email, otp = params.otp;
                    normalizedEmail = normalizeEmail(email);
                    trimmedOtp = (otp || '').trim();
                    if (!trimmedOtp || trimmedOtp.length !== 6 || !/^\d{6}$/.test(trimmedOtp)) {
                        return [2 /*return*/, { valid: false, error: 'Please enter a valid 6-digit verification code.' }];
                    }
                    otpEntry = inMemorySignupOtpStore.get(normalizedEmail);
                    if (!otpEntry) {
                        return [2 /*return*/, {
                                valid: false,
                                error: 'No active verification code found. Please request a new code.',
                            }];
                    }
                    if (otpEntry.expiresAt < Date.now()) {
                        inMemorySignupOtpStore.delete(normalizedEmail);
                        return [2 /*return*/, {
                                valid: false,
                                error: 'This code has expired. Request a new code.',
                            }];
                    }
                    if (otpEntry.attempts >= MAX_ATTEMPTS) {
                        inMemorySignupOtpStore.delete(normalizedEmail);
                        return [2 /*return*/, {
                                valid: false,
                                error: 'Too many attempts. Please request a new code.',
                            }];
                    }
                    expectedHash = otpEntry.otpHash;
                    actualHash = hashOtp(trimmedOtp, 'SIGNUP_VERIFICATION', normalizedEmail);
                    expectedBuffer = Buffer.from(expectedHash, 'hex');
                    actualBuffer = Buffer.from(actualHash, 'hex');
                    matches = expectedBuffer.length === actualBuffer.length &&
                        crypto.timingSafeEqual(expectedBuffer, actualBuffer);
                    if (!matches) {
                        otpEntry.attempts += 1;
                        remaining = MAX_ATTEMPTS - otpEntry.attempts;
                        return [2 /*return*/, {
                                valid: false,
                                error: remaining > 0
                                    ? 'Incorrect code. Please try again.'
                                    : 'Too many attempts. Please request a new code.',
                            }];
                    }
                    inMemorySignupOtpStore.delete(normalizedEmail);
                    admin = createAdminClient();
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 8, , 9]);
                    return [4 /*yield*/, admin.auth.admin.listUsers()];
                case 2:
                    usersData = (_c.sent()).data;
                    user = (_a = usersData === null || usersData === void 0 ? void 0 : usersData.users) === null || _a === void 0 ? void 0 : _a.find(function (u) { var _a; return ((_a = u.email) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === normalizedEmail; });
                    if (!user) return [3 /*break*/, 7];
                    return [4 /*yield*/, admin.auth.admin.updateUserById(user.id, {
                            email_confirm: true,
                        })];
                case 3:
                    _c.sent();
                    displayName = ((_b = user.user_metadata) === null || _b === void 0 ? void 0 : _b.displayName) || normalizedEmail.split('@')[0] || 'Creator';
                    return [4 /*yield*/, admin.from('profiles').upsert({
                            id: user.id,
                            email: normalizedEmail,
                            display_name: displayName,
                        })];
                case 4:
                    _c.sent();
                    return [4 /*yield*/, admin.from('storage_usage').upsert({
                            user_id: user.id,
                            total_bytes: 0,
                            limit_bytes: 5368709120, // 5 GB
                        })];
                case 5:
                    _c.sent();
                    return [4 /*yield*/, admin.from('deal_credits').upsert({
                            user_id: user.id,
                            plan_id: 'free',
                            total: 50,
                            used: 0,
                            remaining: 50,
                        })];
                case 6:
                    _c.sent();
                    _c.label = 7;
                case 7: return [3 /*break*/, 9];
                case 8:
                    err_2 = _c.sent();
                    console.error('[Verify Signup Confirm Error]', err_2);
                    return [3 /*break*/, 9];
                case 9: return [2 /*return*/, { valid: true }];
            }
        });
    });
}
// ------------------------------------------------------------------------------
// 3. Client Deal Access OTP — Request (Database Backed: deal_otps)
// ------------------------------------------------------------------------------
export function requestDealOtp(dealToken, rawEmail, traceId) {
    return __awaiter(this, void 0, void 0, function () {
        var otpTraceId, normalizedEmail, admin, _a, deal, dealError, recentOtps, lastCreatedAt, elapsedSeconds, remainingCooldown, randomOtp, otpHash, now, expiresAt, _b, insertedOtp, insertError, emailRes;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    otpTraceId = traceId || "OTP-REQUEST-".concat(crypto.randomUUID().slice(0, 8));
                    normalizedEmail = normalizeEmail(rawEmail);
                    console.log("[OTP_REQUEST_START]", JSON.stringify({
                        otpTraceId: otpTraceId,
                        dealTokenPresent: Boolean(dealToken),
                        token: dealToken,
                        normalizedEmail: normalizedEmail,
                        timestamp: new Date().toISOString()
                    }));
                    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
                        return [2 /*return*/, {
                                success: false,
                                emailSent: false,
                                simulated: false,
                                error: 'Please enter a valid email address.',
                                errType: 'INVALID_EMAIL',
                                otpTraceId: otpTraceId,
                                databaseRowCreated: false
                            }];
                    }
                    admin = createAdminClient();
                    return [4 /*yield*/, admin
                            .from('deals')
                            .select('id, token, client_email, client_name, title')
                            .eq('token', dealToken)
                            .maybeSingle()];
                case 1:
                    _a = _c.sent(), deal = _a.data, dealError = _a.error;
                    if (dealError || !deal) {
                        console.error("[OTP_REQUEST_ERROR] Deal not found for token: ".concat(dealToken), dealError);
                        return [2 /*return*/, {
                                success: false,
                                emailSent: false,
                                simulated: false,
                                error: 'Deal not found or invalid link.',
                                errType: 'DEAL_NOT_FOUND',
                                otpTraceId: otpTraceId,
                                databaseRowCreated: false
                            }];
                    }
                    console.log("[CLIENT_DEAL_RESOLUTION]", JSON.stringify({
                        otpTraceId: otpTraceId,
                        tokenPresent: Boolean(dealToken),
                        dealId: deal.id,
                        clientEmail: deal.client_email,
                        timestamp: new Date().toISOString()
                    }));
                    // 2. Verify email matches deal client_email
                    if (normalizeEmail(deal.client_email) !== normalizedEmail) {
                        console.warn("[OTP_REQUEST_UNAUTHORIZED] Email ".concat(maskEmail(normalizedEmail), " does not match deal client ").concat(maskEmail(deal.client_email || '')));
                        return [2 /*return*/, {
                                success: false,
                                emailSent: false,
                                simulated: false,
                                error: 'This email address is not authorized for this private Deal workspace.',
                                errType: 'INVALID_EMAIL',
                                dealId: deal.id,
                                otpTraceId: otpTraceId,
                                databaseRowCreated: false
                            }];
                    }
                    return [4 /*yield*/, admin
                            .from('deal_otps')
                            .select('created_at, expires_at')
                            .eq('deal_id', deal.id)
                            .eq('email', normalizedEmail)
                            .order('created_at', { ascending: false })
                            .limit(1)];
                case 2:
                    recentOtps = (_c.sent()).data;
                    if (recentOtps && recentOtps.length > 0) {
                        lastCreatedAt = new Date(recentOtps[0].created_at).getTime();
                        elapsedSeconds = Math.floor((Date.now() - lastCreatedAt) / 1000);
                        if (elapsedSeconds < COOLDOWN_SECONDS) {
                            remainingCooldown = COOLDOWN_SECONDS - elapsedSeconds;
                            console.log("[OTP_COOLDOWN_ACTIVE] remaining: ".concat(remainingCooldown, "s"));
                            return [2 /*return*/, {
                                    success: false,
                                    emailSent: false,
                                    simulated: false,
                                    cooldownSeconds: remainingCooldown,
                                    error: "Please wait ".concat(remainingCooldown, " seconds before requesting a new code."),
                                    errType: 'RATE_LIMITED',
                                    dealId: deal.id,
                                    otpTraceId: otpTraceId,
                                    databaseRowCreated: false
                                }];
                        }
                    }
                    // 4. Invalidate (delete) any previous unverified OTPs for this deal + email
                    // Ensures only ONE active OTP exists in the database for this deal + email.
                    return [4 /*yield*/, admin
                            .from('deal_otps')
                            .delete()
                            .eq('deal_id', deal.id)
                            .eq('email', normalizedEmail)
                            .eq('verified', false)];
                case 3:
                    // 4. Invalidate (delete) any previous unverified OTPs for this deal + email
                    // Ensures only ONE active OTP exists in the database for this deal + email.
                    _c.sent();
                    randomOtp = crypto.randomInt(100000, 1000000).toString();
                    otpHash = hashOtp(randomOtp, 'CLIENT_DEAL_ACCESS', "".concat(deal.id, ":").concat(normalizedEmail));
                    now = new Date();
                    expiresAt = new Date(now.getTime() + OTP_EXPIRY_MS);
                    return [4 /*yield*/, admin
                            .from('deal_otps')
                            .insert({
                            deal_id: deal.id,
                            email: normalizedEmail,
                            otp_hash: otpHash,
                            attempts: 0,
                            verified: false,
                            expires_at: expiresAt.toISOString(),
                            created_at: now.toISOString(),
                        })
                            .select('id, deal_id, email, attempts, verified, created_at, expires_at')
                            .single()];
                case 4:
                    _b = _c.sent(), insertedOtp = _b.data, insertError = _b.error;
                    if (insertError || !insertedOtp) {
                        console.error("[DATABASE_INSERT_ERROR]", JSON.stringify({
                            otpTraceId: otpTraceId,
                            code: (insertError === null || insertError === void 0 ? void 0 : insertError.code) || null,
                            message: (insertError === null || insertError === void 0 ? void 0 : insertError.message) || null,
                            details: (insertError === null || insertError === void 0 ? void 0 : insertError.details) || null,
                            hint: (insertError === null || insertError === void 0 ? void 0 : insertError.hint) || null,
                            timestamp: new Date().toISOString()
                        }));
                        return [2 /*return*/, {
                                success: false,
                                emailSent: false,
                                simulated: false,
                                error: 'Failed to record verification code in database. Please try again.',
                                errType: 'DATABASE_INSERT_ERROR',
                                dealId: deal.id,
                                otpTraceId: otpTraceId,
                                databaseRowCreated: false
                            }];
                    }
                    console.log("[OTP_DB_WRITE_SUCCESS]", JSON.stringify({
                        otpTraceId: otpTraceId,
                        dealId: deal.id,
                        normalizedEmail: normalizedEmail,
                        otpRowId: insertedOtp.id,
                        createdAt: insertedOtp.created_at,
                        expiresAt: insertedOtp.expires_at,
                        attempts: insertedOtp.attempts,
                        verified: insertedOtp.verified,
                        timestamp: new Date().toISOString()
                    }));
                    console.log('[DEBUG_OTP_CODE]', randomOtp);
                    return [4 /*yield*/, sendOtpEmail({
                            to: normalizedEmail,
                            otpCode: randomOtp,
                            expiresInMinutes: 10,
                            subject: 'Your DELT verification code',
                        })];
                case 5:
                    emailRes = _c.sent();
                    if (!!emailRes.delivered) return [3 /*break*/, 7];
                    console.error("[OTP_EMAIL_FAILED]", JSON.stringify({
                        otpTraceId: otpTraceId,
                        otpRowId: insertedOtp.id,
                        error: emailRes.error,
                        timestamp: new Date().toISOString()
                    }));
                    return [4 /*yield*/, admin.from('deal_otps').delete().eq('id', insertedOtp.id)];
                case 6:
                    _c.sent();
                    return [2 /*return*/, {
                            success: false,
                            emailSent: false,
                            simulated: Boolean(emailRes.simulated),
                            error: emailRes.error || 'Failed to deliver verification email through Resend.',
                            errType: 'EMAIL_SEND_ERROR',
                            dealId: deal.id,
                            otpTraceId: otpTraceId,
                            databaseRowCreated: false
                        }];
                case 7:
                    console.log("[OTP_EMAIL_SENT]", JSON.stringify({
                        otpTraceId: otpTraceId,
                        otpRowId: insertedOtp.id,
                        recipient: normalizedEmail,
                        resendMessageId: emailRes.messageId,
                        timestamp: new Date().toISOString()
                    }));
                    return [2 /*return*/, {
                            success: true,
                            emailSent: true,
                            simulated: Boolean(emailRes.simulated),
                            cooldownSeconds: COOLDOWN_SECONDS,
                            dealId: deal.id,
                            otpTraceId: otpTraceId,
                            databaseRowCreated: true,
                            databaseRowId: insertedOtp.id
                        }];
            }
        });
    });
}
// ------------------------------------------------------------------------------
// 4. Client Deal Access OTP — Verification (Database Backed: deal_otps)
// ------------------------------------------------------------------------------
export function verifyDealOtp(dealToken, rawEmail, inputOtp, traceId) {
    return __awaiter(this, void 0, void 0, function () {
        var otpTraceId, normalizedEmail, trimmedOtp, lookupStarted, admin, _a, deal, dealError, parsed, resolvedDeal, _b, activeOtps, queryError, activeOtp, anyOtps, firstAnyOtp, now, expiresAtMs, expectedHash, actualHash, expectedBuffer, actualBuffer, matches, newAttempts, sessionPayload, payloadJson, payloadB64, signature, clientSessionToken, eventErr_1;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    otpTraceId = traceId || "OTP-VERIFY-".concat(crypto.randomUUID().slice(0, 8));
                    normalizedEmail = normalizeEmail(rawEmail);
                    trimmedOtp = (inputOtp || '').trim();
                    lookupStarted = new Date().toISOString();
                    console.log("[OTP_VERIFY_START]", JSON.stringify({
                        otpTraceId: otpTraceId,
                        dealToken: dealToken,
                        normalizedEmail: normalizedEmail,
                        inputOtpLength: trimmedOtp.length,
                        timestamp: lookupStarted
                    }));
                    if (!trimmedOtp || trimmedOtp.length !== 6 || !/^\d{6}$/.test(trimmedOtp)) {
                        return [2 /*return*/, {
                                valid: false,
                                error: 'Please enter a valid 6-digit verification code.',
                                otpTraceId: otpTraceId,
                                lookupStarted: lookupStarted,
                                matchingRowFound: false
                            }];
                    }
                    admin = createAdminClient();
                    return [4 /*yield*/, admin
                            .from('deals')
                            .select('*')
                            .eq('token', dealToken)
                            .maybeSingle()];
                case 1:
                    _a = _c.sent(), deal = _a.data, dealError = _a.error;
                    if (dealError || !deal) {
                        console.error("[OTP_VERIFY_ERROR] Deal not found for token: ".concat(dealToken), dealError);
                        return [2 /*return*/, {
                                valid: false,
                                error: 'Deal not found.',
                                otpTraceId: otpTraceId,
                                lookupStarted: lookupStarted,
                                matchingRowFound: false
                            }];
                    }
                    parsed = parseDescription(deal.description);
                    resolvedDeal = {
                        id: deal.id,
                        token: deal.token,
                        creatorId: deal.creator_id,
                        clientId: deal.client_id,
                        clientName: deal.client_name,
                        clientEmail: deal.client_email,
                        title: deal.title,
                        description: parsed.description,
                        scope: Array.isArray(deal.scope) ? deal.scope : [],
                        price: Number(deal.price),
                        currency: deal.currency || 'INR',
                        status: deal.status || 'in_progress',
                        deadline: deal.deadline,
                        progress: Number(deal.progress || 0),
                        paymentStatus: deal.payment_status || 'pending',
                        lastActivityAt: deal.last_activity_at || deal.created_at,
                        createdAt: deal.created_at,
                        previewEnabled: parsed.previewEnabled,
                    };
                    console.log("[CLIENT_DEAL_RESOLUTION]", JSON.stringify({
                        otpTraceId: otpTraceId,
                        tokenPresent: Boolean(dealToken),
                        dealId: deal.id,
                        clientEmail: deal.client_email,
                        timestamp: new Date().toISOString()
                    }));
                    return [4 /*yield*/, admin
                            .from('deal_otps')
                            .select('*')
                            .eq('deal_id', deal.id)
                            .eq('email', normalizedEmail)
                            .eq('verified', false)
                            .order('created_at', { ascending: false })
                            .limit(1)];
                case 2:
                    _b = _c.sent(), activeOtps = _b.data, queryError = _b.error;
                    if (queryError) {
                        console.error("[OTP_DB_QUERY_ERROR]", JSON.stringify({
                            otpTraceId: otpTraceId,
                            error: queryError,
                            timestamp: new Date().toISOString()
                        }));
                        return [2 /*return*/, {
                                valid: false,
                                error: 'Unable to verify code due to a database error. Please try again.',
                                dealId: deal.id,
                                otpTraceId: otpTraceId,
                                lookupStarted: lookupStarted,
                                matchingRowFound: false
                            }];
                    }
                    activeOtp = activeOtps && activeOtps.length > 0 ? activeOtps[0] : null;
                    console.log("[OTP_DB_LOOKUP]", JSON.stringify({
                        otpTraceId: otpTraceId,
                        dealId: deal.id,
                        normalizedEmail: normalizedEmail,
                        rowFound: Boolean(activeOtp),
                        otpRowId: (activeOtp === null || activeOtp === void 0 ? void 0 : activeOtp.id) || null,
                        createdAt: (activeOtp === null || activeOtp === void 0 ? void 0 : activeOtp.created_at) || null,
                        expiresAt: (activeOtp === null || activeOtp === void 0 ? void 0 : activeOtp.expires_at) || null,
                        attempts: (activeOtp === null || activeOtp === void 0 ? void 0 : activeOtp.attempts) || 0,
                        verified: (activeOtp === null || activeOtp === void 0 ? void 0 : activeOtp.verified) || false,
                        timestamp: new Date().toISOString()
                    }));
                    if (!!activeOtp) return [3 /*break*/, 4];
                    return [4 /*yield*/, admin
                            .from('deal_otps')
                            .select('id, verified, created_at, expires_at, attempts')
                            .eq('deal_id', deal.id)
                            .eq('email', normalizedEmail)
                            .order('created_at', { ascending: false })
                            .limit(1)];
                case 3:
                    anyOtps = (_c.sent()).data;
                    firstAnyOtp = anyOtps && anyOtps.length > 0 ? anyOtps[0] : null;
                    if (firstAnyOtp && firstAnyOtp.verified) {
                        console.warn("[OTP_ALREADY_VERIFIED]", JSON.stringify({
                            otpTraceId: otpTraceId,
                            dealId: deal.id,
                            email: maskEmail(normalizedEmail),
                            timestamp: new Date().toISOString()
                        }));
                        return [2 /*return*/, {
                                valid: false,
                                error: 'This code has already been used. Please request a new code.',
                                dealId: deal.id,
                                otpTraceId: otpTraceId,
                                lookupStarted: lookupStarted,
                                matchingRowFound: true,
                                matchingRowId: firstAnyOtp.id,
                                matchingRowCreatedAt: firstAnyOtp.created_at,
                                matchingRowExpiresAt: firstAnyOtp.expires_at,
                                matchingRowVerified: firstAnyOtp.verified,
                                matchingRowAttempts: firstAnyOtp.attempts,
                                hashComparisonResult: false,
                                verificationResult: 'ALREADY_VERIFIED'
                            }];
                    }
                    console.warn("[OTP_NO_ROW_FOUND]", JSON.stringify({
                        otpTraceId: otpTraceId,
                        dealId: deal.id,
                        email: maskEmail(normalizedEmail),
                        timestamp: new Date().toISOString()
                    }));
                    return [2 /*return*/, {
                            valid: false,
                            error: 'No active verification code found. Please request a new code.',
                            dealId: deal.id,
                            otpTraceId: otpTraceId,
                            lookupStarted: lookupStarted,
                            matchingRowFound: firstAnyOtp ? true : false,
                            matchingRowId: firstAnyOtp === null || firstAnyOtp === void 0 ? void 0 : firstAnyOtp.id,
                            matchingRowCreatedAt: firstAnyOtp === null || firstAnyOtp === void 0 ? void 0 : firstAnyOtp.created_at,
                            matchingRowExpiresAt: firstAnyOtp === null || firstAnyOtp === void 0 ? void 0 : firstAnyOtp.expires_at,
                            matchingRowVerified: firstAnyOtp === null || firstAnyOtp === void 0 ? void 0 : firstAnyOtp.verified,
                            matchingRowAttempts: firstAnyOtp === null || firstAnyOtp === void 0 ? void 0 : firstAnyOtp.attempts,
                            hashComparisonResult: false,
                            verificationResult: 'NO_ROW_FOUND'
                        }];
                case 4:
                    now = Date.now();
                    expiresAtMs = new Date(activeOtp.expires_at).getTime();
                    if (!(expiresAtMs < now)) return [3 /*break*/, 6];
                    console.warn("[OTP_EXPIRED]", JSON.stringify({
                        otpTraceId: otpTraceId,
                        dealId: deal.id,
                        email: maskEmail(normalizedEmail),
                        expiredAt: activeOtp.expires_at,
                        timestamp: new Date().toISOString()
                    }));
                    return [4 /*yield*/, admin.from('deal_otps').delete().eq('id', activeOtp.id)];
                case 5:
                    _c.sent();
                    return [2 /*return*/, {
                            valid: false,
                            error: 'This code has expired. Request a new code.',
                            dealId: deal.id,
                            otpTraceId: otpTraceId,
                            lookupStarted: lookupStarted,
                            matchingRowFound: true,
                            matchingRowId: activeOtp.id,
                            matchingRowCreatedAt: activeOtp.created_at,
                            matchingRowExpiresAt: activeOtp.expires_at,
                            matchingRowVerified: activeOtp.verified,
                            matchingRowAttempts: activeOtp.attempts,
                            hashComparisonResult: false,
                            verificationResult: 'EXPIRED'
                        }];
                case 6:
                    if (!(activeOtp.attempts >= MAX_ATTEMPTS)) return [3 /*break*/, 8];
                    console.warn("[OTP_TOO_MANY_ATTEMPTS]", JSON.stringify({
                        otpTraceId: otpTraceId,
                        dealId: deal.id,
                        email: maskEmail(normalizedEmail),
                        attempts: activeOtp.attempts,
                        timestamp: new Date().toISOString()
                    }));
                    return [4 /*yield*/, admin.from('deal_otps').delete().eq('id', activeOtp.id)];
                case 7:
                    _c.sent();
                    return [2 /*return*/, {
                            valid: false,
                            error: 'Too many verification attempts. Please request a new code later.',
                            dealId: deal.id,
                            otpTraceId: otpTraceId,
                            lookupStarted: lookupStarted,
                            matchingRowFound: true,
                            matchingRowId: activeOtp.id,
                            matchingRowCreatedAt: activeOtp.created_at,
                            matchingRowExpiresAt: activeOtp.expires_at,
                            matchingRowVerified: activeOtp.verified,
                            matchingRowAttempts: activeOtp.attempts,
                            hashComparisonResult: false,
                            verificationResult: 'MAX_ATTEMPTS_EXCEEDED'
                        }];
                case 8:
                    expectedHash = activeOtp.otp_hash;
                    actualHash = hashOtp(trimmedOtp, 'CLIENT_DEAL_ACCESS', "".concat(deal.id, ":").concat(normalizedEmail));
                    expectedBuffer = Buffer.from(expectedHash, 'hex');
                    actualBuffer = Buffer.from(actualHash, 'hex');
                    matches = expectedBuffer.length === actualBuffer.length &&
                        crypto.timingSafeEqual(expectedBuffer, actualBuffer);
                    if (!!matches) return [3 /*break*/, 12];
                    newAttempts = (activeOtp.attempts || 0) + 1;
                    return [4 /*yield*/, admin.from('deal_otps').update({ attempts: newAttempts }).eq('id', activeOtp.id)];
                case 9:
                    _c.sent();
                    console.warn("[OTP_INCORRECT_CODE]", JSON.stringify({
                        otpTraceId: otpTraceId,
                        dealId: deal.id,
                        email: maskEmail(normalizedEmail),
                        attempt: newAttempts,
                        maxAttempts: MAX_ATTEMPTS,
                        timestamp: new Date().toISOString()
                    }));
                    if (!(newAttempts >= MAX_ATTEMPTS)) return [3 /*break*/, 11];
                    return [4 /*yield*/, admin.from('deal_otps').delete().eq('id', activeOtp.id)];
                case 10:
                    _c.sent();
                    return [2 /*return*/, {
                            valid: false,
                            error: 'Too many verification attempts. Please request a new code later.',
                            dealId: deal.id,
                            otpTraceId: otpTraceId,
                            lookupStarted: lookupStarted,
                            matchingRowFound: true,
                            matchingRowId: activeOtp.id,
                            matchingRowCreatedAt: activeOtp.created_at,
                            matchingRowExpiresAt: activeOtp.expires_at,
                            matchingRowVerified: activeOtp.verified,
                            matchingRowAttempts: newAttempts,
                            hashComparisonResult: false,
                            verificationResult: 'MAX_ATTEMPTS_EXCEEDED'
                        }];
                case 11: return [2 /*return*/, {
                        valid: false,
                        error: 'Incorrect verification code. Please try again.',
                        dealId: deal.id,
                        otpTraceId: otpTraceId,
                        lookupStarted: lookupStarted,
                        matchingRowFound: true,
                        matchingRowId: activeOtp.id,
                        matchingRowCreatedAt: activeOtp.created_at,
                        matchingRowExpiresAt: activeOtp.expires_at,
                        matchingRowVerified: activeOtp.verified,
                        matchingRowAttempts: newAttempts,
                        hashComparisonResult: false,
                        verificationResult: 'HASH_MISMATCH'
                    }];
                case 12: 
                // 6. Mark OTP verified (used) immediately
                return [4 /*yield*/, admin.from('deal_otps').update({ verified: true }).eq('id', activeOtp.id)];
                case 13:
                    // 6. Mark OTP verified (used) immediately
                    _c.sent();
                    console.log("[OTP_VERIFY_SUCCESS]", JSON.stringify({
                        otpTraceId: otpTraceId,
                        dealId: deal.id,
                        normalizedEmail: normalizedEmail,
                        otpRowId: activeOtp.id,
                        timestamp: new Date().toISOString()
                    }));
                    sessionPayload = {
                        dealId: deal.id,
                        dealToken: deal.token,
                        clientEmail: normalizedEmail,
                        verifiedAt: Date.now(),
                        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
                    };
                    payloadJson = JSON.stringify(sessionPayload);
                    payloadB64 = Buffer.from(payloadJson).toString('base64url');
                    signature = crypto
                        .createHmac('sha256', OTP_SECRET)
                        .update(payloadB64)
                        .digest('base64url');
                    clientSessionToken = "".concat(payloadB64, ".").concat(signature);
                    _c.label = 14;
                case 14:
                    _c.trys.push([14, 16, , 17]);
                    return [4 /*yield*/, admin.from('deal_events').insert({
                            deal_id: deal.id,
                            type: 'client_verified',
                            actor_id: normalizedEmail,
                            actor_name: deal.client_name || 'Client',
                            actor_role: 'client',
                            description: "".concat(deal.client_name || 'Client', " verified email access to the Deal workspace."),
                        })];
                case 15:
                    _c.sent();
                    return [3 /*break*/, 17];
                case 16:
                    eventErr_1 = _c.sent();
                    console.warn('[Deal Event Insert Warn]', eventErr_1);
                    return [3 /*break*/, 17];
                case 17: return [2 /*return*/, {
                        valid: true,
                        clientSessionToken: clientSessionToken,
                        deal: resolvedDeal,
                        dealId: deal.id,
                        otpTraceId: otpTraceId,
                        lookupStarted: lookupStarted,
                        matchingRowFound: true,
                        matchingRowId: activeOtp.id,
                        matchingRowCreatedAt: activeOtp.created_at,
                        matchingRowExpiresAt: activeOtp.expires_at,
                        matchingRowVerified: activeOtp.verified,
                        matchingRowAttempts: activeOtp.attempts,
                        hashComparisonResult: true,
                        verificationResult: 'SUCCESS'
                    }];
            }
        });
    });
}
/**
 * Validates a signed Client Session Token.
 */
export function verifyClientSessionToken(tokenString, dealToken, rawEmail) {
    if (!tokenString || !tokenString.includes('.'))
        return false;
    var _a = tokenString.split('.'), payloadB64 = _a[0], signature = _a[1];
    if (!payloadB64 || !signature)
        return false;
    var expectedSignature = crypto
        .createHmac('sha256', OTP_SECRET)
        .update(payloadB64)
        .digest('base64url');
    var sigBuffer = Buffer.from(signature);
    var expBuffer = Buffer.from(expectedSignature);
    if (sigBuffer.length !== expBuffer.length || !crypto.timingSafeEqual(sigBuffer, expBuffer)) {
        return false;
    }
    try {
        var payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));
        if (payload.dealToken !== dealToken)
            return false;
        if (normalizeEmail(payload.clientEmail) !== normalizeEmail(rawEmail))
            return false;
        if (payload.expiresAt < Date.now())
            return false;
        return true;
    }
    catch (_b) {
        return false;
    }
}
