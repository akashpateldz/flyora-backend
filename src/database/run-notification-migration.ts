import { query } from '../services/db.service';

async function runMigration() {
  console.log('Starting notification migration...');
  try {
    // 1. Create notifications table
    console.log('Creating notifications table...');
    await query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id     UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title       VARCHAR(150)    NOT NULL,
        message     TEXT            NOT NULL,
        type        VARCHAR(50)     NOT NULL, -- 'system', 'match', 'wallet', 'kyc'
        is_read     BOOLEAN         NOT NULL DEFAULT FALSE,
        created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
      );
    `);

    // 2. Create index
    console.log('Creating index on notifications...');
    await query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
    `);

    // 3. Populate default notifications for existing users if empty
    console.log('Populating default notifications for existing users...');
    const usersRes = await query('SELECT id FROM users');
    for (const user of usersRes.rows) {
      // Check if user already has notifications
      const existing = await query('SELECT id FROM notifications WHERE user_id = $1 LIMIT 1', [user.id]);
      if (!existing.rowCount || existing.rowCount === 0) {
        await query(`
          INSERT INTO notifications (user_id, title, message, type, is_read)
          VALUES 
            ($1, 'Welcome to Flyora!', 'Thanks for joining Flyora Premium Luggage protection. Your account is active.', 'system', false),
            ($1, 'Starting Balance Credited', 'A sandbox starting balance of $5000.00 has been credited to your escrow wallet.', 'wallet', false),
            ($1, 'KYC Pre-approval', 'Your identity check status has been set to Level 1 Verified. Instant payouts enabled.', 'kyc', false)
        `, [user.id]);
      }
    }

    console.log('Notification migration completed successfully!');
  } catch (error) {
    console.error('Notification migration failed:', error);
    process.exit(1);
  }
}

runMigration();
