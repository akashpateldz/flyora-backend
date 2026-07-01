import { query } from '../services/db.service';

async function runMigration() {
  console.log('Starting migration...');
  try {
    // 1. Add wallet_balance to users table
    console.log('Adding wallet_balance column to users table...');
    await query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC(12,2) NOT NULL DEFAULT 5000.00;
    `);

    // 2. Create wallet_transactions table
    console.log('Creating wallet_transactions table...');
    await query(`
      CREATE TABLE IF NOT EXISTS wallet_transactions (
        id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id     UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount      NUMERIC(12,2)   NOT NULL,
        type        VARCHAR(20)     NOT NULL, -- 'credit' or 'debit'
        description VARCHAR(255)    NOT NULL,
        created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
      );
    `);

    // 3. Create index for transactions
    console.log('Creating index on wallet_transactions...');
    await query(`
      CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON wallet_transactions(user_id);
    `);

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
