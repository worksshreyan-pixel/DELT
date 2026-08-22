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
        var body, dealId, deliverableId, action, feedback, clientName, admin, now, deal, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 18, , 19]);
                    return [4 /*yield*/, request.json()];
                case 1:
                    body = _a.sent();
                    dealId = body.dealId, deliverableId = body.deliverableId, action = body.action, feedback = body.feedback, clientName = body.clientName;
                    if (!dealId || !action || !['approve', 'request_changes'].includes(action)) {
                        return [2 /*return*/, NextResponse.json({ error: 'Invalid approval payload' }, { status: 400 })];
                    }
                    admin = createAdminClient();
                    now = new Date().toISOString();
                    return [4 /*yield*/, admin
                            .from('deals')
                            .select('*')
                            .eq('id', dealId)
                            .maybeSingle()];
                case 2:
                    deal = (_a.sent()).data;
                    if (!deal) {
                        return [2 /*return*/, NextResponse.json({ error: 'Deal not found' }, { status: 404 })];
                    }
                    if (!(action === 'approve')) return [3 /*break*/, 11];
                    if (!deliverableId) return [3 /*break*/, 4];
                    return [4 /*yield*/, admin
                            .from('deliverables')
                            .update({
                            status: 'approved',
                            approved_at: now,
                        })
                            .eq('id', deliverableId)];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 6];
                case 4: return [4 /*yield*/, admin
                        .from('deliverables')
                        .update({
                        status: 'approved',
                        approved_at: now,
                    })
                        .eq('deal_id', dealId)];
                case 5:
                    _a.sent();
                    _a.label = 6;
                case 6: return [4 /*yield*/, admin
                        .from('file_versions')
                        .update({
                        status: 'approved',
                        locked: false,
                    })
                        .eq('deal_id', dealId)];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, admin.from('deal_events').insert({
                            deal_id: dealId,
                            type: 'deliverable_approved',
                            actor_name: clientName || deal.client_name,
                            actor_role: 'client',
                            description: "".concat(clientName || deal.client_name, " approved deliverables."),
                        })];
                case 8:
                    _a.sent();
                    return [4 /*yield*/, admin.from('deal_messages').insert({
                            deal_id: dealId,
                            sender_id: 'client',
                            sender_name: clientName || deal.client_name,
                            sender_role: 'client',
                            type: 'approval',
                            content: "Approved deliverable files.",
                        })];
                case 9:
                    _a.sent();
                    return [4 /*yield*/, admin.from('notifications').insert({
                            user_id: deal.creator_id,
                            type: 'deliverable_approved',
                            title: 'Deliverable Approved',
                            description: "".concat(deal.client_name, " approved deliverables for \"").concat(deal.title, "\""),
                            deal_id: deal.id,
                            deal_title: deal.title,
                            read: false,
                        })];
                case 10:
                    _a.sent();
                    return [3 /*break*/, 17];
                case 11:
                    if (!deliverableId) return [3 /*break*/, 13];
                    return [4 /*yield*/, admin
                            .from('deliverables')
                            .update({
                            status: 'changes_requested',
                        })
                            .eq('id', deliverableId)];
                case 12:
                    _a.sent();
                    _a.label = 13;
                case 13: return [4 /*yield*/, admin.from('deal_events').insert({
                        deal_id: dealId,
                        type: 'change_requested',
                        actor_name: clientName || deal.client_name,
                        actor_role: 'client',
                        description: "".concat(clientName || deal.client_name, " requested changes: \"").concat(feedback || 'Revisions needed', "\""),
                    })];
                case 14:
                    _a.sent();
                    return [4 /*yield*/, admin.from('deal_messages').insert({
                            deal_id: dealId,
                            sender_id: 'client',
                            sender_name: clientName || deal.client_name,
                            sender_role: 'client',
                            type: 'change_request',
                            content: "Change request: ".concat(feedback || 'Please review changes.'),
                        })];
                case 15:
                    _a.sent();
                    return [4 /*yield*/, admin.from('notifications').insert({
                            user_id: deal.creator_id,
                            type: 'change_request',
                            title: 'Change Requested',
                            description: "".concat(deal.client_name, " requested changes on \"").concat(deal.title, "\": ").concat(feedback || ''),
                            deal_id: deal.id,
                            deal_title: deal.title,
                            read: false,
                        })];
                case 16:
                    _a.sent();
                    _a.label = 17;
                case 17: return [2 /*return*/, NextResponse.json({ success: true })];
                case 18:
                    error_1 = _a.sent();
                    console.error('Error in deliverable approval route:', error_1);
                    return [2 /*return*/, NextResponse.json({ error: (error_1 === null || error_1 === void 0 ? void 0 : error_1.message) || 'Internal server error' }, { status: 500 })];
                case 19: return [2 /*return*/];
            }
        });
    });
}
