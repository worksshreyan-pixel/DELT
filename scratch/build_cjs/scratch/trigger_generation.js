"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Load .env.local variables manually since ts-node doesn't run Next.js context
const envPath = path_1.default.join(__dirname, '..', '.env.local');
if (fs_1.default.existsSync(envPath)) {
    const envContent = fs_1.default.readFileSync(envPath, 'utf8');
    envContent.split(/\r?\n/).forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#'))
            return;
        const eq = trimmed.indexOf('=');
        if (eq > 0) {
            const k = trimmed.slice(0, eq).trim();
            const v = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
            process.env[k] = v;
        }
    });
}
// Append FFmpeg bin path to process.env.PATH so the current Node process can locate it
if (process.platform === 'win32') {
    process.env.PATH = (process.env.PATH || '') + ';D:\\Programming\\ffmpeg-9.0.1-essentials_build\\bin';
}
const video_preview_1 = require("../lib/video-preview");
const admin_1 = require("../lib/supabase/admin");
const dealId = 'f70d8331-059f-4ec5-a5a6-cdf491de7336';
const fileVersionId = 'dbfa836d-c66b-4dfc-8c6e-758cd6623d03';
const fileId = 'f_1786806550124';
async function run() {
    const admin = (0, admin_1.createAdminClient)();
    // 1. Fetch before state
    const { data: vBefore } = await admin
        .from('file_versions')
        .select('*')
        .eq('id', fileVersionId)
        .single();
    const filesBefore = vBefore ? (vBefore.files || []) : [];
    const fileBefore = filesBefore.find((f) => f.id === fileId);
    console.log('--- BEFORE PROCESSING ---');
    console.log(`File Name: ${fileBefore?.name}`);
    console.log(`Preview Status: ${fileBefore?.previewStatus}`);
    console.log(`Preview Path: ${fileBefore?.previewPath}`);
    // 2. Reset status to failed so that generator doesn't skip it
    if (fileBefore && fileBefore.previewStatus === 'ready') {
        console.log('Resetting preview path and status for clean run...');
        const resetFiles = filesBefore.map((f) => {
            if (f.id === fileId) {
                return {
                    ...f,
                    previewPath: undefined,
                    previewStatus: undefined,
                };
            }
            return f;
        });
        await admin.from('file_versions').update({ files: resetFiles }).eq('id', fileVersionId);
    }
    // 3. Trigger video preview generation
    console.log('\n--- RUNNING VIDEO PREVIEW GENERATION ---');
    console.time('GenerationTime');
    await (0, video_preview_1.generateVideoPreview)(dealId, fileVersionId, fileId);
    console.timeEnd('GenerationTime');
    // 4. Fetch after state
    const { data: vAfter } = await admin
        .from('file_versions')
        .select('*')
        .eq('id', fileVersionId)
        .single();
    const filesAfter = vAfter ? (vAfter.files || []) : [];
    const fileAfter = filesAfter.find((f) => f.id === fileId);
    console.log('\n--- AFTER PROCESSING ---');
    console.log(`File Name: ${fileAfter?.name}`);
    console.log(`Preview Status: ${fileAfter?.previewStatus}`);
    console.log(`Preview Path: ${fileAfter?.previewPath}`);
    console.log(`Preview Type: ${fileAfter?.previewType}`);
    console.log(`Preview Start Offset: ${fileAfter?.previewStart}s`);
    console.log(`Preview Duration: ${fileAfter?.previewDuration}s`);
    console.log(`Generated At: ${fileAfter?.previewGeneratedAt}`);
}
run().catch(console.error);
