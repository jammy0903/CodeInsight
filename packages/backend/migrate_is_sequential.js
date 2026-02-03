/**
 * Add isSequential column to languages table
 */

const { Pool } = require('pg');
require('dotenv/config');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://codeinsight:codeinsight123@localhost:5432/codeinsight'
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('🔧 Adding isSequential column...');

    // Add column
    await client.query(`
      ALTER TABLE languages
      ADD COLUMN IF NOT EXISTS is_sequential BOOLEAN DEFAULT TRUE NOT NULL;
    `);
    console.log('  ✅ Column added');

    // Set python-practical to false
    const result = await client.query(`
      UPDATE languages
      SET is_sequential = FALSE
      WHERE id = 'python-practical'
      RETURNING id, name, is_sequential;
    `);

    if (result.rowCount > 0) {
      console.log('  ✅ Updated python-practical:', result.rows[0]);
    } else {
      console.log('  ⚠️  python-practical not found (will be set when seed runs)');
    }

    console.log('\n✅ Migration complete!');
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
