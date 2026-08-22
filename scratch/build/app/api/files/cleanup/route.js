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
import { createAdminClient } from '@/lib/supabase/admin';
export function POST(request) {
    return __awaiter(this, void 0, void 0, function () {
        var authHeader, serviceKey, admin_1, now_1, nowString_1, _a, fileVersions, fetchErr, logs_1, filesDeletedCount_1, totalBytesFreed_1, _loop_1, _i, fileVersions_1, version, error_1;
        var _this = this;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 6, , 7]);
                    authHeader = request.headers.get('authorization');
                    serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
                    if (serviceKey && authHeader !== "Bearer ".concat(serviceKey)) {
                        // Allow local development triggers without error if key is unset, but enforce in production
                        if (process.env.NODE_ENV === 'production') {
                            return [2 /*return*/, NextResponse.json({ error: 'Unauthorized system service call' }, { status: 401 })];
                        }
                    }
                    admin_1 = createAdminClient();
                    now_1 = new Date();
                    nowString_1 = now_1.toISOString();
                    return [4 /*yield*/, admin_1
                            .from('file_versions')
                            .select('*, deals(status, creator_id)')];
                case 1:
                    _a = _b.sent(), fileVersions = _a.data, fetchErr = _a.error;
                    if (fetchErr) {
                        console.error('Error fetching file versions for cleanup:', fetchErr);
                        return [2 /*return*/, NextResponse.json({ error: 'Failed to fetch versions' }, { status: 500 })];
                    }
                    logs_1 = [];
                    filesDeletedCount_1 = 0;
                    totalBytesFreed_1 = 0;
                    if (!(fileVersions && fileVersions.length > 0)) return [3 /*break*/, 5];
                    _loop_1 = function (version) {
                        var filesList, hasChanges, deal, updatedFiles;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    filesList = Array.isArray(version.files) ? version.files : [];
                                    hasChanges = false;
                                    deal = version.deals;
                                    if (!deal || deal.status !== 'closed') {
                                        return [2 /*return*/, "continue"];
                                    }
                                    return [4 /*yield*/, Promise.all(filesList.map(function (f) { return __awaiter(_this, void 0, void 0, function () {
                                            var isRetention, isExpired, delOriginalErr, storageErr_1, delPreviewErr, previewErr_1, creatorId, storageRecord, newTotalBytes, newFilesBytes;
                                            return __generator(this, function (_a) {
                                                switch (_a.label) {
                                                    case 0:
                                                        isRetention = f.deletionStatus === 'retention';
                                                        isExpired = f.retentionUntil && new Date(f.retentionUntil) <= now_1;
                                                        if (!(isRetention && isExpired)) return [3 /*break*/, 13];
                                                        logs_1.push("Processing expired file: ".concat(f.name, " (id: ").concat(f.id, ")"));
                                                        _a.label = 1;
                                                    case 1:
                                                        _a.trys.push([1, 3, , 4]);
                                                        return [4 /*yield*/, admin_1.storage
                                                                .from('deal-files')
                                                                .remove([f.path])];
                                                    case 2:
                                                        delOriginalErr = (_a.sent()).error;
                                                        if (delOriginalErr) {
                                                            console.error("Failed to delete original file ".concat(f.path, ":"), delOriginalErr);
                                                            // Do not fail the whole transaction, but mark it for retry
                                                            return [2 /*return*/, f];
                                                        }
                                                        logs_1.push("Deleted original storage object: ".concat(f.path));
                                                        return [3 /*break*/, 4];
                                                    case 3:
                                                        storageErr_1 = _a.sent();
                                                        console.error("Storage error removing original ".concat(f.path, ":"), storageErr_1);
                                                        return [2 /*return*/, f];
                                                    case 4:
                                                        if (!f.previewPath) return [3 /*break*/, 8];
                                                        _a.label = 5;
                                                    case 5:
                                                        _a.trys.push([5, 7, , 8]);
                                                        return [4 /*yield*/, admin_1.storage
                                                                .from('deal-files')
                                                                .remove([f.previewPath])];
                                                    case 6:
                                                        delPreviewErr = (_a.sent()).error;
                                                        if (delPreviewErr) {
                                                            console.error("Failed to delete preview file ".concat(f.previewPath, ":"), delPreviewErr);
                                                        }
                                                        else {
                                                            logs_1.push("Deleted preview storage object: ".concat(f.previewPath));
                                                        }
                                                        return [3 /*break*/, 8];
                                                    case 7:
                                                        previewErr_1 = _a.sent();
                                                        console.error("Storage error removing preview ".concat(f.previewPath, ":"), previewErr_1);
                                                        return [3 /*break*/, 8];
                                                    case 8:
                                                        creatorId = deal.creator_id;
                                                        if (!(creatorId && f.size)) return [3 /*break*/, 11];
                                                        return [4 /*yield*/, admin_1
                                                                .from('storage_usage')
                                                                .select('*')
                                                                .eq('user_id', creatorId)
                                                                .maybeSingle()];
                                                    case 9:
                                                        storageRecord = (_a.sent()).data;
                                                        if (!storageRecord) return [3 /*break*/, 11];
                                                        newTotalBytes = Math.max(0, Number(storageRecord.total_bytes || 0) - f.size);
                                                        newFilesBytes = Math.max(0, Number(storageRecord.files_bytes || 0) - f.size);
                                                        return [4 /*yield*/, admin_1
                                                                .from('storage_usage')
                                                                .update({
                                                                total_bytes: newTotalBytes,
                                                                files_bytes: newFilesBytes,
                                                                updated_at: nowString_1,
                                                            })
                                                                .eq('user_id', creatorId)];
                                                    case 10:
                                                        _a.sent();
                                                        totalBytesFreed_1 += f.size;
                                                        logs_1.push("Decremented storage allocation for creator ".concat(creatorId, " by ").concat(f.size, " bytes"));
                                                        _a.label = 11;
                                                    case 11: 
                                                    // D. Record audit trail event
                                                    return [4 /*yield*/, admin_1.from('deal_events').insert({
                                                            deal_id: version.deal_id,
                                                            type: 'files_deleted',
                                                            actor_id: 'system',
                                                            actor_name: 'DELT System',
                                                            actor_role: 'creator',
                                                            description: "File \"".concat(f.name, "\" permanently deleted after retention period expired."),
                                                            metadata: { fileId: f.id, fileSize: f.size },
                                                        })];
                                                    case 12:
                                                        // D. Record audit trail event
                                                        _a.sent();
                                                        filesDeletedCount_1++;
                                                        hasChanges = true;
                                                        // E. Update metadata values
                                                        return [2 /*return*/, __assign(__assign({}, f), { deletionStatus: 'deleted', deletedAt: nowString_1 })];
                                                    case 13: return [2 /*return*/, f];
                                                }
                                            });
                                        }); }))];
                                case 1:
                                    updatedFiles = _c.sent();
                                    if (!hasChanges) return [3 /*break*/, 3];
                                    // Update version record in the database
                                    return [4 /*yield*/, admin_1
                                            .from('file_versions')
                                            .update({
                                            files: updatedFiles,
                                        })
                                            .eq('id', version.id)];
                                case 2:
                                    // Update version record in the database
                                    _c.sent();
                                    _c.label = 3;
                                case 3: return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, fileVersions_1 = fileVersions;
                    _b.label = 2;
                case 2:
                    if (!(_i < fileVersions_1.length)) return [3 /*break*/, 5];
                    version = fileVersions_1[_i];
                    return [5 /*yield**/, _loop_1(version)];
                case 3:
                    _b.sent();
                    _b.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5: return [2 /*return*/, NextResponse.json({
                        success: true,
                        filesDeleted: filesDeletedCount_1,
                        bytesFreed: totalBytesFreed_1,
                        logs: logs_1,
                    })];
                case 6:
                    error_1 = _b.sent();
                    console.error('Error executing database file cleanup:', error_1);
                    return [2 /*return*/, NextResponse.json({ error: (error_1 === null || error_1 === void 0 ? void 0 : error_1.message) || 'Internal server error executing cleanup' }, { status: 500 })];
                case 7: return [2 /*return*/];
            }
        });
    });
}
