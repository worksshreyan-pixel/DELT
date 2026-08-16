const { Client } = require('pg');

async function test() {
  const connectionString = 'postgresql://postgres:postgres@127.0.0.1:5432/postgres';
  console.log('Connecting to local postgres...');
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Connected to local postgres!');
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `);
    console.log('Tables:', res.rows.map(r => r.table_name));
    await client.end();
  } catch (e) {
    console.error('Failed to connect to local postgres:', e.message);
  }
}

test();
