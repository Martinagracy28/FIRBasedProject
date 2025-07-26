import { storage } from './storage';

async function fixOfficerRole() {
  try {
    // Get the user that should be an officer
    const userId = 'mdkfvam60npo7kk9xjy';
    const user = await storage.getUser(userId);
    
    if (user) {
      console.log('Current user role:', user.role);
      
      // Update the role directly to officer
      await storage.updateUserStatus(userId, 'verified', 'admin');
      
      console.log('User role updated to officer');
    } else {
      console.log('User not found');
    }
  } catch (error) {
    console.error('Error fixing officer role:', error);
  }
}

fixOfficerRole();