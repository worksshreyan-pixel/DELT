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

async function run() {
  console.log('--- INSPECTING REMOTE PROFILES TABLE ---');
  const { data: profiles, error } = await admin.from('profiles').select('*').limit(10);
  if (error) {
    console.error('Select profiles error:', error);
  } else {
    console.log('Sample profiles count:', profiles.length);
    if (profiles.length > 0) {
      console.log('Profile columns:', Object.keys(profiles[0]));
      console.log('Sample profiles:', JSON.stringify(profiles, null, 2));
    }
  }

  // Also test selecting username column specifically
  const { data: usernameData, error: usernameError } = await admin.from('profiles').select('username').limit(1);
  console.log('Select username error:', usernameError);
  console.log('Select username data:', usernameData);
}

run();
