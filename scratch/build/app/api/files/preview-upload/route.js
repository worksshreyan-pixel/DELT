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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
export function POST(request) {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var supabase, user, formData, dealId, fileVersionId, fileId_1, previewFile, admin, _b, deal, dealError, _c, versionRecord, versionError, files, fileIndex, targetFileItem, ext, isVideo, updatedFiles_1, updateError_1, generateVideoPreview, previewBuffer, _d, _e, cleanPreviewName, versionNum, previewPath, uploadError, updatedFiles, _f, updatedRecord, updateError, error_1;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    _g.trys.push([0, 12, , 13]);
                    return [4 /*yield*/, createServerSupabaseClient()];
                case 1:
                    supabase = _g.sent();
                    return [4 /*yield*/, supabase.auth.getUser()];
                case 2:
                    user = (_g.sent()).data.user;
                    if (!user) {
                        return [2 /*return*/, NextResponse.json({ error: 'Unauthorized' }, { status: 401 })];
                    }
                    return [4 /*yield*/, request.formData()];
                case 3:
                    formData = _g.sent();
                    dealId = formData.get('dealId');
                    fileVersionId = formData.get('fileVersionId');
                    fileId_1 = formData.get('fileId');
                    previewFile = formData.get('previewFile');
                    if (!dealId || !fileVersionId || !fileId_1) {
                        return [2 /*return*/, NextResponse.json({ error: 'dealId, fileVersionId, and fileId are required' }, { status: 400 })];
                    }
                    admin = createAdminClient();
                    return [4 /*yield*/, admin
                            .from('deals')
                            .select('*')
                            .eq('id', dealId)
                            .eq('creator_id', user.id)
                            .maybeSingle()];
                case 4:
                    _b = _g.sent(), deal = _b.data, dealError = _b.error;
                    if (dealError || !deal) {
                        return [2 /*return*/, NextResponse.json({ error: 'Deal not found or unauthorized' }, { status: 404 })];
                    }
                    return [4 /*yield*/, admin
                            .from('file_versions')
                            .select('*')
                            .eq('id', fileVersionId)
                            .eq('deal_id', dealId)
                            .maybeSingle()];
                case 5:
                    _c = _g.sent(), versionRecord = _c.data, versionError = _c.error;
                    if (versionError || !versionRecord) {
                        return [2 /*return*/, NextResponse.json({ error: 'File version not found' }, { status: 404 })];
                    }
                    files = Array.isArray(versionRecord.files) ? versionRecord.files : [];
                    fileIndex = files.findIndex(function (f) { return f.id === fileId_1; });
                    if (fileIndex === -1) {
                        return [2 /*return*/, NextResponse.json({ error: 'File not found in this version' }, { status: 404 })];
                    }
                    targetFileItem = files[fileIndex];
                    ext = ((_a = targetFileItem.name.split('.').pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || '';
                    isVideo = (targetFileItem.type || '').startsWith('video/') || ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext);
                    if (!isVideo) return [3 /*break*/, 8];
                    updatedFiles_1 = __spreadArray([], files, true);
                    updatedFiles_1[fileIndex] = __assign(__assign({}, updatedFiles_1[fileIndex]), { previewStatus: 'processing' });
                    return [4 /*yield*/, admin
                            .from('file_versions')
                            .update({ files: updatedFiles_1 })
                            .eq('id', fileVersionId)];
                case 6:
                    updateError_1 = (_g.sent()).error;
                    if (updateError_1) {
                        console.error('Error marking video preview as processing:', updateError_1);
                        return [2 /*return*/, NextResponse.json({ error: 'Failed to initialize video processing' }, { status: 500 })];
                    }
                    return [4 /*yield*/, import('@/lib/video-preview')];
                case 7:
                    generateVideoPreview = (_g.sent()).generateVideoPreview;
                    generateVideoPreview(dealId, fileVersionId, fileId_1).catch(function (err) {
                        console.error('[VIDEO_PREVIEW] Retrospective generation task error:', err);
                    });
                    return [2 /*return*/, NextResponse.json({ success: true, processing: true })];
                case 8:
                    if (!previewFile) {
                        return [2 /*return*/, NextResponse.json({ error: 'previewFile is required' }, { status: 400 })];
                    }
                    _e = (_d = Buffer).from;
                    return [4 /*yield*/, previewFile.arrayBuffer()];
                case 9:
                    previewBuffer = _e.apply(_d, [_g.sent()]);
                    cleanPreviewName = previewFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
                    versionNum = versionRecord.version || 1;
                    previewPath = "previews/".concat(dealId, "/v").concat(versionNum, "/").concat(Date.now(), "_").concat(cleanPreviewName);
                    return [4 /*yield*/, admin.storage
                            .from('deal-files')
                            .upload(previewPath, previewBuffer, {
                            contentType: previewFile.type || 'application/octet-stream',
                            upsert: true,
                        })];
                case 10:
                    uploadError = (_g.sent()).error;
                    if (uploadError) {
                        console.error('Preview upload error:', uploadError);
                        return [2 /*return*/, NextResponse.json({ error: 'Failed to upload preview to storage' }, { status: 500 })];
                    }
                    updatedFiles = __spreadArray([], files, true);
                    updatedFiles[fileIndex] = __assign(__assign({}, updatedFiles[fileIndex]), { previewPath: previewPath, previewType: previewFile.type, previewStatus: 'ready', previewGeneratedAt: new Date().toISOString() });
                    return [4 /*yield*/, admin
                            .from('file_versions')
                            .update({ files: updatedFiles })
                            .eq('id', fileVersionId)
                            .select()
                            .single()];
                case 11:
                    _f = _g.sent(), updatedRecord = _f.data, updateError = _f.error;
                    if (updateError) {
                        console.error('Error updating file version metadata:', updateError);
                        return [2 /*return*/, NextResponse.json({ error: 'Failed to update file version metadata' }, { status: 500 })];
                    }
                    return [2 /*return*/, NextResponse.json({ success: true, version: updatedRecord })];
                case 12:
                    error_1 = _g.sent();
                    console.error('Error in preview upload API:', error_1);
                    return [2 /*return*/, NextResponse.json({ error: (error_1 === null || error_1 === void 0 ? void 0 : error_1.message) || 'Internal server error' }, { status: 500 })];
                case 13: return [2 /*return*/];
            }
        });
    });
}
