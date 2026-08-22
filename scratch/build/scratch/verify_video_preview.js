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
import { isFfmpegAvailable } from '../lib/video-preview';
// Test mock of the segment duration and start offset calculation logic
function testPreviewRules(duration) {
    var previewStart = 0;
    var previewDuration = duration;
    if (duration > 15) {
        var maxDuration = Math.min(20, duration);
        previewDuration = 15 + Math.random() * (maxDuration - 15);
        previewStart = Math.random() * (duration - previewDuration);
        previewDuration = Math.round(previewDuration * 100) / 100;
        previewStart = Math.round(previewStart * 100) / 100;
    }
    return { previewStart: previewStart, previewDuration: previewDuration };
}
function verify() {
    return __awaiter(this, void 0, void 0, function () {
        var ffmpegStatus, testDurations, _i, testDurations_1, d, _a, previewStart, previewDuration, attempt1, attempt2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log('=== DELT VIDEO PREVIEW LOGIC VERIFICATION ===');
                    return [4 /*yield*/, isFfmpegAvailable()];
                case 1:
                    ffmpegStatus = _b.sent();
                    console.log("FFmpeg Available in Environment: ".concat(ffmpegStatus));
                    // 2. Validate Segment Duration and Start Logic
                    console.log('\n--- Slicing Duration Rules Verification ---');
                    testDurations = [8, 12, 15, 30, 120, 600];
                    for (_i = 0, testDurations_1 = testDurations; _i < testDurations_1.length; _i++) {
                        d = testDurations_1[_i];
                        _a = testPreviewRules(d), previewStart = _a.previewStart, previewDuration = _a.previewDuration;
                        console.log("Input Duration: ".concat(d, "s"));
                        console.log("  -> Selected Segment: Start=".concat(previewStart, "s, Duration=").concat(previewDuration, "s"));
                        // Validations
                        if (d <= 15) {
                            if (previewDuration !== d)
                                throw new Error("Failed: expected entire video for ".concat(d, "s"));
                            if (previewStart !== 0)
                                throw new Error("Failed: expected start=0 for ".concat(d, "s"));
                        }
                        else {
                            if (previewDuration < 15 || previewDuration > 20) {
                                throw new Error("Failed: preview duration ".concat(previewDuration, "s out of range [15, 20]"));
                            }
                            if (previewStart < 0 || previewStart + previewDuration > d) {
                                throw new Error("Failed: segment bounds invalid for start=".concat(previewStart, "s, duration=").concat(previewDuration, "s, total=").concat(d, "s"));
                            }
                        }
                    }
                    console.log('✓ All segment calculations match rules specifications.');
                    // 3. Test multiple uploads chosen positions
                    console.log('\n--- Randomization Test (Two uploads from same 600s video) ---');
                    attempt1 = testPreviewRules(600);
                    attempt2 = testPreviewRules(600);
                    console.log("Upload 1: Start=".concat(attempt1.previewStart, "s, Duration=").concat(attempt1.previewDuration, "s"));
                    console.log("Upload 2: Start=".concat(attempt2.previewStart, "s, Duration=").concat(attempt2.previewDuration, "s"));
                    if (attempt1.previewStart === attempt2.previewStart) {
                        console.warn('⚠️ Warning: Start positions are identical (highly unlikely for random values).');
                    }
                    else {
                        console.log('✓ Different random start positions chosen successfully.');
                    }
                    console.log('\n=== VERIFICATION FINISHED SUCCESSFULLY ===');
                    return [2 /*return*/];
            }
        });
    });
}
verify().catch(console.error);
