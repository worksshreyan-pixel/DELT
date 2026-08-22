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
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateDealToken, getDealPublicUrl } from '@/lib/deal-url';
import { sendDealInvitationEmail } from '@/lib/email';
import { serializeDescription } from '@/lib/utils';
import { FREE_PLAN_DEAL_LIMIT } from '@/lib/plans';
function maskEmail(email) {
    if (!email || !email.includes('@'))
        return '***';
    var _a = email.split('@'), local = _a[0], domain = _a[1];
    if (local.length <= 2)
        return "".concat(local[0], "***@").concat(domain);
    return "".concat(local[0], "***").concat(local[local.length - 1], "@").concat(domain);
}
export function POST(request) {
    var _a, _b, _c, _d, _e, _f;
    return __awaiter(this, void 0, void 0, function () {
        var supabase, user, contentType, clientName, clientEmail, clientCompany, title, description, scope, price, currency, deadline, deliverables, uploadedFiles, previewEnabled, previewFiles, formData, rawScope, rawDeliverables, allEntries, _i, allEntries_1, entry, allPreviews, _g, allPreviews_1, entry, body, admin, creditRecord, newCredit, now, token, clientId, existingClient, newClient, _h, deal, dealError, deliverableItems, primaryDeliverableId, i, delName, delivRecord, uploadedFileItems, canonicalDealUrl, creatorDisplayName, emailResult, error_1;
        return __generator(this, function (_j) {
            switch (_j.label) {
                case 0:
                    console.log("[DEAL_CREATE_START]", JSON.stringify({
                        timestamp: new Date().toISOString()
                    }));
                    _j.label = 1;
                case 1:
                    _j.trys.push([1, 31, , 32]);
                    return [4 /*yield*/, createServerSupabaseClient()];
                case 2:
                    supabase = _j.sent();
                    return [4 /*yield*/, supabase.auth.getUser()];
                case 3:
                    user = (_j.sent()).data.user;
                    if (!user) {
                        return [2 /*return*/, NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 })];
                    }
                    contentType = request.headers.get('content-type') || '';
                    clientName = '';
                    clientEmail = '';
                    clientCompany = '';
                    title = '';
                    description = '';
                    scope = [];
                    price = 0;
                    currency = 'INR';
                    deadline = '';
                    deliverables = [];
                    uploadedFiles = [];
                    previewEnabled = false;
                    previewFiles = [];
                    if (!contentType.includes('multipart/form-data')) return [3 /*break*/, 5];
                    return [4 /*yield*/, request.formData()];
                case 4:
                    formData = _j.sent();
                    clientName = formData.get('clientName') || '';
                    clientEmail = formData.get('clientEmail') || '';
                    clientCompany = formData.get('clientCompany') || '';
                    title = formData.get('title') || '';
                    description = formData.get('description') || '';
                    price = Number(formData.get('price') || 0);
                    currency = formData.get('currency') || 'INR';
                    deadline = formData.get('deadline') || '';
                    previewEnabled = formData.get('previewEnabled') === 'true';
                    rawScope = formData.get('scope');
                    if (rawScope) {
                        try {
                            scope = JSON.parse(rawScope);
                        }
                        catch (_k) {
                            scope = [rawScope];
                        }
                    }
                    rawDeliverables = formData.get('deliverables');
                    if (rawDeliverables) {
                        try {
                            deliverables = JSON.parse(rawDeliverables);
                        }
                        catch (_l) {
                            deliverables = [rawDeliverables];
                        }
                    }
                    allEntries = formData.getAll('files');
                    for (_i = 0, allEntries_1 = allEntries; _i < allEntries_1.length; _i++) {
                        entry = allEntries_1[_i];
                        if (entry instanceof File && entry.size > 0) {
                            uploadedFiles.push(entry);
                        }
                    }
                    allPreviews = formData.getAll('previewFiles');
                    for (_g = 0, allPreviews_1 = allPreviews; _g < allPreviews_1.length; _g++) {
                        entry = allPreviews_1[_g];
                        if (entry instanceof File && entry.size > 0) {
                            previewFiles.push(entry);
                        }
                    }
                    return [3 /*break*/, 7];
                case 5: return [4 /*yield*/, request.json()];
                case 6:
                    body = _j.sent();
                    clientName = body.clientName || '';
                    clientEmail = body.clientEmail || '';
                    clientCompany = body.clientCompany || '';
                    title = body.title || '';
                    description = body.description || '';
                    price = Number(body.price || 0);
                    currency = body.currency || 'INR';
                    deadline = body.deadline || '';
                    scope = Array.isArray(body.scope) ? body.scope : [];
                    deliverables = Array.isArray(body.deliverables) ? body.deliverables : [];
                    previewEnabled = body.previewEnabled === true;
                    _j.label = 7;
                case 7:
                    if (!clientName.trim() || !clientEmail.trim() || !title.trim() || !price || price <= 0) {
                        return [2 /*return*/, NextResponse.json({ error: 'Missing required deal fields (Client name, email, project title, price).' }, { status: 400 })];
                    }
                    admin = createAdminClient();
                    return [4 /*yield*/, admin
                            .from('deal_credits')
                            .select('*')
                            .eq('user_id', user.id)
                            .maybeSingle()];
                case 8:
                    creditRecord = (_j.sent()).data;
                    if (!!creditRecord) return [3 /*break*/, 10];
                    return [4 /*yield*/, admin
                            .from('deal_credits')
                            .insert({
                            user_id: user.id,
                            plan_id: 'free',
                            total: FREE_PLAN_DEAL_LIMIT,
                            used: 0,
                            remaining: FREE_PLAN_DEAL_LIMIT,
                        })
                            .select()
                            .single()];
                case 9:
                    newCredit = (_j.sent()).data;
                    creditRecord = newCredit;
                    return [3 /*break*/, 12];
                case 10:
                    if (!(creditRecord.total < FREE_PLAN_DEAL_LIMIT)) return [3 /*break*/, 12];
                    // Auto-upgrade legacy 1-deal limit to the configurable limit
                    return [4 /*yield*/, admin
                            .from('deal_credits')
                            .update({
                            total: FREE_PLAN_DEAL_LIMIT,
                            remaining: Math.max(0, FREE_PLAN_DEAL_LIMIT - (creditRecord.used || 0)),
                        })
                            .eq('user_id', user.id)];
                case 11:
                    // Auto-upgrade legacy 1-deal limit to the configurable limit
                    _j.sent();
                    creditRecord.total = FREE_PLAN_DEAL_LIMIT;
                    creditRecord.remaining = Math.max(0, FREE_PLAN_DEAL_LIMIT - (creditRecord.used || 0));
                    _j.label = 12;
                case 12:
                    if (creditRecord && creditRecord.remaining <= 0) {
                        return [2 /*return*/, NextResponse.json({ error: 'You have reached your plan limit for active Deals. Please upgrade to create more deals.' }, { status: 403 })];
                    }
                    now = new Date().toISOString();
                    token = generateDealToken();
                    clientId = null;
                    return [4 /*yield*/, admin
                            .from('clients')
                            .select('id, deal_count, total_value')
                            .eq('creator_id', user.id)
                            .eq('email', clientEmail.trim().toLowerCase())
                            .maybeSingle()];
                case 13:
                    existingClient = (_j.sent()).data;
                    if (!existingClient) return [3 /*break*/, 15];
                    clientId = existingClient.id;
                    return [4 /*yield*/, admin
                            .from('clients')
                            .update({
                            deal_count: existingClient.deal_count + 1,
                            total_value: Number(existingClient.total_value) + price,
                            last_activity_at: now,
                        })
                            .eq('id', existingClient.id)];
                case 14:
                    _j.sent();
                    return [3 /*break*/, 17];
                case 15: return [4 /*yield*/, admin
                        .from('clients')
                        .insert({
                        creator_id: user.id,
                        name: clientName.trim(),
                        email: clientEmail.trim().toLowerCase(),
                        company: clientCompany.trim() || null,
                        deal_count: 1,
                        total_value: price,
                        currency: currency,
                        status: 'active',
                        last_activity_at: now,
                    })
                        .select()
                        .single()];
                case 16:
                    newClient = (_j.sent()).data;
                    if (newClient) {
                        clientId = newClient.id;
                    }
                    _j.label = 17;
                case 17: return [4 /*yield*/, admin
                        .from('deals')
                        .insert({
                        token: token,
                        creator_id: user.id,
                        client_id: clientId,
                        client_name: clientName.trim(),
                        client_email: clientEmail.trim().toLowerCase(),
                        title: title.trim(),
                        description: serializeDescription(description.trim() || null, previewEnabled),
                        scope: scope.length > 0 ? scope : ['Project requirements & delivery'],
                        price: price,
                        currency: currency,
                        status: 'in_progress',
                        deadline: deadline || null,
                        progress: 10,
                        payment_status: 'pending',
                        last_activity_at: now,
                    })
                        .select()
                        .single()];
                case 18:
                    _h = _j.sent(), deal = _h.data, dealError = _h.error;
                    if (dealError || !deal) {
                        console.error('Deal creation error:', dealError);
                        return [2 /*return*/, NextResponse.json({ error: (dealError === null || dealError === void 0 ? void 0 : dealError.message) || 'Failed to create deal' }, { status: 500 })];
                    }
                    console.log("[DEAL_CREATED]", JSON.stringify({
                        dealId: deal.id,
                        clientEmailMasked: maskEmail(deal.client_email),
                        tokenPresent: Boolean(deal.token),
                        timestamp: new Date().toISOString()
                    }));
                    // 4. Create participants
                    return [4 /*yield*/, admin.from('deal_participants').insert([
                            {
                                deal_id: deal.id,
                                user_id: user.id,
                                role: 'creator',
                                email: user.email || '',
                                display_name: ((_a = user.user_metadata) === null || _a === void 0 ? void 0 : _a.displayName) || 'Creator',
                            },
                            {
                                deal_id: deal.id,
                                role: 'client',
                                email: clientEmail.trim().toLowerCase(),
                                display_name: clientName.trim(),
                            },
                        ])];
                case 19:
                    // 4. Create participants
                    _j.sent();
                    deliverableItems = deliverables.length > 0 ? deliverables : ['Final Project Deliverables'];
                    primaryDeliverableId = '';
                    i = 0;
                    _j.label = 20;
                case 20:
                    if (!(i < deliverableItems.length)) return [3 /*break*/, 23];
                    delName = deliverableItems[i];
                    return [4 /*yield*/, admin.from('deliverables').insert({
                            deal_id: deal.id,
                            name: delName,
                            status: 'pending',
                        }).select().single()];
                case 21:
                    delivRecord = (_j.sent()).data;
                    if (i === 0 && delivRecord) {
                        primaryDeliverableId = delivRecord.id;
                    }
                    _j.label = 22;
                case 22:
                    i++;
                    return [3 /*break*/, 20];
                case 23:
                    uploadedFileItems = [];
                    // 7. Initial Events & Greeting message
                    return [4 /*yield*/, admin.from('deal_events').insert([
                            {
                                deal_id: deal.id,
                                type: 'deal_created',
                                actor_id: user.id,
                                actor_name: ((_b = user.user_metadata) === null || _b === void 0 ? void 0 : _b.displayName) || 'Creator',
                                actor_role: 'creator',
                                description: "Deal created for ".concat(clientName, " at ").concat(price, " ").concat(currency),
                            },
                            {
                                deal_id: deal.id,
                                type: 'deal_shared',
                                actor_id: user.id,
                                actor_name: ((_c = user.user_metadata) === null || _c === void 0 ? void 0 : _c.displayName) || 'Creator',
                                actor_role: 'creator',
                                description: "Private link generated for ".concat(clientEmail),
                            },
                        ])];
                case 24:
                    // 7. Initial Events & Greeting message
                    _j.sent();
                    return [4 /*yield*/, admin.from('deal_messages').insert({
                            deal_id: deal.id,
                            sender_id: user.id,
                            sender_name: ((_d = user.user_metadata) === null || _d === void 0 ? void 0 : _d.displayName) || 'Creator',
                            sender_role: 'creator',
                            type: 'text',
                            content: "Welcome to the Deal workspace! I have prepared the scope and details for \"".concat(title, "\". Feel free to chat, propose adjustments, or review progress right here."),
                        })];
                case 25:
                    _j.sent();
                    if (!creditRecord) return [3 /*break*/, 27];
                    return [4 /*yield*/, admin
                            .from('deal_credits')
                            .update({
                            used: creditRecord.used + 1,
                            remaining: Math.max(0, creditRecord.remaining - 1),
                            updated_at: now,
                        })
                            .eq('user_id', user.id)];
                case 26:
                    _j.sent();
                    _j.label = 27;
                case 27:
                    canonicalDealUrl = getDealPublicUrl(deal.token);
                    creatorDisplayName = ((_e = user.user_metadata) === null || _e === void 0 ? void 0 : _e.displayName) || ((_f = user.email) === null || _f === void 0 ? void 0 : _f.split('@')[0]) || 'Creator';
                    console.log("[INVITATION_EMAIL_START]", JSON.stringify({
                        dealId: deal.id,
                        clientEmailMasked: maskEmail(clientEmail),
                        timestamp: new Date().toISOString()
                    }));
                    return [4 /*yield*/, sendDealInvitationEmail({
                            clientName: clientName.trim(),
                            clientEmail: clientEmail.trim().toLowerCase(),
                            creatorName: creatorDisplayName,
                            dealTitle: title.trim(),
                            dealPrice: price,
                            dealCurrency: currency,
                            dealUrl: canonicalDealUrl,
                        })];
                case 28:
                    emailResult = _j.sent();
                    console.log("[INVITATION_EMAIL_RESULT]", JSON.stringify({
                        dealId: deal.id,
                        success: emailResult.success,
                        delivered: emailResult.delivered,
                        simulated: emailResult.simulated,
                        messageId: emailResult.messageId || null,
                        error: emailResult.error || null,
                        timestamp: new Date().toISOString()
                    }));
                    if (!emailResult.delivered) return [3 /*break*/, 30];
                    return [4 /*yield*/, admin.from('deal_events').insert({
                            deal_id: deal.id,
                            type: 'deal_shared',
                            actor_name: 'DELT System',
                            actor_role: 'system',
                            description: "Invitation email delivered to ".concat(clientEmail),
                        })];
                case 29:
                    _j.sent();
                    _j.label = 30;
                case 30: return [2 /*return*/, NextResponse.json({
                        success: true,
                        deal: deal,
                        token: deal.token,
                        url: canonicalDealUrl,
                        emailResult: emailResult,
                        deliverableId: primaryDeliverableId,
                        filesUploaded: 0,
                    })];
                case 31:
                    error_1 = _j.sent();
                    console.error('Error creating deal:', error_1);
                    return [2 /*return*/, NextResponse.json({ error: (error_1 === null || error_1 === void 0 ? void 0 : error_1.message) || 'Internal server error' }, { status: 500 })];
                case 32: return [2 /*return*/];
            }
        });
    });
}
