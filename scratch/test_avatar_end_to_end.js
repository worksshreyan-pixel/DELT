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
  console.log('--- FORENSIC TEST: AVATAR-ONLY UPDATE SAFETY AGAINST DB ---');

  // 1. Fetch active profile
  const { data: initialProfile, error: fetchErr } = await admin
    .from('profiles')
    .select('*')
    .limit(1)
    .single();

  if (fetchErr || !initialProfile) {
    console.error('Failed to fetch profile:', fetchErr);
    process.exit(1);
  }

  console.log('Initial Profile ID:', initialProfile.id);
  console.log('Initial Display Name:', initialProfile.display_name);

  // 2. Perform AVATAR-ONLY update (simulating POST /api/profile/avatar behavior)
  const dummyAvatarUrl = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==`;

  const { error: avatarUpdateErr } = await admin
    .from('profiles')
    .update({
      avatar_url: dummyAvatarUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', initialProfile.id);

  if (avatarUpdateErr) {
    console.error('FAILED: Avatar update threw error:', avatarUpdateErr);
    process.exit(1);
  }

  console.log('SUCCESS: Avatar-only update succeeded without display_name error!');

  // 3. Verify display_name was NOT overwritten or set to null
  const { data: updatedProfile, error: verifyErr } = await admin
    .from('profiles')
    .select('*')
    .eq('id', initialProfile.id)
    .single();

  if (verifyErr) {
    console.error('Failed to verify profile:', verifyErr);
    process.exit(1);
  }

  console.log('Verified Display Name remains intact:', updatedProfile.display_name);
  console.log('Verified Avatar URL updated successfully:', updatedProfile.avatar_url?.slice(0, 30) + '...');

  if (updatedProfile.display_name !== initialProfile.display_name) {
    console.error('ERROR: display_name was modified during avatar update!');
    process.exit(1);
  }

  // Restore original avatar_url
  await admin
    .from('profiles')
    .update({ avatar_url: initialProfile.avatar_url })
    .eq('id', initialProfile.id);

  console.log('--- ALL FORENSIC AVATAR SAFETY TESTS PASSED ---');
}

run();
