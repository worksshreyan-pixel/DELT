var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
export function POST(request, _a) {
    var _b;
    var params = _a.params;
    return __awaiter(this, void 0, void 0, function () {
        var idOrToken, supabase, user, admin, query, _c, deal, dealError, dealId, now, updateError, fileVersions, env, retentionDays, retentionUntil_1, _i, fileVersions_1, version, filesList, updatedFiles, error_1;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _d.trys.push([0, 14, , 15]);
                    return [4 /*yield*/, params];
                case 1:
                    idOrToken = (_d.sent()).token;
                    if (!idOrToken) {
                        return [2 /*return*/, NextResponse.json({ error: 'Deal ID or token is required.' }, { status: 400 })];
                    }
                    return [4 /*yield*/, createServerSupabaseClient()];
                case 2:
                    supabase = _d.sent();
                    return [4 /*yield*/, supabase.auth.getUser()];
                case 3:
                    user = (_d.sent()).data.user;
                    if (!user) {
                        return [2 /*return*/, NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 })];
                    }
                    admin = createAdminClient();
                    query = admin.from('deals').select('*');
                    if (idOrToken.startsWith('dlt_') || idOrToken.startsWith('dl_')) {
                        query = query.eq('token', idOrToken);
                    }
                    else {
                        query = query.eq('id', idOrToken);
                    }
                    return [4 /*yield*/, query.maybeSingle()];
                case 4:
                    _c = _d.sent(), deal = _c.data, dealError = _c.error;
                    if (dealError || !deal) {
                        return [2 /*return*/, NextResponse.json({ error: 'Deal not found.' }, { status: 404 })];
                    }
                    // 2. Authorize creator
                    if (deal.creator_id !== user.id) {
                        return [2 /*return*/, NextResponse.json({ error: 'Only the creator of this Deal can close and delete it.' }, { status: 403 })];
                    }
                    dealId = deal.id;
                    now = new Date().toISOString();
                    return [4 /*yield*/, admin
                            .from('deals')
                            .update({
                            status: 'closed',
                            updated_at: now,
                            last_activity_at: now,
                        })
                            .eq('id', dealId)];
                case 5:
                    updateError = (_d.sent()).error;
                    if (updateError) {
                        return [2 /*return*/, NextResponse.json({ error: updateError.message }, { status: 500 })];
                    }
                    return [4 /*yield*/, admin
                            .from('file_versions')
                            .select('*')
                            .eq('deal_id', dealId)];
                case 6:
                    fileVersions = (_d.sent()).data;
                    return [4 /*yield*/, import('@/lib/env')];
                case 7:
                    env = (_d.sent()).env;
                    retentionDays = env.app.fileRetentionDays;
                    retentionUntil_1 = new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000).toISOString();
                    if (!(fileVersions && fileVersions.length > 0)) return [3 /*break*/, 11];
                    _i = 0, fileVersions_1 = fileVersions;
                    _d.label = 8;
                case 8:
                    if (!(_i < fileVersions_1.length)) return [3 /*break*/, 11];
                    version = fileVersions_1[_i];
                    filesList = Array.isArray(version.files) ? version.files : [];
                    updatedFiles = filesList.map(function (f) { return (__assign(__assign({}, f), { deletionStatus: 'retention', retentionUntil: retentionUntil_1 })); });
                    return [4 /*yield*/, admin
                            .from('file_versions')
                            .update({
                            files: updatedFiles,
                        })
                            .eq('id', version.id)];
                case 9:
                    _d.sent();
                    _d.label = 10;
                case 10:
                    _i++;
                    return [3 /*break*/, 8];
                case 11: 
                // 5. Create timeline event & system message
                return [4 /*yield*/, admin.from('deal_events').insert({
                        deal_id: dealId,
                        type: 'deal_closed',
                        actor_id: user.id,
                        actor_name: ((_b = user.user_metadata) === null || _b === void 0 ? void 0 : _b.displayName) || 'Creator',
                        actor_role: 'creator',
                        description: "Deal \"".concat(deal.title, "\" closed by creator. Files entered a ").concat(retentionDays, "-day retention period."),
                    })];
                case 12:
                    // 5. Create timeline event & system message
                    _d.sent();
                    return [4 /*yield*/, admin.from('deal_messages').insert({
                            deal_id: dealId,
                            sender_id: 'system',
                            sender_name: 'DELT System',
                            sender_role: 'creator',
                            type: 'system',
                            content: "Deal has been closed by the creator. Files entered a ".concat(retentionDays, "-day retention period."),
                        })];
                case 13:
                    _d.sent();
                    return [2 /*return*/, NextResponse.json({
                            success: true,
                            message: 'Deal closed and files placed in retention.',
                            dealId: dealId,
                            status: 'closed',
                        })];
                case 14:
                    error_1 = _d.sent();
                    console.error('Error closing deal:', error_1);
                    return [2 /*return*/, NextResponse.json({ error: (error_1 === null || error_1 === void 0 ? void 0 : error_1.message) || 'Internal server error closing deal.' }, { status: 500 })];
                case 15: return [2 /*return*/];
            }
        });
    });
}
