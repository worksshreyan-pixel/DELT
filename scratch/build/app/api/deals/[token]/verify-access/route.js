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
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { hasSupabasePublicConfig } from '@/lib/env';
import { parseDescription } from '@/lib/utils';
export function POST(request, _a) {
    var params = _a.params;
    return __awaiter(this, void 0, void 0, function () {
        var token, admin, _b, dbDeal, dealError, creator, expectedClientEmail, creatorId, supabase, user, clientSessionHeader, verifyClientSessionToken, hasValidClientToken, isAuthorizedClient, isCreator, userEmail, error_1;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 9, , 10]);
                    return [4 /*yield*/, params];
                case 1:
                    token = (_c.sent()).token;
                    if (!token) {
                        return [2 /*return*/, NextResponse.json({ error: 'Deal token is required.' }, { status: 400 })];
                    }
                    if (!hasSupabasePublicConfig()) {
                        return [2 /*return*/, NextResponse.json({ error: 'Database is not configured.' }, { status: 500 })];
                    }
                    admin = createAdminClient();
                    return [4 /*yield*/, admin
                            .from('deals')
                            .select('*')
                            .eq('token', token)
                            .maybeSingle()];
                case 2:
                    _b = _c.sent(), dbDeal = _b.data, dealError = _b.error;
                    if (dealError || !dbDeal) {
                        return [2 /*return*/, NextResponse.json({ error: 'Deal not found or invalid link.' }, { status: 404 })];
                    }
                    return [4 /*yield*/, admin
                            .from('profiles')
                            .select('display_name, email, profession, company')
                            .eq('id', dbDeal.creator_id)
                            .maybeSingle()];
                case 3:
                    creator = (_c.sent()).data;
                    expectedClientEmail = (dbDeal.client_email || '').trim().toLowerCase();
                    creatorId = dbDeal.creator_id;
                    return [4 /*yield*/, createServerSupabaseClient()];
                case 4:
                    supabase = _c.sent();
                    return [4 /*yield*/, supabase.auth.getUser()];
                case 5:
                    user = (_c.sent()).data.user;
                    clientSessionHeader = request.headers.get('x-client-session-token');
                    return [4 /*yield*/, import('@/lib/otp')];
                case 6:
                    verifyClientSessionToken = (_c.sent()).verifyClientSessionToken;
                    hasValidClientToken = clientSessionHeader
                        ? verifyClientSessionToken(clientSessionHeader, token, expectedClientEmail)
                        : false;
                    isAuthorizedClient = false;
                    isCreator = false;
                    userEmail = '';
                    if (user) {
                        userEmail = (user.email || '').trim().toLowerCase();
                        isAuthorizedClient = Boolean(userEmail && userEmail === expectedClientEmail);
                        isCreator = Boolean(user.id === creatorId ||
                            (user.email && (creator === null || creator === void 0 ? void 0 : creator.email) && user.email.toLowerCase() === creator.email.toLowerCase()));
                    }
                    else if (hasValidClientToken) {
                        isAuthorizedClient = true;
                        userEmail = expectedClientEmail;
                    }
                    // Unauthenticated user
                    if (!user && !hasValidClientToken) {
                        return [2 /*return*/, NextResponse.json({
                                authorized: false,
                                dealExists: true,
                                dealTitle: dbDeal.title,
                                clientEmail: dbDeal.client_email,
                                creatorName: (creator === null || creator === void 0 ? void 0 : creator.display_name) || 'Creator',
                            })];
                    }
                    // Unauthorized authenticated user
                    if (!isAuthorizedClient && !isCreator) {
                        return [2 /*return*/, NextResponse.json({
                                authorized: false,
                                error: "You are signed in as ".concat((user === null || user === void 0 ? void 0 : user.email) || 'an unauthorized account', ", but this Deal workspace is private to ").concat(dbDeal.client_email, "."),
                                dealTitle: dbDeal.title,
                                clientEmail: dbDeal.client_email,
                                userEmail: user === null || user === void 0 ? void 0 : user.email,
                            }, { status: 403 })];
                    }
                    if (!isAuthorizedClient) return [3 /*break*/, 8];
                    return [4 /*yield*/, admin.from('deal_events').insert({
                            deal_id: dbDeal.id,
                            type: 'client_verified',
                            actor_id: userEmail,
                            actor_name: dbDeal.client_name || 'Client',
                            actor_role: 'client',
                            description: "".concat(dbDeal.client_name || 'Client', " accessed the private Deal workspace."),
                        })];
                case 7:
                    _c.sent();
                    _c.label = 8;
                case 8: 
                // Authorized! Return complete deal workspace payload
                return [2 /*return*/, NextResponse.json({
                        authorized: true,
                        deal: {
                            id: dbDeal.id,
                            token: dbDeal.token,
                            creatorId: dbDeal.creator_id,
                            clientId: dbDeal.client_id,
                            clientName: dbDeal.client_name,
                            clientEmail: dbDeal.client_email,
                            title: dbDeal.title,
                            description: parseDescription(dbDeal.description).description,
                            scope: Array.isArray(dbDeal.scope) ? dbDeal.scope : [],
                            price: Number(dbDeal.price),
                            currency: dbDeal.currency || 'INR',
                            status: dbDeal.status || 'in_progress',
                            deadline: dbDeal.deadline,
                            progress: Number(dbDeal.progress || 0),
                            paymentStatus: dbDeal.payment_status || 'pending',
                            lastActivityAt: dbDeal.last_activity_at || dbDeal.created_at,
                            createdAt: dbDeal.created_at,
                            previewEnabled: parseDescription(dbDeal.description).previewEnabled,
                        },
                        clientName: dbDeal.client_name,
                        clientEmail: dbDeal.client_email,
                        creatorName: (creator === null || creator === void 0 ? void 0 : creator.display_name) || 'Creator',
                        role: isCreator ? 'creator' : 'client',
                    })];
                case 9:
                    error_1 = _c.sent();
                    console.error('Error verifying deal access:', error_1);
                    return [2 /*return*/, NextResponse.json({ error: (error_1 === null || error_1 === void 0 ? void 0 : error_1.message) || 'Verification failed.' }, { status: 500 })];
                case 10: return [2 /*return*/];
            }
        });
    });
}
