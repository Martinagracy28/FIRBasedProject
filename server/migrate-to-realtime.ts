// Migration script to transfer data from PostgreSQL to Firebase Realtime Database
import { FirebaseRealtimeStorage } from './firebase-realtime-storage';

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

async function migrateUsersToRealtimeDB() {
  const storage = new FirebaseRealtimeStorage();
  
  console.log('Starting user migration to Firebase Realtime Database...');
  
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
    
    console.log('✅ Migration completed successfully!');
    console.log(`Total users processed: ${existingUsers.length}`);
    
    // Test the migrated data
    console.log('\nTesting migrated data...');
    const allUsers = await storage.getAllUsers();
    console.log(`Found ${allUsers.length} users in Firebase`);
    
    const pendingUsers = await storage.getPendingUsers();
    console.log(`Found ${pendingUsers.length} pending users`);
    
    const stats = await storage.getDashboardStats();
    console.log('Dashboard stats:', stats);
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateUsersToRealtimeDB()
    .then(() => {
      console.log('Migration script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

export { migrateUsersToRealtimeDB };