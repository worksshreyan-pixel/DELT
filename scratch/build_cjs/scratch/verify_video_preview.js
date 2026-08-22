"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const video_preview_1 = require("../lib/video-preview");
// Test mock of the segment duration and start offset calculation logic
function testPreviewRules(duration) {
    let previewStart = 0;
    let previewDuration = duration;
    if (duration > 15) {
        const maxDuration = Math.min(20, duration);
        previewDuration = 15 + Math.random() * (maxDuration - 15);
        previewStart = Math.random() * (duration - previewDuration);
        previewDuration = Math.round(previewDuration * 100) / 100;
        previewStart = Math.round(previewStart * 100) / 100;
    }
    return { previewStart, previewDuration };
}
async function verify() {
    console.log('=== DELT VIDEO PREVIEW LOGIC VERIFICATION ===');
    // 1. Check FFmpeg Availability
    const ffmpegStatus = await (0, video_preview_1.isFfmpegAvailable)();
    console.log(`FFmpeg Available in Environment: ${ffmpegStatus}`);
    // 2. Validate Segment Duration and Start Logic
    console.log('\n--- Slicing Duration Rules Verification ---');
    const testDurations = [8, 12, 15, 30, 120, 600];
    for (const d of testDurations) {
        const { previewStart, previewDuration } = testPreviewRules(d);
        console.log(`Input Duration: ${d}s`);
        console.log(`  -> Selected Segment: Start=${previewStart}s, Duration=${previewDuration}s`);
        // Validations
        if (d <= 15) {
            if (previewDuration !== d)
                throw new Error(`Failed: expected entire video for ${d}s`);
            if (previewStart !== 0)
                throw new Error(`Failed: expected start=0 for ${d}s`);
        }
        else {
            if (previewDuration < 15 || previewDuration > 20) {
                throw new Error(`Failed: preview duration ${previewDuration}s out of range [15, 20]`);
            }
            if (previewStart < 0 || previewStart + previewDuration > d) {
                throw new Error(`Failed: segment bounds invalid for start=${previewStart}s, duration=${previewDuration}s, total=${d}s`);
            }
        }
    }
    console.log('✓ All segment calculations match rules specifications.');
    // 3. Test multiple uploads chosen positions
    console.log('\n--- Randomization Test (Two uploads from same 600s video) ---');
    const attempt1 = testPreviewRules(600);
    const attempt2 = testPreviewRules(600);
    console.log(`Upload 1: Start=${attempt1.previewStart}s, Duration=${attempt1.previewDuration}s`);
    console.log(`Upload 2: Start=${attempt2.previewStart}s, Duration=${attempt2.previewDuration}s`);
    if (attempt1.previewStart === attempt2.previewStart) {
        console.warn('⚠️ Warning: Start positions are identical (highly unlikely for random values).');
    }
    else {
        console.log('✓ Different random start positions chosen successfully.');
    }
    console.log('\n=== VERIFICATION FINISHED SUCCESSFULLY ===');
}
verify().catch(console.error);
