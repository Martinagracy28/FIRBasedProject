// Simple migration script that adds users directly via the FirebaseStorage interface
import { FirebaseStorage } from './firebase-storage';

// Existing PostgreSQL data to migrate
const existingUsers = [
  {
    walletAddress: "0xb9b2d5b0de037f47680e3c827b1cd430c5cd514e",
    documentHashes: ["Qmbzo15a00000000000000000000000000000000000000"]
  },
  {
    walletAddress: "0xaa6370ede6f97097fde0b998b3e6382fa25b3495",
    documentHashes: ["Qm24jghm00000000000000000000000000000000000000"]
  }
];

async function migrateUsersToFirebase() {
  const storage = new FirebaseStorage();
  
  console.log('Starting user migration to Firebase...');
  
  try {
    for (const userData of existingUsers) {
      console.log(`Migrating user: ${userData.walletAddress}`);
      
      // Check if user already exists
      const existingUser = await storage.getUserByWallet(userData.walletAddress);
      if (existingUser) {
        console.log(`User ${userData.walletAddress} already exists, skipping...`);
        continue;
      }
      
      // Create user
      const user = await storage.createUser(userData);
      console.log(`✅ Created user: ${user.id} (${userData.walletAddress})`);
    }
    
    console.log('Migration completed successfully!');
    console.log(`Total users migrated: ${existingUsers.length}`);
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateUsersToFirebase()
    .then(() => {
      console.log('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

export { migrateUsersToFirebase };