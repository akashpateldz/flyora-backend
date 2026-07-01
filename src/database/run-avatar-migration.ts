import { query } from '../services/db.service';

async function runMigration() {
  console.log('Starting avatar migration...');
  try {
    console.log('Altering profile_image_url column type to TEXT in users table...');
    await query(`
      ALTER TABLE users 
      ALTER COLUMN profile_image_url TYPE TEXT;
    `);
    console.log('Avatar migration completed successfully!');
  } catch (error) {
    console.error('Avatar migration failed:', error);
    process.exit(1);
  }
}

runMigration();
