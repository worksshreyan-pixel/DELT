const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.trim().match(/^([^=]+)="?(.*?)"?$/);
  if (match) env[match[1]] = match[2];
});

console.log('URL:', env.NEXT_PUBLIC_SUPABASE_URL);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase.from('deals').select('*').limit(1);
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Columns:', data.length > 0 ? Object.keys(data[0]) : 'No deals found');
    
    // Explicitly check for deal_code
    const { error: error2 } = await supabase.from('deals').select('deal_code').limit(1);
    if (error2) {
      console.log('deal_code column does NOT exist:', error2.message);
    } else {
      console.log('deal_code column DOES exist.');
    }
  }
}

check();
