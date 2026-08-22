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
        var body, dealId, proposedPrice, reason, proposedByRole, proposedByName, proposedById, parentProposalId_1, admin, _a, deal, dealError, _b, existingPending, existError, matchesParent, now, priceNum, direction, prevPrice, parentProposal, _c, proposal, propError, error_1;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _d.trys.push([0, 14, , 15]);
                    return [4 /*yield*/, request.json()];
                case 1:
                    body = _d.sent();
                    dealId = body.dealId, proposedPrice = body.proposedPrice, reason = body.reason, proposedByRole = body.proposedByRole, proposedByName = body.proposedByName, proposedById = body.proposedById, parentProposalId_1 = body.parentProposalId;
                    if (!dealId || !proposedPrice || Number(proposedPrice) <= 0) {
                        return [2 /*return*/, NextResponse.json({ error: 'Valid proposed price is required' }, { status: 400 })];
                    }
                    admin = createAdminClient();
                    return [4 /*yield*/, admin
                            .from('deals')
                            .select('*')
                            .eq('id', dealId)
                            .maybeSingle()];
                case 2:
                    _a = _d.sent(), deal = _a.data, dealError = _a.error;
                    if (dealError || !deal) {
                        return [2 /*return*/, NextResponse.json({ error: 'Deal not found' }, { status: 404 })];
                    }
                    return [4 /*yield*/, admin
                            .from('price_proposals')
                            .select('id, state, direction')
                            .eq('deal_id', deal.id)
                            .eq('state', 'pending')];
                case 3:
                    _b = _d.sent(), existingPending = _b.data, existError = _b.error;
                    if (existError) {
                        return [2 /*return*/, NextResponse.json({ error: 'Database verification failed' }, { status: 500 })];
                    }
                    if (existingPending && existingPending.length > 0) {
                        if (parentProposalId_1) {
                            matchesParent = existingPending.some(function (p) { return p.id === parentProposalId_1; });
                            if (!matchesParent) {
                                return [2 /*return*/, NextResponse.json({ error: 'The proposal you are countering is no longer pending.' }, { status: 400 })];
                            }
                        }
                        else {
                            return [2 /*return*/, NextResponse.json({ error: 'There is already an active price proposal. Please respond or counter it.' }, { status: 400 })];
                        }
                    }
                    else if (parentProposalId_1) {
                        return [2 /*return*/, NextResponse.json({ error: 'The proposal you are countering has already been resolved.' }, { status: 400 })];
                    }
                    now = new Date().toISOString();
                    priceNum = Number(proposedPrice);
                    direction = proposedByRole === 'creator' ? 'creator_to_client' : 'client_to_creator';
                    prevPrice = deal.price;
                    if (!parentProposalId_1) return [3 /*break*/, 5];
                    return [4 /*yield*/, admin
                            .from('price_proposals')
                            .select('proposed_price')
                            .eq('id', parentProposalId_1)
                            .maybeSingle()];
                case 4:
                    parentProposal = (_d.sent()).data;
                    if (parentProposal) {
                        prevPrice = Number(parentProposal.proposed_price);
                    }
                    _d.label = 5;
                case 5: return [4 /*yield*/, admin
                        .from('price_proposals')
                        .insert({
                        deal_id: deal.id,
                        direction: direction,
                        previous_price: prevPrice,
                        proposed_price: priceNum,
                        reason: (reason === null || reason === void 0 ? void 0 : reason.trim()) || null,
                        state: 'pending',
                        counter_proposal_id: parentProposalId_1 || null,
                        proposed_by: proposedById || 'participant',
                        proposed_by_name: proposedByName || (proposedByRole === 'creator' ? 'Creator' : 'Client'),
                        proposed_by_role: proposedByRole,
                    })
                        .select()
                        .single()];
                case 6:
                    _c = _d.sent(), proposal = _c.data, propError = _c.error;
                    if (propError || !proposal) {
                        return [2 /*return*/, NextResponse.json({ error: (propError === null || propError === void 0 ? void 0 : propError.message) || 'Failed to submit proposal' }, { status: 500 })];
                    }
                    if (!parentProposalId_1) return [3 /*break*/, 8];
                    return [4 /*yield*/, admin
                            .from('price_proposals')
                            .update({
                            state: 'countered',
                            resolved_at: now,
                        })
                            .eq('id', parentProposalId_1)];
                case 7:
                    _d.sent();
                    _d.label = 8;
                case 8: 
                // 2. Update Deal status to negotiating
                return [4 /*yield*/, admin
                        .from('deals')
                        .update({
                        status: 'negotiating',
                        updated_at: now,
                        last_activity_at: now,
                    })
                        .eq('id', deal.id)];
                case 9:
                    // 2. Update Deal status to negotiating
                    _d.sent();
                    // 3. Post proposal message in deal_messages
                    return [4 /*yield*/, admin.from('deal_messages').insert({
                            deal_id: deal.id,
                            sender_id: proposedById || 'participant',
                            sender_name: proposedByName || (proposedByRole === 'creator' ? 'Creator' : 'Client'),
                            sender_role: proposedByRole,
                            type: 'proposal',
                            content: "".concat(proposedByName || (proposedByRole === 'creator' ? 'Creator' : 'Client'), " proposed price change to ").concat(priceNum, " ").concat(deal.currency),
                            proposal_id: proposal.id,
                        })];
                case 10:
                    // 3. Post proposal message in deal_messages
                    _d.sent();
                    // 4. Create timeline audit event
                    return [4 /*yield*/, admin.from('deal_events').insert({
                            deal_id: deal.id,
                            type: 'price_proposed',
                            actor_id: proposedById || 'participant',
                            actor_name: proposedByName,
                            actor_role: proposedByRole,
                            description: "".concat(proposedByName, " proposed price change to ").concat(priceNum, " ").concat(deal.currency),
                        })];
                case 11:
                    // 4. Create timeline audit event
                    _d.sent();
                    if (!(proposedByRole === 'client')) return [3 /*break*/, 13];
                    return [4 /*yield*/, admin.from('notifications').insert({
                            user_id: deal.creator_id,
                            type: 'new_proposal',
                            title: 'New Price Proposal',
                            description: "".concat(deal.client_name, " proposed ").concat(priceNum, " ").concat(deal.currency, " for \"").concat(deal.title, "\""),
                            deal_id: deal.id,
                            deal_title: deal.title,
                            read: false,
                        })];
                case 12:
                    _d.sent();
                    _d.label = 13;
                case 13: return [2 /*return*/, NextResponse.json({ success: true, proposal: proposal })];
                case 14:
                    error_1 = _d.sent();
                    console.error('Error submitting price proposal:', error_1);
                    return [2 /*return*/, NextResponse.json({ error: (error_1 === null || error_1 === void 0 ? void 0 : error_1.message) || 'Internal server error' }, { status: 500 })];
                case 15: return [2 /*return*/];
            }
        });
    });
}
