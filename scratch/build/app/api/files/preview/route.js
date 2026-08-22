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
import { parseDescription } from '@/lib/utils';
export function POST(request) {
    return __awaiter(this, void 0, void 0, function () {
        var body, dealId, token, fileVersionId, fileId_1, admin, _a, deal, dealError, expectedClientEmail, creatorId, supabase, user, clientSessionHeader, verifyToken, hasValidClientToken, isCreator, isClient, userEmail, parsed, _b, version, versionError, _c, deliverable, delError, files, fileItem, _d, signedUrlData, signError, error_1;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    _e.trys.push([0, 9, , 10]);
                    return [4 /*yield*/, request.json()];
                case 1:
                    body = _e.sent();
                    dealId = body.dealId, token = body.token, fileVersionId = body.fileVersionId, fileId_1 = body.fileId;
                    if (!dealId || !token || !fileVersionId || !fileId_1) {
                        return [2 /*return*/, NextResponse.json({ error: 'Deal ID, token, fileVersionId, and fileId are required' }, { status: 400 })];
                    }
                    admin = createAdminClient();
                    return [4 /*yield*/, admin
                            .from('deals')
                            .select('*')
                            .eq('id', dealId)
                            .eq('token', token)
                            .maybeSingle()];
                case 2:
                    _a = _e.sent(), deal = _a.data, dealError = _a.error;
                    if (dealError || !deal) {
                        return [2 /*return*/, NextResponse.json({ error: 'Deal not found or invalid token' }, { status: 404 })];
                    }
                    expectedClientEmail = (deal.client_email || '').trim().toLowerCase();
                    creatorId = deal.creator_id;
                    return [4 /*yield*/, createServerSupabaseClient()];
                case 3:
                    supabase = _e.sent();
                    return [4 /*yield*/, supabase.auth.getUser()];
                case 4:
                    user = (_e.sent()).data.user;
                    clientSessionHeader = request.headers.get('x-client-session-token');
                    return [4 /*yield*/, import('@/lib/otp')];
                case 5:
                    verifyToken = (_e.sent()).verifyClientSessionToken;
                    hasValidClientToken = clientSessionHeader
                        ? verifyToken(clientSessionHeader, token, expectedClientEmail)
                        : false;
                    isCreator = false;
                    isClient = false;
                    if (user) {
                        userEmail = (user.email || '').trim().toLowerCase();
                        isClient = userEmail === expectedClientEmail;
                        isCreator = user.id === creatorId;
                    }
                    else if (hasValidClientToken) {
                        isClient = true;
                    }
                    if (!isCreator && !isClient) {
                        return [2 /*return*/, NextResponse.json({ error: 'Unauthorized access to file preview' }, { status: 403 })];
                    }
                    parsed = parseDescription(deal.description);
                    if (!isCreator && !parsed.previewEnabled) {
                        return [2 /*return*/, NextResponse.json({ error: 'Previews are disabled for this deal' }, { status: 403 })];
                    }
                    return [4 /*yield*/, admin
                            .from('file_versions')
                            .select('*')
                            .eq('id', fileVersionId)
                            .eq('deal_id', dealId)
                            .maybeSingle()];
                case 6:
                    _b = _e.sent(), version = _b.data, versionError = _b.error;
                    if (versionError || !version) {
                        console.log("[PREVIEW_REQUEST]\ndeliverableId=");
                        return [2 /*return*/, NextResponse.json({ error: 'File version not found' }, { status: 404 })];
                    }
                    return [4 /*yield*/, admin
                            .from('deliverables')
                            .select('*')
                            .eq('id', version.deliverable_id)
                            .eq('deal_id', dealId)
                            .maybeSingle()];
                case 7:
                    _c = _e.sent(), deliverable = _c.data, delError = _c.error;
                    if (delError || !deliverable) {
                        return [2 /*return*/, NextResponse.json({ error: 'Deliverable does not belong to this deal' }, { status: 403 })];
                    }
                    console.log("[PREVIEW_REQUEST]\ndeliverableId=".concat(version.deliverable_id || ''));
                    files = Array.isArray(version.files) ? version.files : [];
                    fileItem = files.find(function (f) { return f.id === fileId_1; });
                    if (!fileItem) {
                        return [2 /*return*/, NextResponse.json({ error: 'File not found in this version' }, { status: 404 })];
                    }
                    console.log("[PREVIEW_RESOLUTION]\ndealId=".concat(dealId, "\npreviewPath=").concat(fileItem.previewPath || '', "\npreviewType=").concat(fileItem.previewType || '', "\npreviewStatus=").concat(fileItem.previewStatus || ''));
                    if (fileItem.previewStatus !== 'ready') {
                        return [2 /*return*/, NextResponse.json({ error: 'Preview is not ready for viewing' }, { status: 400 })];
                    }
                    if (!fileItem.previewPath || !fileItem.previewPath.startsWith("previews/".concat(dealId, "/"))) {
                        return [2 /*return*/, NextResponse.json({ error: 'Preview file does not belong to this deal or path is invalid' }, { status: 403 })];
                    }
                    return [4 /*yield*/, admin.storage
                            .from('deal-files')
                            .createSignedUrl(fileItem.previewPath, 60)];
                case 8:
                    _d = _e.sent(), signedUrlData = _d.data, signError = _d.error;
                    console.log("[PREVIEW_SIGNED_URL]\nsuccess=".concat(!!(signedUrlData === null || signedUrlData === void 0 ? void 0 : signedUrlData.signedUrl), "\nerror=").concat(signError ? (signError.message || JSON.stringify(signError)) : ''));
                    if (signError || !(signedUrlData === null || signedUrlData === void 0 ? void 0 : signedUrlData.signedUrl)) {
                        console.error('Error signing preview path:', signError);
                        return [2 /*return*/, NextResponse.json({ error: 'Failed to generate preview link' }, { status: 500 })];
                    }
                    return [2 /*return*/, NextResponse.json({ signedUrl: signedUrlData.signedUrl })];
                case 9:
                    error_1 = _e.sent();
                    console.error('Error in secure preview API:', error_1);
                    return [2 /*return*/, NextResponse.json({ error: (error_1 === null || error_1 === void 0 ? void 0 : error_1.message) || 'Internal server error' }, { status: 500 })];
                case 10: return [2 /*return*/];
            }
        });
    });
}
