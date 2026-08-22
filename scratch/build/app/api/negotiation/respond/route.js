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
export function POST(request) {
    return __awaiter(this, void 0, void 0, function () {
        var body, proposalId, dealId, response, responderName, responderRole, admin, now, _a, proposal, propError, _b, deal, dealError, newState, isClientResponder, sendProposalStatusEmail, creatorProfile, emailErr_1, error_1;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 21, , 22]);
                    return [4 /*yield*/, request.json()];
                case 1:
                    body = _c.sent();
                    proposalId = body.proposalId, dealId = body.dealId, response = body.response, responderName = body.responderName, responderRole = body.responderRole;
                    if (!proposalId || !dealId || !['accept', 'decline'].includes(response)) {
                        return [2 /*return*/, NextResponse.json({ error: 'Invalid proposal response data' }, { status: 400 })];
                    }
                    admin = createAdminClient();
                    now = new Date().toISOString();
                    return [4 /*yield*/, admin
                            .from('price_proposals')
                            .select('*')
                            .eq('id', proposalId)
                            .maybeSingle()];
                case 2:
                    _a = _c.sent(), proposal = _a.data, propError = _a.error;
                    if (propError || !proposal) {
                        return [2 /*return*/, NextResponse.json({ error: 'Proposal not found' }, { status: 404 })];
                    }
                    if (proposal.state !== 'pending') {
                        return [2 /*return*/, NextResponse.json({ error: 'Proposal has already been resolved' }, { status: 400 })];
                    }
                    return [4 /*yield*/, admin
                            .from('deals')
                            .select('*')
                            .eq('id', dealId)
                            .maybeSingle()];
                case 3:
                    _b = _c.sent(), deal = _b.data, dealError = _b.error;
                    if (dealError || !deal) {
                        return [2 /*return*/, NextResponse.json({ error: 'Deal not found' }, { status: 404 })];
                    }
                    newState = response === 'accept' ? 'accepted' : 'declined';
                    return [4 /*yield*/, admin
                            .from('price_proposals')
                            .update({
                            state: newState,
                            resolved_at: now,
                        })
                            .eq('id', proposal.id)];
                case 4:
                    _c.sent();
                    if (!(response === 'accept')) return [3 /*break*/, 8];
                    // 4. Update deal authoritative agreed price
                    return [4 /*yield*/, admin
                            .from('deals')
                            .update({
                            price: proposal.proposed_price,
                            status: 'agreed',
                            updated_at: now,
                            last_activity_at: now,
                        })
                            .eq('id', deal.id)];
                case 5:
                    // 4. Update deal authoritative agreed price
                    _c.sent();
                    // 5. Audit event
                    return [4 /*yield*/, admin.from('deal_events').insert({
                            deal_id: deal.id,
                            type: 'price_accepted',
                            actor_name: responderName,
                            actor_role: responderRole,
                            description: "Price proposal of ".concat(proposal.proposed_price, " ").concat(deal.currency, " accepted by ").concat(responderName, "."),
                        })];
                case 6:
                    // 5. Audit event
                    _c.sent();
                    // 6. System message
                    return [4 /*yield*/, admin.from('deal_messages').insert({
                            deal_id: deal.id,
                            sender_id: 'system',
                            sender_name: 'DELT System',
                            sender_role: 'creator',
                            type: 'system',
                            content: "Price agreement established at ".concat(proposal.proposed_price, " ").concat(deal.currency),
                        })];
                case 7:
                    // 6. System message
                    _c.sent();
                    return [3 /*break*/, 11];
                case 8: 
                // Declined
                return [4 /*yield*/, admin.from('deal_events').insert({
                        deal_id: deal.id,
                        type: 'price_declined',
                        actor_name: responderName,
                        actor_role: responderRole,
                        description: "Price proposal of ".concat(proposal.proposed_price, " ").concat(deal.currency, " declined by ").concat(responderName, "."),
                    })];
                case 9:
                    // Declined
                    _c.sent();
                    return [4 /*yield*/, admin.from('deal_messages').insert({
                            deal_id: deal.id,
                            sender_id: 'system',
                            sender_name: 'DELT System',
                            sender_role: 'creator',
                            type: 'system',
                            content: "Price proposal of ".concat(proposal.proposed_price, " ").concat(deal.currency, " declined."),
                        })];
                case 10:
                    _c.sent();
                    _c.label = 11;
                case 11:
                    _c.trys.push([11, 19, , 20]);
                    isClientResponder = responderRole === 'client';
                    return [4 /*yield*/, import('@/lib/email')];
                case 12:
                    sendProposalStatusEmail = (_c.sent()).sendProposalStatusEmail;
                    if (!isClientResponder) return [3 /*break*/, 16];
                    return [4 /*yield*/, admin
                            .from('profiles')
                            .select('email, display_name')
                            .eq('id', deal.creator_id)
                            .maybeSingle()];
                case 13:
                    creatorProfile = (_c.sent()).data;
                    if (!(creatorProfile === null || creatorProfile === void 0 ? void 0 : creatorProfile.email)) return [3 /*break*/, 15];
                    return [4 /*yield*/, sendProposalStatusEmail({
                            recipientName: creatorProfile.display_name || 'Creator',
                            recipientEmail: creatorProfile.email,
                            responderName: responderName || 'Client',
                            dealTitle: deal.title,
                            price: Number(proposal.proposed_price),
                            currency: deal.currency || 'INR',
                            accepted: response === 'accept',
                            dealUrl: "".concat(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', "/deals/").concat(deal.id),
                        })];
                case 14:
                    _c.sent();
                    _c.label = 15;
                case 15: return [3 /*break*/, 18];
                case 16:
                    if (!deal.client_email) return [3 /*break*/, 18];
                    return [4 /*yield*/, sendProposalStatusEmail({
                            recipientName: deal.client_name || 'Client',
                            recipientEmail: deal.client_email,
                            responderName: responderName || 'Creator',
                            dealTitle: deal.title,
                            price: Number(proposal.proposed_price),
                            currency: deal.currency || 'INR',
                            accepted: response === 'accept',
                            dealUrl: "".concat(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', "/deal/").concat(deal.token),
                        })];
                case 17:
                    _c.sent();
                    _c.label = 18;
                case 18: return [3 /*break*/, 20];
                case 19:
                    emailErr_1 = _c.sent();
                    console.error('Error sending proposal status email:', emailErr_1);
                    return [3 /*break*/, 20];
                case 20: return [2 /*return*/, NextResponse.json({ success: true, state: newState })];
                case 21:
                    error_1 = _c.sent();
                    console.error('Error responding to price proposal:', error_1);
                    return [2 /*return*/, NextResponse.json({ error: (error_1 === null || error_1 === void 0 ? void 0 : error_1.message) || 'Internal server error' }, { status: 500 })];
                case 22: return [2 /*return*/];
            }
        });
    });
}
