// Test officer creation process
import { FirebaseRealtimeStorage } from './firebase-realtime-storage';

async function testOfficerCreation() {
  const storage = new FirebaseRealtimeStorage();
  
  console.log('Testing officer creation process...');
  
  try {
    // Test 1: Verify admin user exists and has correct role
    const adminWallet = "0x14e39d2c321970a68d239307addbd5249b9fa80d";
    const adminUser = await storage.getUserByWallet(adminWallet);
    
    if (!adminUser) {
      throw new Error('Admin user not found');
    }
    
    console.log(`✅ Admin user found: ${adminUser.id} with role: ${adminUser.role}`);
    
    if (adminUser.role !== 'admin') {
      throw new Error(`Expected admin role, got: ${adminUser.role}`);
    }
    
    // Test 2: Create a test officer
    const testOfficerData = {
      name: "Officer John Smith",
      phone: "+1-555-0123",
      walletAddress: "0x1234567890123456789012345678901234567890",
      badgeNumber: "BADGE001",
      department: "Cyber Crime Division"
    };
    
    console.log('Creating test officer with data:', testOfficerData);
    
    // First create user account for the officer
    const userData = {
      walletAddress: testOfficerData.walletAddress,
      documentHashes: []
    };
    
    const user = await storage.createUser(userData);
    console.log(`✅ Created user account: ${user.id}`);
    
    // Verify the user and set role to officer
    await storage.updateUserStatus(user.id, 'verified');
    console.log(`✅ Verified user account`);
    
    // Create officer record
    const officerRecord = {
      userId: user.id,
      name: testOfficerData.name,
      phone: testOfficerData.phone,
      walletAddress: testOfficerData.walletAddress,
      badgeNumber: testOfficerData.badgeNumber,
      department: testOfficerData.department
    };
    
    const officer = await storage.createOfficer(officerRecord);
    console.log(`✅ Created officer: ${officer.id}`);
    
    // Test 3: Verify officer can be retrieved
    const retrievedOfficer = await storage.getOfficer(officer.id);
    if (!retrievedOfficer) {
      throw new Error('Failed to retrieve created officer');
    }
    
    console.log(`✅ Officer retrieved successfully:`, {
      id: retrievedOfficer.id,
      name: retrievedOfficer.name,
      phone: retrievedOfficer.phone,
      badgeNumber: retrievedOfficer.badgeNumber,
      department: retrievedOfficer.department
    });
    
    // Test 4: Check if officer appears in all officers list
    const allOfficers = await storage.getAllOfficers();
    const foundOfficer = allOfficers.find(o => o.id === officer.id);
    
    if (!foundOfficer) {
      throw new Error('Officer not found in all officers list');
    }
    
    console.log(`✅ Officer found in officers list (${allOfficers.length} total officers)`);
    
    // Test 5: Check updated dashboard stats
    const stats = await storage.getDashboardStats();
    console.log(`✅ Dashboard stats updated:`, stats);
    
    console.log('\n🎉 All officer creation tests passed successfully!');
    console.log('\nTest Results:');
    console.log(`- Admin user verified: ${adminUser.role === 'admin' ? 'PASS' : 'FAIL'}`);
    console.log(`- User account created: PASS`);
    console.log(`- Officer record created: PASS`);
    console.log(`- Officer retrieval: PASS`);
    console.log(`- Officers list updated: PASS`);
    console.log(`- Dashboard stats: ${stats.activeOfficers} active officers`);
    
  } catch (error) {
    console.error('❌ Officer creation test failed:', error);
    throw error;
  }
}

// Run test if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testOfficerCreation()
    .then(() => {
      console.log('Officer creation test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Officer creation test failed:', error);
      process.exit(1);
    });
}

export { testOfficerCreation };