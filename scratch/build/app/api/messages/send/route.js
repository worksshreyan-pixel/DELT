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
        var body, dealId, senderId, senderName, senderRole, _a, type, content, _b, attachments, admin, now, _c, message, msgError, error_1;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _d.trys.push([0, 4, , 5]);
                    return [4 /*yield*/, request.json()];
                case 1:
                    body = _d.sent();
                    dealId = body.dealId, senderId = body.senderId, senderName = body.senderName, senderRole = body.senderRole, _a = body.type, type = _a === void 0 ? 'text' : _a, content = body.content, _b = body.attachments, attachments = _b === void 0 ? [] : _b;
                    if (!dealId || !(content === null || content === void 0 ? void 0 : content.trim())) {
                        return [2 /*return*/, NextResponse.json({ error: 'Deal ID and content are required' }, { status: 400 })];
                    }
                    admin = createAdminClient();
                    now = new Date().toISOString();
                    return [4 /*yield*/, admin
                            .from('deal_messages')
                            .insert({
                            deal_id: dealId,
                            sender_id: senderId || 'user',
                            sender_name: senderName || 'User',
                            sender_role: senderRole || 'creator',
                            type: type,
                            content: content.trim(),
                            attachments: attachments,
                        })
                            .select()
                            .single()];
                case 2:
                    _c = _d.sent(), message = _c.data, msgError = _c.error;
                    if (msgError || !message) {
                        return [2 /*return*/, NextResponse.json({ error: (msgError === null || msgError === void 0 ? void 0 : msgError.message) || 'Failed to send message' }, { status: 500 })];
                    }
                    // Update deal activity
                    return [4 /*yield*/, admin
                            .from('deals')
                            .update({
                            last_activity_at: now,
                            updated_at: now,
                        })
                            .eq('id', dealId)];
                case 3:
                    // Update deal activity
                    _d.sent();
                    return [2 /*return*/, NextResponse.json({ success: true, message: message })];
                case 4:
                    error_1 = _d.sent();
                    console.error('Error sending message:', error_1);
                    return [2 /*return*/, NextResponse.json({ error: (error_1 === null || error_1 === void 0 ? void 0 : error_1.message) || 'Internal server error' }, { status: 500 })];
                case 5: return [2 /*return*/];
            }
        });
    });
}
