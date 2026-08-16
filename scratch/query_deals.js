const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  const eq = trimmed.indexOf('=');
  if (eq > 0) {
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
  }
});

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function findVideoFiles() {
  console.log('=== DELT DB: Querying File Versions ===');
  const { data: versions, error } = await admin
    .from('file_versions')
    .select('*');

  if (error) {
    console.error('Error fetching file versions:', error);
    return;
  }

  console.log(`Found ${versions.length} file versions total.`);
  let foundVideo = false;

  for (const v of versions) {
    const files = Array.isArray(v.files) ? v.files : [];
    for (const f of files) {
      const ext = f.name.split('.').pop()?.toLowerCase();
      const isVideo = (f.type || '').startsWith('video/') || ext === 'mp4';
      if (isVideo) {
        foundVideo = true;
        console.log(`\nVideo file found:`);
        console.log(`- Deal ID: ${v.deal_id}`);
        console.log(`- Version ID: ${v.id}`);
        console.log(`- File ID: ${f.id}`);
        console.log(`- File Name: ${f.name}`);
        console.log(`- File Path: ${f.path}`);
        console.log(`- Size: ${(f.size / (1024 * 1024)).toFixed(2)} MB (${f.size} bytes)`);
        console.log(`- Preview Path: ${f.previewPath}`);
        console.log(`- Preview Status: ${f.previewStatus}`);
      }
    }
  }

  if (!foundVideo) {
    console.log('No video files found in database.');
  }
}

findVideoFiles();
