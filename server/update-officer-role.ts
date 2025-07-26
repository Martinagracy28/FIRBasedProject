import { ref, update } from 'firebase/database';
import { db } from './firebase-config';

async function updateOfficerRole() {
  try {
    console.log('Updating officer role...');
    
    const userRef = ref(db, 'users/mdkfvam60npo7kk9xjy');
    await update(userRef, {
      role: 'officer'
    });
    
    console.log('Successfully updated user role to officer');
  } catch (error) {
    console.error('Error updating role:', error);
  }
}

updateOfficerRole();