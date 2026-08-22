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
import { parseDescription } from '@/lib/utils';
export function POST(request) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    return __awaiter(this, void 0, void 0, function () {
        var supabase, user, contentType, admin, body, dealId_1, deliverableId_1, description_1, files, file_1, filesToRegister, _k, deal_1, dealError_1, storageRecord_1, totalUploadedBytes, currentBytes, limitBytes, count_1, versionNum_1, targetDeliverableId, firstDeliv, uploadedFileItems, _l, versionRecord_1, versionError_1, _i, uploadedFileItems_1, fileItem_1, generateVideoPreview, sendDeliverablesUploadedEmail, canonicalDealUrl, emailErr_1, formData, dealId, deliverableId, description, file, previewFile, _m, deal, dealError, previewEnabled, storageRecord, currentBytes, limitBytes, count, versionNum, fileBuffer, _o, _p, cleanFileName, storagePath, uploadError, previewPath, previewStatus, previewUploadErrMessage, ext, isVideo, previewBuffer, _q, _r, previewCleanName, previewUploadError, fileItem, _s, versionRecord, versionError, generateVideoPreview, sendDeliverablesUploadedEmail, canonicalDealUrl, emailErr_2, error_1;
        return __generator(this, function (_t) {
            switch (_t.label) {
                case 0:
                    _t.trys.push([0, 48, , 49]);
                    return [4 /*yield*/, createServerSupabaseClient()];
                case 1:
                    supabase = _t.sent();
                    return [4 /*yield*/, supabase.auth.getUser()];
                case 2:
                    user = (_t.sent()).data.user;
                    if (!user) {
                        return [2 /*return*/, NextResponse.json({ error: 'Unauthorized' }, { status: 401 })];
                    }
                    contentType = request.headers.get('content-type') || '';
                    admin = createAdminClient();
                    if (!contentType.includes('application/json')) return [3 /*break*/, 24];
                    return [4 /*yield*/, request.json()];
                case 3:
                    body = _t.sent();
                    dealId_1 = body.dealId, deliverableId_1 = body.deliverableId, description_1 = body.description, files = body.files, file_1 = body.file;
                    if (!dealId_1) {
                        return [2 /*return*/, NextResponse.json({ error: 'Deal ID is required' }, { status: 400 })];
                    }
                    filesToRegister = [];
                    if (Array.isArray(files)) {
                        filesToRegister = files;
                    }
                    else if (file_1) {
                        filesToRegister = [file_1];
                    }
                    if (filesToRegister.length === 0) {
                        return [2 /*return*/, NextResponse.json({ error: 'No files to register' }, { status: 400 })];
                    }
                    return [4 /*yield*/, admin
                            .from('deals')
                            .select('*')
                            .eq('id', dealId_1)
                            .maybeSingle()];
                case 4:
                    _k = _t.sent(), deal_1 = _k.data, dealError_1 = _k.error;
                    if (dealError_1 || !deal_1) {
                        return [2 /*return*/, NextResponse.json({ error: 'Deal not found' }, { status: 404 })];
                    }
                    return [4 /*yield*/, admin
                            .from('storage_usage')
                            .select('*')
                            .eq('user_id', user.id)
                            .maybeSingle()];
                case 5:
                    storageRecord_1 = (_t.sent()).data;
                    totalUploadedBytes = filesToRegister.reduce(function (acc, f) { return acc + Number(f.size || 0); }, 0);
                    if (storageRecord_1) {
                        currentBytes = Number(storageRecord_1.total_bytes || 0);
                        limitBytes = Number(storageRecord_1.limit_bytes || 1073741824);
                        if (currentBytes + totalUploadedBytes > limitBytes) {
                            return [2 /*return*/, NextResponse.json({ error: 'Storage quota exceeded. Please upgrade your plan or add storage to upload more files.' }, { status: 413 })];
                        }
                    }
                    return [4 /*yield*/, admin
                            .from('file_versions')
                            .select('*', { count: 'exact', head: true })
                            .eq('deal_id', dealId_1)];
                case 6:
                    count_1 = (_t.sent()).count;
                    versionNum_1 = (count_1 || 0) + 1;
                    targetDeliverableId = deliverableId_1;
                    if (!!targetDeliverableId) return [3 /*break*/, 8];
                    return [4 /*yield*/, admin
                            .from('deliverables')
                            .select('id')
                            .eq('deal_id', dealId_1)
                            .limit(1)
                            .maybeSingle()];
                case 7:
                    firstDeliv = (_t.sent()).data;
                    targetDeliverableId = firstDeliv === null || firstDeliv === void 0 ? void 0 : firstDeliv.id;
                    _t.label = 8;
                case 8:
                    if (!targetDeliverableId) {
                        return [2 /*return*/, NextResponse.json({ error: 'No deliverables found for this deal' }, { status: 400 })];
                    }
                    uploadedFileItems = filesToRegister.map(function (f) { return ({
                        id: f.id || "f_".concat(Date.now(), "_").concat(Math.random().toString(36).substring(2, 7)),
                        name: f.name,
                        size: Number(f.size || 0),
                        type: f.type,
                        path: f.path,
                        previewPath: f.previewPath || undefined,
                        previewType: f.previewType || undefined,
                        previewStatus: f.previewStatus || undefined,
                        previewGeneratedAt: f.previewGeneratedAt || (f.previewPath ? new Date().toISOString() : undefined),
                    }); });
                    return [4 /*yield*/, admin
                            .from('file_versions')
                            .insert({
                            deliverable_id: targetDeliverableId,
                            deal_id: dealId_1,
                            version: versionNum_1,
                            description: (description_1 === null || description_1 === void 0 ? void 0 : description_1.trim()) || 'Initial project deliverable files',
                            uploader_id: user.id,
                            uploader_name: ((_a = user.user_metadata) === null || _a === void 0 ? void 0 : _a.displayName) || 'Creator',
                            files: uploadedFileItems,
                            status: 'pending_review',
                            locked: true,
                        })
                            .select()
                            .single()];
                case 9:
                    _l = _t.sent(), versionRecord_1 = _l.data, versionError_1 = _l.error;
                    if (versionError_1) {
                        return [2 /*return*/, NextResponse.json({ error: versionError_1.message }, { status: 500 })];
                    }
                    _i = 0, uploadedFileItems_1 = uploadedFileItems;
                    _t.label = 10;
                case 10:
                    if (!(_i < uploadedFileItems_1.length)) return [3 /*break*/, 13];
                    fileItem_1 = uploadedFileItems_1[_i];
                    if (!(fileItem_1.previewStatus === 'processing' && versionRecord_1)) return [3 /*break*/, 12];
                    return [4 /*yield*/, import('@/lib/video-preview')];
                case 11:
                    generateVideoPreview = (_t.sent()).generateVideoPreview;
                    generateVideoPreview(dealId_1, versionRecord_1.id, fileItem_1.id).catch(function (err) {
                        console.error('[VIDEO_PREVIEW] Background generation task error:', err);
                    });
                    _t.label = 12;
                case 12:
                    _i++;
                    return [3 /*break*/, 10];
                case 13:
                    if (!storageRecord_1) return [3 /*break*/, 15];
                    return [4 /*yield*/, admin
                            .from('storage_usage')
                            .update({
                            total_bytes: Number(storageRecord_1.total_bytes || 0) + totalUploadedBytes,
                            files_bytes: Number(storageRecord_1.files_bytes || 0) + totalUploadedBytes,
                            updated_at: new Date().toISOString(),
                        })
                            .eq('user_id', user.id)];
                case 14:
                    _t.sent();
                    _t.label = 15;
                case 15: 
                // Create timeline event & system message
                return [4 /*yield*/, admin.from('deal_events').insert({
                        deal_id: dealId_1,
                        type: 'file_uploaded',
                        actor_id: user.id,
                        actor_name: ((_b = user.user_metadata) === null || _b === void 0 ? void 0 : _b.displayName) || 'Creator',
                        actor_role: 'creator',
                        description: "Uploaded new version (v".concat(versionNum_1, ") of ").concat(uploadedFileItems.map(function (f) { return f.name; }).join(', '), "."),
                    })];
                case 16:
                    // Create timeline event & system message
                    _t.sent();
                    return [4 /*yield*/, admin.from('deal_messages').insert({
                            deal_id: dealId_1,
                            sender_id: user.id,
                            sender_name: ((_c = user.user_metadata) === null || _c === void 0 ? void 0 : _c.displayName) || 'Creator',
                            sender_role: 'creator',
                            type: 'file',
                            content: "Uploaded deliverable files (Version ".concat(versionNum_1, ")"),
                        })];
                case 17:
                    _t.sent();
                    _t.label = 18;
                case 18:
                    _t.trys.push([18, 22, , 23]);
                    if (!(deal_1 === null || deal_1 === void 0 ? void 0 : deal_1.client_email)) return [3 /*break*/, 21];
                    return [4 /*yield*/, import('@/lib/email')];
                case 19:
                    sendDeliverablesUploadedEmail = (_t.sent()).sendDeliverablesUploadedEmail;
                    canonicalDealUrl = "".concat(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', "/deal/").concat(deal_1.token);
                    return [4 /*yield*/, sendDeliverablesUploadedEmail({
                            clientName: deal_1.client_name || 'Client',
                            clientEmail: deal_1.client_email,
                            creatorName: ((_d = user.user_metadata) === null || _d === void 0 ? void 0 : _d.displayName) || 'Creator',
                            dealTitle: deal_1.title,
                            versionNumber: versionNum_1,
                            fileNames: uploadedFileItems.map(function (f) { return f.name; }),
                            dealUrl: canonicalDealUrl,
                        })];
                case 20:
                    _t.sent();
                    _t.label = 21;
                case 21: return [3 /*break*/, 23];
                case 22:
                    emailErr_1 = _t.sent();
                    console.error('Error dispatching deliverable upload email:', emailErr_1);
                    return [3 /*break*/, 23];
                case 23: return [2 /*return*/, NextResponse.json({ success: true, version: versionRecord_1 })];
                case 24: return [4 /*yield*/, request.formData()];
                case 25:
                    formData = _t.sent();
                    dealId = formData.get('dealId');
                    deliverableId = formData.get('deliverableId');
                    description = formData.get('description');
                    file = formData.get('file');
                    previewFile = formData.get('previewFile');
                    if (!dealId || !file) {
                        return [2 /*return*/, NextResponse.json({ error: 'Deal ID and file are required' }, { status: 400 })];
                    }
                    return [4 /*yield*/, admin
                            .from('deals')
                            .select('*')
                            .eq('id', dealId)
                            .maybeSingle()];
                case 26:
                    _m = _t.sent(), deal = _m.data, dealError = _m.error;
                    if (dealError || !deal) {
                        return [2 /*return*/, NextResponse.json({ error: 'Deal not found' }, { status: 404 })];
                    }
                    previewEnabled = parseDescription(deal.description).previewEnabled;
                    return [4 /*yield*/, admin
                            .from('storage_usage')
                            .select('*')
                            .eq('user_id', user.id)
                            .maybeSingle()];
                case 27:
                    storageRecord = (_t.sent()).data;
                    if (storageRecord) {
                        currentBytes = Number(storageRecord.total_bytes || 0);
                        limitBytes = Number(storageRecord.limit_bytes || 1073741824);
                        if (currentBytes + file.size > limitBytes) {
                            return [2 /*return*/, NextResponse.json({ error: 'Storage quota exceeded. Please upgrade your plan or add storage to upload more files.' }, { status: 413 })];
                        }
                    }
                    return [4 /*yield*/, admin
                            .from('file_versions')
                            .select('*', { count: 'exact', head: true })
                            .eq('deal_id', dealId)];
                case 28:
                    count = (_t.sent()).count;
                    versionNum = (count || 0) + 1;
                    _p = (_o = Buffer).from;
                    return [4 /*yield*/, file.arrayBuffer()];
                case 29:
                    fileBuffer = _p.apply(_o, [_t.sent()]);
                    cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
                    storagePath = "".concat(dealId, "/v").concat(versionNum, "/").concat(Date.now(), "_").concat(cleanFileName);
                    return [4 /*yield*/, admin.storage
                            .from('deal-files')
                            .upload(storagePath, fileBuffer, {
                            contentType: file.type || 'application/octet-stream',
                            upsert: true,
                        })];
                case 30:
                    uploadError = (_t.sent()).error;
                    if (uploadError) {
                        console.error('Storage upload error:', uploadError);
                        return [2 /*return*/, NextResponse.json({ error: 'Failed to upload file to storage' }, { status: 500 })];
                    }
                    // Debug logging for upload process
                    console.log("[PREVIEW_UPLOAD]\noriginalName=".concat(file.name, "\noriginalMimeType=").concat(file.type, "\npreviewFilePresent=").concat(!!previewFile, "\npreviewFileName=").concat(previewFile ? previewFile.name : '', "\npreviewMimeType=").concat(previewFile ? previewFile.type : '', "\npreviewSize=").concat(previewFile ? previewFile.size : 0));
                    previewPath = '';
                    previewStatus = 'failed';
                    previewUploadErrMessage = '';
                    ext = ((_e = file.name.split('.').pop()) === null || _e === void 0 ? void 0 : _e.toLowerCase()) || '';
                    isVideo = (file.type || '').startsWith('video/') || ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext);
                    if (!previewFile) return [3 /*break*/, 33];
                    _r = (_q = Buffer).from;
                    return [4 /*yield*/, previewFile.arrayBuffer()];
                case 31:
                    previewBuffer = _r.apply(_q, [_t.sent()]);
                    previewCleanName = previewFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
                    previewPath = "previews/".concat(dealId, "/v").concat(versionNum, "/").concat(Date.now(), "_").concat(previewCleanName);
                    return [4 /*yield*/, admin.storage
                            .from('deal-files')
                            .upload(previewPath, previewBuffer, {
                            contentType: previewFile.type || 'application/octet-stream',
                            upsert: true,
                        })];
                case 32:
                    previewUploadError = (_t.sent()).error;
                    if (!previewUploadError) {
                        previewStatus = 'ready';
                    }
                    else {
                        previewUploadErrMessage = previewUploadError.message || JSON.stringify(previewUploadError);
                        console.error('Preview upload error:', previewUploadError);
                    }
                    return [3 /*break*/, 34];
                case 33:
                    if (previewEnabled && isVideo) {
                        previewStatus = 'processing';
                    }
                    _t.label = 34;
                case 34:
                    console.log("[PREVIEW_STORAGE]\npreviewPath=".concat(previewPath, "\nuploadSuccess=").concat(previewStatus === 'ready', "\nuploadError=").concat(previewUploadErrMessage));
                    console.log("[PREVIEW_METADATA]\ndeliverableId=".concat(deliverableId, "\npreviewPath=").concat(previewPath, "\npreviewType=").concat(previewFile ? previewFile.type : (isVideo ? 'video/mp4' : ''), "\npreviewStatus=").concat(previewFile || (previewEnabled && isVideo) ? previewStatus : ''));
                    fileItem = {
                        id: "f_".concat(Date.now()),
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        path: storagePath,
                        previewPath: (previewEnabled && isVideo) ? undefined : (previewPath || undefined),
                        previewType: (previewEnabled && isVideo) ? 'video/mp4' : (previewFile ? previewFile.type : undefined),
                        previewStatus: (previewEnabled && isVideo) ? 'processing' : (previewFile ? previewStatus : undefined),
                        previewGeneratedAt: previewFile ? new Date().toISOString() : undefined,
                    };
                    return [4 /*yield*/, admin
                            .from('file_versions')
                            .insert({
                            deliverable_id: deliverableId,
                            deal_id: dealId,
                            version: versionNum,
                            description: (description === null || description === void 0 ? void 0 : description.trim()) || null,
                            uploader_id: user.id,
                            uploader_name: ((_f = user.user_metadata) === null || _f === void 0 ? void 0 : _f.displayName) || 'Creator',
                            files: [fileItem],
                            status: 'pending_review',
                            locked: true,
                        })
                            .select()
                            .single()];
                case 35:
                    _s = _t.sent(), versionRecord = _s.data, versionError = _s.error;
                    if (versionError) {
                        return [2 /*return*/, NextResponse.json({ error: versionError.message }, { status: 500 })];
                    }
                    if (!(previewEnabled && isVideo && versionRecord)) return [3 /*break*/, 37];
                    return [4 /*yield*/, import('@/lib/video-preview')];
                case 36:
                    generateVideoPreview = (_t.sent()).generateVideoPreview;
                    generateVideoPreview(dealId, versionRecord.id, fileItem.id).catch(function (err) {
                        console.error('[VIDEO_PREVIEW] Background generation task error:', err);
                    });
                    _t.label = 37;
                case 37:
                    if (!storageRecord) return [3 /*break*/, 39];
                    return [4 /*yield*/, admin
                            .from('storage_usage')
                            .update({
                            total_bytes: Number(storageRecord.total_bytes || 0) + file.size,
                            files_bytes: Number(storageRecord.files_bytes || 0) + file.size,
                            updated_at: new Date().toISOString(),
                        })
                            .eq('user_id', user.id)];
                case 38:
                    _t.sent();
                    _t.label = 39;
                case 39: 
                // 6. Create timeline event & system message
                return [4 /*yield*/, admin.from('deal_events').insert({
                        deal_id: dealId,
                        type: 'file_uploaded',
                        actor_id: user.id,
                        actor_name: ((_g = user.user_metadata) === null || _g === void 0 ? void 0 : _g.displayName) || 'Creator',
                        actor_role: 'creator',
                        description: "Uploaded new version (v".concat(versionNum, ") of ").concat(file.name, "."),
                    })];
                case 40:
                    // 6. Create timeline event & system message
                    _t.sent();
                    return [4 /*yield*/, admin.from('deal_messages').insert({
                            deal_id: dealId,
                            sender_id: user.id,
                            sender_name: ((_h = user.user_metadata) === null || _h === void 0 ? void 0 : _h.displayName) || 'Creator',
                            sender_role: 'creator',
                            type: 'file',
                            content: "Uploaded deliverable files (Version ".concat(versionNum, ")"),
                        })];
                case 41:
                    _t.sent();
                    _t.label = 42;
                case 42:
                    _t.trys.push([42, 46, , 47]);
                    if (!(deal === null || deal === void 0 ? void 0 : deal.client_email)) return [3 /*break*/, 45];
                    return [4 /*yield*/, import('@/lib/email')];
                case 43:
                    sendDeliverablesUploadedEmail = (_t.sent()).sendDeliverablesUploadedEmail;
                    canonicalDealUrl = "".concat(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', "/deal/").concat(deal.token);
                    return [4 /*yield*/, sendDeliverablesUploadedEmail({
                            clientName: deal.client_name || 'Client',
                            clientEmail: deal.client_email,
                            creatorName: ((_j = user.user_metadata) === null || _j === void 0 ? void 0 : _j.displayName) || 'Creator',
                            dealTitle: deal.title,
                            versionNumber: versionNum,
                            fileNames: [file.name],
                            dealUrl: canonicalDealUrl,
                        })];
                case 44:
                    _t.sent();
                    _t.label = 45;
                case 45: return [3 /*break*/, 47];
                case 46:
                    emailErr_2 = _t.sent();
                    console.error('Error dispatching deliverable upload email:', emailErr_2);
                    return [3 /*break*/, 47];
                case 47: return [2 /*return*/, NextResponse.json({ success: true, version: versionRecord })];
                case 48:
                    error_1 = _t.sent();
                    console.error('Error in file upload route:', error_1);
                    return [2 /*return*/, NextResponse.json({ error: (error_1 === null || error_1 === void 0 ? void 0 : error_1.message) || 'File upload failed' }, { status: 500 })];
                case 49: return [2 /*return*/];
            }
        });
    });
}
