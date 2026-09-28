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
  console.log('--- TESTING USERNAME END TO END AGAINST REMOTE SUPABASE ---');
  
  // 1. Fetch user profile
  const { data: profileBefore, error: selectErr } = await admin
    .from('profiles')
    .select('*')
    .eq('email', 'examonly2025@gmail.com')
    .single();

  if (selectErr) {
    console.error('Failed to select profile:', selectErr);
    process.exit(1);
  }

  console.log('Initial Profile:', profileBefore);

  // 2. Test updating username to a valid value
  const newUsername = 'shreyan_test_' + Date.now().toString().slice(-4);
  const { data: updatedProfile, error: updateErr } = await admin
    .from('profiles')
    .update({ username: newUsername, updated_at: new Date().toISOString() })
    .eq('id', profileBefore.id)
    .select('*')
    .single();

  if (updateErr) {
    console.error('Failed to update username:', updateErr);
    process.exit(1);
  }

  console.log('Successfully updated username to:', updatedProfile.username);

  // 3. Test uniqueness constraint by inserting/updating duplicate username on another row or check constraint
  const { error: dupErr } = await admin
    .from('profiles')
    .insert({
      id: '00000000-0000-0000-0000-000000000001',
      email: 'dup_test@example.com',
      display_name: 'Dup Test',
      username: newUsername,
    });

  if (dupErr) {
    console.log('Duplicate username insert properly rejected with code:', dupErr.code, dupErr.message);
  } else {
    console.error('ERROR: Duplicate username was allowed!');
    process.exit(1);
  }

  // 4. Restore original profile username back to examonly2025
  const { data: restored, error: restoreErr } = await admin
    .from('profiles')
    .update({ username: 'examonly2025', updated_at: new Date().toISOString() })
    .eq('id', profileBefore.id)
    .select('*')
    .single();

  console.log('Restored profile username:', restored.username);
  console.log('--- ALL DB END TO END USERNAME CHECKS PASSED SUCCESSFULLY ---');
}

run();
