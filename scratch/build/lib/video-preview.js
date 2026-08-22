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
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { createAdminClient } from '@/lib/supabase/admin';
var execPromise = promisify(exec);
/**
 * Checks if a real FFmpeg-capable runtime is available.
 */
export function isFfmpegAvailable() {
    return __awaiter(this, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, execPromise('ffmpeg -version')];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, execPromise('ffprobe -version')];
                case 2:
                    _a.sent();
                    return [2 /*return*/, true];
                case 3:
                    error_1 = _a.sent();
                    console.warn('[VIDEO_PREVIEW] FFmpeg check failed. Video processing is unavailable in this environment.');
                    return [2 /*return*/, false];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * Scans the filesystem for a standard sans-serif TrueType font.
 */
function getFontPath() {
    var winFont = 'C:\\Windows\\Fonts\\arial.ttf';
    if (fs.existsSync(winFont)) {
        return winFont;
    }
    var linuxFonts = [
        '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
        '/usr/share/fonts/truetype/freefont/FreeSans.ttf',
        '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf'
    ];
    for (var _i = 0, linuxFonts_1 = linuxFonts; _i < linuxFonts_1.length; _i++) {
        var f = linuxFonts_1[_i];
        if (fs.existsSync(f)) {
            return f;
        }
    }
    return null;
}
/**
 * Formats the font parameter for FFmpeg drawtext filter, copying it locally to avoid escaping colons/slashes on Windows.
 */
function getEscapedFontFileParam() {
    var fontPath = getFontPath();
    if (!fontPath)
        return '';
    var localFontName = 'delt_temp_font.ttf';
    var localFontPath = path.join(process.cwd(), localFontName);
    if (!fs.existsSync(localFontPath) && fs.existsSync(fontPath)) {
        try {
            fs.copyFileSync(fontPath, localFontPath);
            console.log("[VIDEO_PREVIEW] Copied system font to local path: ".concat(localFontPath));
        }
        catch (err) {
            console.warn('[VIDEO_PREVIEW] Failed to copy font file to local directory:', err);
        }
    }
    if (fs.existsSync(localFontPath)) {
        // Return relative path to local file (escaped properly for FFmpeg)
        return ":fontfile='".concat(localFontName, "'");
    }
    return '';
}
/**
 * Creates the staggered tiled grid of hollow (outlined) watermarks.
 */
function getWatermarkFilter() {
    var text = 'DELT PREVIEW';
    var fontSize = 18;
    var stepX = 220;
    var stepY = 120;
    var fontParam = getEscapedFontFileParam();
    var drawtextFilters = [];
    // Staggered grid covering a 480p frame (height=480, standard width up to 854)
    for (var y = 30; y < 480; y += stepY) {
        var isEven = Math.round(y / stepY) % 2 === 0;
        var xOffset = isEven ? 0 : Math.round(stepX / 2);
        for (var x = 30; x < 854; x += stepX) {
            // Escape text for FFmpeg drawtext parameters
            var escapedText = text.replace(/'/g, "'\\\\\\''").replace(/:/g, '\\\\:');
            drawtextFilters.push("drawtext=text='".concat(escapedText, "':fontcolor=0x464646@0.0:borderw=1.5:bordercolor=0x464646@0.35:fontsize=").concat(fontSize).concat(fontParam, ":x=").concat(x + xOffset, ":y=").concat(y));
        }
    }
    return drawtextFilters.join(',');
}
/**
 * Main video preview generation task.
 * Runs asynchronously in the background.
 */
export function generateVideoPreview(dealId, fileVersionId, fileId) {
    return __awaiter(this, void 0, void 0, function () {
        var admin, tempOutPath, _a, versionRecord, fetchErr, files, fileIndex, fileItem, filesWithProcessing, processorUrl, secret, requestId, response, errText, err_1, ffmpegReady, _b, signedUrlData, signError, signedUrl, ffprobeCmd, ffprobeStdout, duration, previewStart, previewDuration, maxDuration, tempDir, watermarkFilter, filterGraph, ffmpegCmd, previewStats, versionNum, cleanPreviewName, previewPath, previewBuffer, uploadError, filesWithReady, updateError, error_2, currentVersion, curFiles, fIdx, updatedFiles, dbErr_1;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    admin = createAdminClient();
                    tempOutPath = null;
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 18, 25, 26]);
                    console.log("[VIDEO_PREVIEW] Starting generation for deal=".concat(dealId, ", version=").concat(fileVersionId, ", file=").concat(fileId));
                    return [4 /*yield*/, admin
                            .from('file_versions')
                            .select('*')
                            .eq('id', fileVersionId)
                            .eq('deal_id', dealId)
                            .maybeSingle()];
                case 2:
                    _a = _c.sent(), versionRecord = _a.data, fetchErr = _a.error;
                    if (fetchErr || !versionRecord) {
                        throw new Error("File version ".concat(fileVersionId, " not found: ").concat(fetchErr === null || fetchErr === void 0 ? void 0 : fetchErr.message));
                    }
                    files = Array.isArray(versionRecord.files) ? versionRecord.files : [];
                    fileIndex = files.findIndex(function (f) { return f.id === fileId; });
                    if (fileIndex === -1) {
                        throw new Error("File ".concat(fileId, " not found in version ").concat(fileVersionId));
                    }
                    fileItem = files[fileIndex];
                    // Ensure we don't duplicate generation if already ready
                    if (fileItem.previewStatus === 'ready' && fileItem.previewPath) {
                        console.log("[VIDEO_PREVIEW] Preview already exists for file=".concat(fileId, ". Skipping."));
                        return [2 /*return*/];
                    }
                    filesWithProcessing = __spreadArray([], files, true);
                    filesWithProcessing[fileIndex] = __assign(__assign({}, fileItem), { previewStatus: 'processing' });
                    return [4 /*yield*/, admin
                            .from('file_versions')
                            .update({ files: filesWithProcessing })
                            .eq('id', fileVersionId)];
                case 3:
                    _c.sent();
                    processorUrl = process.env.VIDEO_PROCESSOR_URL;
                    secret = process.env.VIDEO_PROCESSOR_SECRET;
                    if (!processorUrl) return [3 /*break*/, 10];
                    if (!secret) {
                        console.error("[VIDEO_PROCESSOR] Configuration error: VIDEO_PROCESSOR_SECRET is missing. Cannot delegate request securely.");
                        throw new Error('[VIDEO_PROCESSOR] Configuration error: VIDEO_PROCESSOR_SECRET is missing.');
                    }
                    console.log("[VIDEO_PROCESSOR] configured=true processorUrl=".concat(processorUrl));
                    requestId = "req_".concat(Date.now(), "_").concat(Math.random().toString(36).substring(2, 7));
                    console.log("[VIDEO_PROCESSOR] Forwarding request. requestId=".concat(requestId, " dealId=").concat(dealId, " fileId=").concat(fileId, " processorUrl=").concat(processorUrl));
                    _c.label = 4;
                case 4:
                    _c.trys.push([4, 8, , 9]);
                    return [4 /*yield*/, fetch("".concat(processorUrl.replace(/\/$/, ''), "/process"), {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': "Bearer ".concat(secret)
                            },
                            body: JSON.stringify({
                                dealId: dealId,
                                fileVersionId: fileVersionId,
                                fileId: fileId
                            })
                        })];
                case 5:
                    response = _c.sent();
                    console.log("[VIDEO_PROCESSOR] Response received. requestId=".concat(requestId, " dealId=").concat(dealId, " fileId=").concat(fileId, " status=").concat(response.status, " success=").concat(response.ok));
                    if (!!response.ok) return [3 /*break*/, 7];
                    return [4 /*yield*/, response.text()];
                case 6:
                    errText = _c.sent();
                    throw new Error("[VIDEO_PROCESSOR] Render processor returned error status ".concat(response.status, ": ").concat(errText));
                case 7:
                    console.log("[VIDEO_PROCESSOR] Successfully delegated preview generation. requestId=".concat(requestId, " dealId=").concat(dealId, " fileId=").concat(fileId, " processorUrl=").concat(processorUrl, " success=true"));
                    return [2 /*return*/];
                case 8:
                    err_1 = _c.sent();
                    console.error("[VIDEO_PROCESSOR] Failed to call Render processor. requestId=".concat(requestId, " dealId=").concat(dealId, " fileId=").concat(fileId, " error="), err_1);
                    // Do NOT fall back to local FFmpeg in production - propagate error to trigger failed status directly
                    throw err_1;
                case 9: return [3 /*break*/, 11];
                case 10:
                    if (process.env.NODE_ENV === 'production') {
                        console.error("[VIDEO_PROCESSOR] Configuration error: VIDEO_PROCESSOR_URL is missing in production.");
                        throw new Error('[VIDEO_PROCESSOR] Configuration error: VIDEO_PROCESSOR_URL is missing in production.');
                    }
                    console.log("[VIDEO_PROCESSOR] configured=false. VIDEO_PROCESSOR_URL is not set. Falling back to local FFmpeg.");
                    _c.label = 11;
                case 11: return [4 /*yield*/, isFfmpegAvailable()];
                case 12:
                    ffmpegReady = _c.sent();
                    if (!ffmpegReady) {
                        throw new Error('FFmpeg binaries (ffmpeg/ffprobe) not found in system PATH. ' +
                            'DELT requires an environment with an FFmpeg-capable runtime to generate video previews. ' +
                            'Gracefully marking preview status as failed.');
                    }
                    return [4 /*yield*/, admin.storage
                            .from('deal-files')
                            .createSignedUrl(fileItem.path, 120)];
                case 13:
                    _b = _c.sent(), signedUrlData = _b.data, signError = _b.error;
                    if (signError || !(signedUrlData === null || signedUrlData === void 0 ? void 0 : signedUrlData.signedUrl)) {
                        throw new Error("Failed to generate signed url for original video: ".concat(signError === null || signError === void 0 ? void 0 : signError.message));
                    }
                    signedUrl = signedUrlData.signedUrl;
                    // 5. Detect video duration using ffprobe
                    console.log('[VIDEO_PREVIEW] Querying video duration with ffprobe...');
                    ffprobeCmd = "ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 \"".concat(signedUrl, "\"");
                    return [4 /*yield*/, execPromise(ffprobeCmd)];
                case 14:
                    ffprobeStdout = (_c.sent()).stdout;
                    duration = parseFloat(ffprobeStdout.trim());
                    if (isNaN(duration) || duration <= 0) {
                        throw new Error("Failed to determine valid video duration: ".concat(ffprobeStdout));
                    }
                    console.log("[VIDEO_PREVIEW] Original video duration detected: ".concat(duration, "s"));
                    console.log("[VIDEO_PROCESSOR] Local processing status. dealId=".concat(dealId, " fileId=").concat(fileId, " duration=").concat(duration, "s success=true"));
                    previewStart = 0;
                    previewDuration = duration;
                    if (duration > 15) {
                        maxDuration = Math.min(20, duration);
                        previewDuration = 15 + Math.random() * (maxDuration - 15);
                        // Pick random start position within valid bounds
                        previewStart = Math.random() * (duration - previewDuration);
                        // Round to 2 decimal places
                        previewDuration = Math.round(previewDuration * 100) / 100;
                        previewStart = Math.round(previewStart * 100) / 100;
                    }
                    console.log("[VIDEO_PREVIEW] Selected rules: start=".concat(previewStart, "s, duration=").concat(previewDuration, "s"));
                    tempDir = os.tmpdir();
                    tempOutPath = path.join(tempDir, "preview_".concat(dealId, "_").concat(fileId, "_").concat(Date.now(), ".mp4"));
                    watermarkFilter = getWatermarkFilter();
                    filterGraph = "scale=-2:480,".concat(watermarkFilter);
                    // FFmpeg command to stream the segment, resize, Cap bitrate, apply outlined watermark, output H.264
                    console.log('[VIDEO_PREVIEW] Executing FFmpeg processing...');
                    ffmpegCmd = "ffmpeg -y -ss ".concat(previewStart, " -t ").concat(previewDuration, " -i \"").concat(signedUrl, "\" -vf \"").concat(filterGraph, "\" -b:v 500k -maxrate 750k -bufsize 1000k -c:v libx264 -preset fast -crf 28 -c:a aac -b:a 96k -map 0:v:0 -map 0:a? \"").concat(tempOutPath, "\"");
                    return [4 /*yield*/, execPromise(ffmpegCmd)];
                case 15:
                    _c.sent();
                    if (!fs.existsSync(tempOutPath)) {
                        throw new Error('FFmpeg completed execution but output preview file was not created.');
                    }
                    previewStats = fs.statSync(tempOutPath);
                    console.log("[VIDEO_PREVIEW] Output preview file size: ".concat(previewStats.size, " bytes"));
                    versionNum = versionRecord.version || 1;
                    cleanPreviewName = fileItem.name.replace(/\.[^.]+$/, '_preview.mp4').replace(/[^a-zA-Z0-9._-]/g, '_');
                    previewPath = "previews/".concat(dealId, "/v").concat(versionNum, "/").concat(Date.now(), "_").concat(cleanPreviewName);
                    previewBuffer = fs.readFileSync(tempOutPath);
                    console.log("[VIDEO_PREVIEW] Uploading preview copy to deal-files storage path=".concat(previewPath, "..."));
                    return [4 /*yield*/, admin.storage
                            .from('deal-files')
                            .upload(previewPath, previewBuffer, {
                            contentType: 'video/mp4',
                            upsert: true,
                        })];
                case 16:
                    uploadError = (_c.sent()).error;
                    if (uploadError) {
                        throw new Error("Failed to upload preview to storage: ".concat(uploadError.message));
                    }
                    filesWithReady = __spreadArray([], files, true);
                    filesWithReady[fileIndex] = __assign(__assign({}, fileItem), { previewPath: previewPath, previewType: 'video/mp4', previewStatus: 'ready', previewGeneratedAt: new Date().toISOString(), previewStart: previewStart, previewDuration: previewDuration });
                    return [4 /*yield*/, admin
                            .from('file_versions')
                            .update({ files: filesWithReady })
                            .eq('id', fileVersionId)];
                case 17:
                    updateError = (_c.sent()).error;
                    if (updateError) {
                        throw new Error("Failed to update DB metadata to ready: ".concat(updateError.message));
                    }
                    console.log("[VIDEO_PREVIEW] Generation complete and saved successfully for file=".concat(fileId, "!"));
                    console.log("[VIDEO_PROCESSOR] Local processing complete. dealId=".concat(dealId, " fileId=").concat(fileId, " success=true"));
                    return [3 /*break*/, 26];
                case 18:
                    error_2 = _c.sent();
                    console.error("[VIDEO_PREVIEW] Error occurred:", error_2);
                    _c.label = 19;
                case 19:
                    _c.trys.push([19, 23, , 24]);
                    return [4 /*yield*/, admin
                            .from('file_versions')
                            .select('*')
                            .eq('id', fileVersionId)
                            .maybeSingle()];
                case 20:
                    currentVersion = (_c.sent()).data;
                    if (!currentVersion) return [3 /*break*/, 22];
                    curFiles = Array.isArray(currentVersion.files) ? currentVersion.files : [];
                    fIdx = curFiles.findIndex(function (f) { return f.id === fileId; });
                    if (!(fIdx !== -1)) return [3 /*break*/, 22];
                    updatedFiles = __spreadArray([], curFiles, true);
                    updatedFiles[fIdx] = __assign(__assign({}, updatedFiles[fIdx]), { previewStatus: 'failed', previewGeneratedAt: new Date().toISOString() });
                    return [4 /*yield*/, admin
                            .from('file_versions')
                            .update({ files: updatedFiles })
                            .eq('id', fileVersionId)];
                case 21:
                    _c.sent();
                    _c.label = 22;
                case 22: return [3 /*break*/, 24];
                case 23:
                    dbErr_1 = _c.sent();
                    console.error('[VIDEO_PREVIEW] Double fault: Failed to mark file status as failed in DB:', dbErr_1);
                    return [3 /*break*/, 24];
                case 24: return [3 /*break*/, 26];
                case 25:
                    // Cleanup temporary file
                    if (tempOutPath && fs.existsSync(tempOutPath)) {
                        try {
                            fs.unlinkSync(tempOutPath);
                            console.log("[VIDEO_PREVIEW] Cleaned up temp file: ".concat(tempOutPath));
                        }
                        catch (cleanupErr) {
                            console.error("[VIDEO_PREVIEW] Failed to delete temp file ".concat(tempOutPath, ":"), cleanupErr);
                        }
                    }
                    return [7 /*endfinally*/];
                case 26: return [2 /*return*/];
            }
        });
    });
}
