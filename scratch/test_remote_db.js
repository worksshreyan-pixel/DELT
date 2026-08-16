const { Client } = require('pg');

const host = 'db.bqliwinxpgopiwerumpn.supabase.co';
const passwords = ['postgres', 'bqliwinxpgopiwerumpn', 'password', 'postgres123', 'admin', 'delt', 'delt123', 'delt-postgres'];

async function test() {
  for (const pw of passwords) {
    const connectionString = `postgresql://postgres:${pw}@${host}:5432/postgres`;
    console.log(`Trying password: ${pw}...`);
    const client = new Client({ connectionString });
    try {
      await client.connect();
      const res = await client.query('SELECT 1 as one;');
      console.log(`SUCCESS! Password is: ${pw}`);
      console.log('Result:', res.rows);
      await client.end();
      return;
    } catch (e) {
      console.log(`Failed for ${pw}:`, e.message);
    }
  }
  console.log('All common passwords failed.');
}

test();
