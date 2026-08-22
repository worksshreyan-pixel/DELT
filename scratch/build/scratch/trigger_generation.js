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
import fs from 'fs';
import path from 'path';
// Load .env.local variables manually since ts-node doesn't run Next.js context
var envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
    var envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split(/\r?\n/).forEach(function (line) {
        var trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#'))
            return;
        var eq = trimmed.indexOf('=');
        if (eq > 0) {
            var k = trimmed.slice(0, eq).trim();
            var v = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
            process.env[k] = v;
        }
    });
}
// Append FFmpeg bin path to process.env.PATH so the current Node process can locate it
if (process.platform === 'win32') {
    process.env.PATH = (process.env.PATH || '') + ';D:\\Programming\\ffmpeg-9.0.1-essentials_build\\bin';
}
import { generateVideoPreview } from '../lib/video-preview';
import { createAdminClient } from '../lib/supabase/admin';
var dealId = 'f70d8331-059f-4ec5-a5a6-cdf491de7336';
var fileVersionId = 'dbfa836d-c66b-4dfc-8c6e-758cd6623d03';
var fileId = 'f_1786806550124';
function run() {
    return __awaiter(this, void 0, void 0, function () {
        var admin, vBefore, filesBefore, fileBefore, resetFiles, vAfter, filesAfter, fileAfter;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    admin = createAdminClient();
                    return [4 /*yield*/, admin
                            .from('file_versions')
                            .select('*')
                            .eq('id', fileVersionId)
                            .single()];
                case 1:
                    vBefore = (_a.sent()).data;
                    filesBefore = vBefore ? (vBefore.files || []) : [];
                    fileBefore = filesBefore.find(function (f) { return f.id === fileId; });
                    console.log('--- BEFORE PROCESSING ---');
                    console.log("File Name: ".concat(fileBefore === null || fileBefore === void 0 ? void 0 : fileBefore.name));
                    console.log("Preview Status: ".concat(fileBefore === null || fileBefore === void 0 ? void 0 : fileBefore.previewStatus));
                    console.log("Preview Path: ".concat(fileBefore === null || fileBefore === void 0 ? void 0 : fileBefore.previewPath));
                    if (!(fileBefore && fileBefore.previewStatus === 'ready')) return [3 /*break*/, 3];
                    console.log('Resetting preview path and status for clean run...');
                    resetFiles = filesBefore.map(function (f) {
                        if (f.id === fileId) {
                            return __assign(__assign({}, f), { previewPath: undefined, previewStatus: undefined });
                        }
                        return f;
                    });
                    return [4 /*yield*/, admin.from('file_versions').update({ files: resetFiles }).eq('id', fileVersionId)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    // 3. Trigger video preview generation
                    console.log('\n--- RUNNING VIDEO PREVIEW GENERATION ---');
                    console.time('GenerationTime');
                    return [4 /*yield*/, generateVideoPreview(dealId, fileVersionId, fileId)];
                case 4:
                    _a.sent();
                    console.timeEnd('GenerationTime');
                    return [4 /*yield*/, admin
                            .from('file_versions')
                            .select('*')
                            .eq('id', fileVersionId)
                            .single()];
                case 5:
                    vAfter = (_a.sent()).data;
                    filesAfter = vAfter ? (vAfter.files || []) : [];
                    fileAfter = filesAfter.find(function (f) { return f.id === fileId; });
                    console.log('\n--- AFTER PROCESSING ---');
                    console.log("File Name: ".concat(fileAfter === null || fileAfter === void 0 ? void 0 : fileAfter.name));
                    console.log("Preview Status: ".concat(fileAfter === null || fileAfter === void 0 ? void 0 : fileAfter.previewStatus));
                    console.log("Preview Path: ".concat(fileAfter === null || fileAfter === void 0 ? void 0 : fileAfter.previewPath));
                    console.log("Preview Type: ".concat(fileAfter === null || fileAfter === void 0 ? void 0 : fileAfter.previewType));
                    console.log("Preview Start Offset: ".concat(fileAfter === null || fileAfter === void 0 ? void 0 : fileAfter.previewStart, "s"));
                    console.log("Preview Duration: ".concat(fileAfter === null || fileAfter === void 0 ? void 0 : fileAfter.previewDuration, "s"));
                    console.log("Generated At: ".concat(fileAfter === null || fileAfter === void 0 ? void 0 : fileAfter.previewGeneratedAt));
                    return [2 /*return*/];
            }
        });
    });
}
run().catch(console.error);
