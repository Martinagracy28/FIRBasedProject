// Migration script to transfer data from PostgreSQL to Firebase
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase-config';

// Existing PostgreSQL data
const existingUsers = [
  {
    id: "6f45c90c-2c2d-4063-835d-3d15f2e033c7",
    walletAddress: "0xb9b2d5b0de037f47680e3c827b1cd430c5cd514e",
    role: "none",
    status: "pending",
    documentHashes: ["Qmbzo15a00000000000000000000000000000000000000"],
    createdAt: new Date("2025-07-26T11:08:23.936Z")
  },
  {
    id: "b6fd29f8-20bf-468a-acea-85e2c3894708", 
    walletAddress: "0xaa6370ede6f97097fde0b998b3e6382fa25b3495",
    role: "none",
    status: "pending", 
    documentHashes: ["Qm24jghm00000000000000000000000000000000000000"],
    createdAt: new Date("2025-07-26T11:09:47.311Z")
  }
];

export async function migrateDataToFirebase() {
  console.log('Starting migration to Firebase...');
  
  try {
    // Migrate users
    console.log('Migrating users...');
    for (const user of existingUsers) {
      await addDoc(collection(db, 'users'), {
        walletAddress: user.walletAddress,
        role: user.role,
        status: user.status,
        documentHashes: user.documentHashes,
        createdAt: user.createdAt,
        verifiedAt: null,
        verifiedBy: null
      });
      console.log(`Migrated user: ${user.walletAddress}`);
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
  migrateDataToFirebase()
    .then(() => {
      console.log('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}