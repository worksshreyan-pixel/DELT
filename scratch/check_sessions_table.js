const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.trim().match(/^([^=]+)="?(.*?)"?$/);
  if (match) env[match[1]] = match[2];
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { error } = await supabase.from('client_access_sessions').select('id').limit(1);
  if (error) {
    console.log('client_access_sessions table does NOT exist:', error.message);
  } else {
    console.log('client_access_sessions table DOES exist.');
  }
}

check();
