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
  const { data, error } = await supabase.from('deals').select('id, deal_code');
  if (error) {
    console.error('Error:', error);
  } else {
    const missing = data.filter(d => !d.deal_code);
    console.log(`Total deals: ${data.length}, Missing deal_code: ${missing.length}`);
    if (missing.length > 0) {
      console.log('Generating deal_code for missing deals...');
      for (const deal of missing) {
        const code = `DLT-${deal.id.split('-')[0].toUpperCase()}`;
        await supabase.from('deals').update({ deal_code: code }).eq('id', deal.id);
      }
      console.log('Done generating deal_codes.');
    }
  }
}

check();
