const { Pool } = require('pg');
require('dotenv/config');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://codeinsight:codeinsight123@localhost:5432/codeinsight'
});

async function check() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT id, name, is_sequential
      FROM languages
      ORDER BY "order";
    `);

    console.log('\n📋 Languages:');
    console.table(result.rows);
  } finally {
    client.release();
    await pool.end();
  }
}

check();
