const { Client } = require('pg');

const host = '2406:da14:1d4f:7400:5c0e:c9d0:fd87:9e48';
const passwords = ['postgres', 'bqliwinxpgopiwerumpn', 'password', 'postgres123', 'admin', 'delt', 'delt123', 'delt-postgres'];

async function test() {
  for (const pw of passwords) {
    console.log(`Trying password: ${pw}...`);
    const client = new Client({
      host: host,
      port: 5432,
      user: 'postgres',
      password: pw,
      database: 'postgres',
      ssl: { rejectUnauthorized: false } // Supabase usually requires SSL
    });
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
