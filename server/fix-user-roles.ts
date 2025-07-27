import { storage } from './storage';

const ADMIN_OFFICER_ADDRESS = '0x5388da14B5d292c2150Ec17C7769dD142F02517D';

async function fixUserRoles() {
  try {
    console.log('Starting user role fix...');

    // Get all users from Firebase
    const pendingUsers = await storage.getPendingUsers();
    const allUsers: any[] = [];

    // Get users data by checking each wallet address
    const commonAddresses = [
      '0x5388da14B5d292c2150Ec17C7769dD142F02517D',
      '0xb9b2d5b0de037f47680e3c827b1cd430c5cd514e',
      '0xaa6370ede6f97097fde0b998b3e6382fa25b3495',
      '0x8a0d0f49e27b1fbd3d7e65fbe9f2c11347f81e9e',
      '0x14e39d2c321970a68d239307addbd5249b9fa80d'
    ];

    console.log('Checking all users...');
    
    for (const address of commonAddresses) {
      try {
        const user = await storage.getUserByWallet(address);
        if (user) {
          allUsers.push(user);
          console.log(`Found user: ${user.walletAddress} - Role: ${user.role}`);
        }
      } catch (error) {
        // User might not exist, continue
      }
    }

    // Add pending users to the list
    pendingUsers.forEach(user => {
      if (!allUsers.find(u => u.walletAddress.toLowerCase() === user.walletAddress.toLowerCase())) {
        allUsers.push(user);
        console.log(`Found pending user: ${user.walletAddress} - Role: ${user.role}`);
      }
    });

    console.log(`\nTotal users found: ${allUsers.length}`);
    console.log('Admin/Officer address:', ADMIN_OFFICER_ADDRESS);

    // Update roles for all users except the admin
    for (const user of allUsers) {
      const isAdminOfficer = user.walletAddress.toLowerCase() === ADMIN_OFFICER_ADDRESS.toLowerCase();
      
      if (isAdminOfficer) {
        console.log(`Skipping admin/officer: ${user.walletAddress}`);
        continue;
      }

      // Check current role
      if (user.role !== 'user' && user.status === 'verified') {
        console.log(`Updating role for verified user: ${user.walletAddress} from '${user.role}' to 'user'`);
        
        // Update role directly in storage
        await storage.updateUserRole(user.id, 'user');
        console.log(`✅ Updated ${user.walletAddress} role to 'user'`);
      } else {
        console.log(`User ${user.walletAddress} already has correct role: ${user.role}`);
      }
    }

    console.log('\n✅ User role fix completed!');
    
  } catch (error) {
    console.error('Error fixing user roles:', error);
  }
}

// Run the fix
fixUserRoles().catch(console.error);