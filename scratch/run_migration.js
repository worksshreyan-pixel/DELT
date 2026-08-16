const { Client } = require('pg');

const databaseUrl = 'postgresql://postgres:postgres@127.0.0.1:5432/postgres';

async function run() {
  const client = new Client({ connectionString: databaseUrl });
  try {
    console.log('Connecting to local Postgres...');
    await client.connect();
    console.log('Running migration on local Postgres...');
    await client.query('ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "preview_enabled" boolean DEFAULT false NOT NULL;');
    console.log('Migration completed successfully on local Postgres!');
    await client.end();
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

run();
