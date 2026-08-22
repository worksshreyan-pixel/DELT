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
import { verifyClientSessionToken } from '@/lib/otp';
export function POST(request) {
    return __awaiter(this, void 0, void 0, function () {
        var body, dealId, isUpload, supabase_1, user_1, admin_1, _a, deal_1, dealError_1, fileName, cleanFileName, isPreview, version, storagePath, _b, uploadUrlData, uploadUrlError, token, filePath_1, isCreator, admin, query, _c, deal, dealError, expectedClientEmail, creatorId, supabase, user, clientSessionHeader, hasValidClientToken, isAuthorizedCreator, isAuthorizedClient, userEmail, fileVersions, targetFileItem, _i, fileVersions_1, version, filesList, found, isPaid, _d, signedUrlData, signError, error_1;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    _e.trys.push([0, 12, , 13]);
                    return [4 /*yield*/, request.json()];
                case 1:
                    body = _e.sent();
                    dealId = body.dealId, isUpload = body.isUpload;
                    if (!dealId) {
                        return [2 /*return*/, NextResponse.json({ error: 'Deal ID is required' }, { status: 400 })];
                    }
                    if (!isUpload) return [3 /*break*/, 6];
                    return [4 /*yield*/, createServerSupabaseClient()];
                case 2:
                    supabase_1 = _e.sent();
                    return [4 /*yield*/, supabase_1.auth.getUser()];
                case 3:
                    user_1 = (_e.sent()).data.user;
                    if (!user_1) {
                        return [2 /*return*/, NextResponse.json({ error: 'Unauthorized' }, { status: 401 })];
                    }
                    admin_1 = createAdminClient();
                    return [4 /*yield*/, admin_1
                            .from('deals')
                            .select('*')
                            .eq('id', dealId)
                            .eq('creator_id', user_1.id)
                            .maybeSingle()];
                case 4:
                    _a = _e.sent(), deal_1 = _a.data, dealError_1 = _a.error;
                    if (dealError_1 || !deal_1) {
                        return [2 /*return*/, NextResponse.json({ error: 'Deal not found or unauthorized' }, { status: 403 })];
                    }
                    fileName = body.fileName || 'file';
                    cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
                    isPreview = body.isPreview === true;
                    version = body.version || 1;
                    storagePath = isPreview
                        ? "previews/".concat(dealId, "/v").concat(version, "/").concat(Date.now(), "_").concat(cleanFileName)
                        : "".concat(dealId, "/v").concat(version, "/").concat(Date.now(), "_").concat(cleanFileName);
                    return [4 /*yield*/, admin_1.storage
                            .from('deal-files')
                            .createSignedUploadUrl(storagePath)];
                case 5:
                    _b = _e.sent(), uploadUrlData = _b.data, uploadUrlError = _b.error;
                    if (uploadUrlError || !(uploadUrlData === null || uploadUrlData === void 0 ? void 0 : uploadUrlData.signedUrl)) {
                        console.error('Error generating signed upload URL:', uploadUrlError);
                        return [2 /*return*/, NextResponse.json({ error: 'Failed to generate signed upload URL' }, { status: 500 })];
                    }
                    return [2 /*return*/, NextResponse.json({
                            signedUrl: uploadUrlData.signedUrl,
                            filePath: storagePath
                        })];
                case 6:
                    token = body.token, filePath_1 = body.filePath, isCreator = body.isCreator;
                    if (!filePath_1) {
                        return [2 /*return*/, NextResponse.json({ error: 'File path is required' }, { status: 400 })];
                    }
                    admin = createAdminClient();
                    query = admin.from('deals').select('*').eq('id', dealId);
                    if (token) {
                        query = query.eq('token', token);
                    }
                    return [4 /*yield*/, query.maybeSingle()];
                case 7:
                    _c = _e.sent(), deal = _c.data, dealError = _c.error;
                    if (dealError || !deal) {
                        return [2 /*return*/, NextResponse.json({ error: 'Deal not found' }, { status: 404 })];
                    }
                    expectedClientEmail = (deal.client_email || '').trim().toLowerCase();
                    creatorId = deal.creator_id;
                    return [4 /*yield*/, createServerSupabaseClient()];
                case 8:
                    supabase = _e.sent();
                    return [4 /*yield*/, supabase.auth.getUser()];
                case 9:
                    user = (_e.sent()).data.user;
                    clientSessionHeader = request.headers.get('x-client-session-token');
                    hasValidClientToken = (clientSessionHeader && deal.token)
                        ? verifyClientSessionToken(clientSessionHeader, deal.token, expectedClientEmail)
                        : false;
                    isAuthorizedCreator = false;
                    isAuthorizedClient = false;
                    if (user) {
                        userEmail = (user.email || '').trim().toLowerCase();
                        isAuthorizedClient = userEmail === expectedClientEmail;
                        isAuthorizedCreator = user.id === creatorId;
                    }
                    else if (hasValidClientToken) {
                        isAuthorizedClient = true;
                    }
                    // Guard access
                    if (isCreator && !isAuthorizedCreator) {
                        return [2 /*return*/, NextResponse.json({ error: 'Unauthorized creator access' }, { status: 403 })];
                    }
                    if (!isCreator && !isAuthorizedClient && !isAuthorizedCreator) {
                        return [2 /*return*/, NextResponse.json({ error: 'Unauthorized access' }, { status: 403 })];
                    }
                    return [4 /*yield*/, admin
                            .from('file_versions')
                            .select('*')
                            .eq('deal_id', dealId)];
                case 10:
                    fileVersions = (_e.sent()).data;
                    targetFileItem = null;
                    if (fileVersions) {
                        for (_i = 0, fileVersions_1 = fileVersions; _i < fileVersions_1.length; _i++) {
                            version = fileVersions_1[_i];
                            filesList = Array.isArray(version.files) ? version.files : [];
                            found = filesList.find(function (f) { return f.path === filePath_1; });
                            if (found) {
                                targetFileItem = found;
                                break;
                            }
                        }
                    }
                    if (targetFileItem) {
                        if (targetFileItem.deletionStatus === 'deleted') {
                            return [2 /*return*/, NextResponse.json({ error: 'File has been deleted according to the retention policy.' }, { status: 410 })];
                        }
                    }
                    isPaid = deal.payment_status === 'paid' || deal.status === 'completed';
                    if (!isCreator && !isAuthorizedCreator && !isPaid) {
                        return [2 /*return*/, NextResponse.json({ error: 'Files are locked. Complete payment to download deliverables.' }, { status: 403 })];
                    }
                    return [4 /*yield*/, admin.storage
                            .from('deal-files')
                            .createSignedUrl(filePath_1, 60)];
                case 11:
                    _d = _e.sent(), signedUrlData = _d.data, signError = _d.error;
                    if (signError || !(signedUrlData === null || signedUrlData === void 0 ? void 0 : signedUrlData.signedUrl)) {
                        return [2 /*return*/, NextResponse.json({ error: 'Failed to generate signed download link' }, { status: 500 })];
                    }
                    return [2 /*return*/, NextResponse.json({ signedUrl: signedUrlData.signedUrl })];
                case 12:
                    error_1 = _e.sent();
                    console.error('Error generating signed URL:', error_1);
                    return [2 /*return*/, NextResponse.json({ error: (error_1 === null || error_1 === void 0 ? void 0 : error_1.message) || 'Internal server error' }, { status: 500 })];
                case 13: return [2 /*return*/];
            }
        });
    });
}
