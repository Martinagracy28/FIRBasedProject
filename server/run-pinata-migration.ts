
import { migrateHashesToPinata } from './migrate-hashes-to-pinata';

console.log('🚀 Starting Pinata migration...');
console.log('This will upload all existing mock hashes to Pinata and update the database');
console.log('Please ensure your Pinata credentials are correct and you have sufficient storage quota');

migrateHashesToPinata()
  .then(() => {
    console.log('✅ Migration completed successfully!');
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
  });
