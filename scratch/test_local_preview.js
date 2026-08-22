const fs = require('fs');
const path = require('path');

// Load environment variables
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eq = trimmed.indexOf('=');
    if (eq > 0) {
      const k = trimmed.slice(0, eq).trim();
      const v = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
      process.env[k] = v;
    }
  });
}

// Ensure local FFmpeg is used
process.env.VIDEO_PROCESSOR_URL = '';

// Add FFmpeg path if needed
if (process.platform === 'win32') {
  process.env.PATH = (process.env.PATH || '') + ';D:\\Programming\\ffmpeg-9.0.1-essentials_build\\bin';
}

const { generateVideoPreview } = require('../lib/video-preview');

async function test() {
  console.log('Starting local video preview generation test...');
  const dealId = '47ddac8e-acc0-41a9-a135-400197381e1e';
  const fileVersionId = '4c808fa9-c78a-4de2-a64c-d6ad1c1eab92';
  const fileId = 'f_1787379683799_rbjad';

  try {
    await generateVideoPreview(dealId, fileVersionId, fileId);
    console.log('SUCCESS: Video preview generation finished.');
  } catch (error) {
    console.error('FAILED: Video preview generation failed with error:', error);
  }
}

test();
