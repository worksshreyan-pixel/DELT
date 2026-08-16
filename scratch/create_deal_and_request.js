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

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  try {
    console.log('Listing auth users...');
    const { data: usersData, error: usersErr } = await admin.auth.admin.listUsers();
    if (usersErr) throw usersErr;

    const users = usersData.users;
    if (!users || users.length === 0) {
      console.log('No auth users found! We need to create one.');
      // Create user
      const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
        email: 'creator-test@example.com',
        password: 'password123',
        email_confirm: true
      });
      if (createErr) throw createErr;
      console.log('Created user:', newUser.user.id);
      users.push(newUser.user);
    }

    const creatorId = users[0].id;
    const email = 'test-client@example.com';
    const token = 'test-token-123';

    console.log('Upserting mock profile for creator:', creatorId);
    const { error: profileErr } = await admin.from('profiles').upsert({
      id: creatorId,
      email: users[0].email,
      display_name: 'Test Creator'
    });
    if (profileErr) throw profileErr;

    console.log('Upserting mock deal...');
    const { data: deal, error: dealErr } = await admin.from('deals').upsert({
      id: '00000000-0000-0000-0000-000000000002',
      creator_id: creatorId,
      token: token,
      client_email: email,
      client_name: 'Test Client',
      title: 'Test Project',
      price: 1000,
      status: 'in_progress',
      payment_status: 'pending'
    }).select().single();
    if (dealErr) throw dealErr;

    console.log('Successfully created deal:', deal.id);

    console.log('Attempting to insert OTP...');
    const { data: otp, error: otpErr } = await admin.from('deal_otps').insert({
      deal_id: deal.id,
      email: email,
      otp_hash: 'mock_hash',
      attempts: 0,
      verified: false,
      expires_at: new Date(Date.now() + 600000).toISOString()
    }).select();

    if (otpErr) {
      console.error('Insert OTP failed:', otpErr);
    } else {
      console.log('Insert OTP succeeded:', otp);
    }
  } catch (err) {
    console.error('Error in script:', err);
  }
}

run();
