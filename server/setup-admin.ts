// Setup admin user for testing officer management
import { FirebaseRealtimeStorage } from './firebase-realtime-storage';
import { ref, update } from 'firebase/database';
import { db } from './firebase-config';

async function setupAdminUser() {
  const storage = new FirebaseRealtimeStorage();
  
  console.log('Setting up admin user...');
  
  try {
    // Create admin user - using a wallet address you can test with
    const adminWalletAddress = "0x14e39d2c321970a68d239307addbd5249b9fa80d"; // Change this to your wallet address
    
    // Check if admin already exists
    const existingAdmin = await storage.getUserByWallet(adminWalletAddress);
    if (existingAdmin) {
      console.log('Admin user already exists, updating role...');
      
      // Update role to admin
      const userRef = ref(db, `users/${existingAdmin.id}`);
      await update(userRef, { 
        role: 'admin',
        status: 'verified'
      });
      
      console.log(`✅ Updated user ${existingAdmin.id} to admin role`);
    } else {
      // Create new admin user
      const adminUser = await storage.createUser({
        walletAddress: adminWalletAddress,
        documentHashes: []
      });
      
      // Set as admin and verified
      const userRef = ref(db, `users/${adminUser.id}`);
      await update(userRef, { 
        role: 'admin',
        status: 'verified'
      });
      
      console.log(`✅ Created new admin user: ${adminUser.id} (${adminWalletAddress})`);
    }
    
    console.log('✅ Admin setup complete!');
    console.log(`Admin wallet address: ${adminWalletAddress}`);
    console.log('You can now log in with this wallet to manage officers.');
    
  } catch (error) {
    console.error('❌ Admin setup failed:', error);
    throw error;
  }
}

// Run setup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupAdminUser()
    .then(() => {
      console.log('Admin setup script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Admin setup script failed:', error);
      process.exit(1);
    });
}

export { setupAdminUser };