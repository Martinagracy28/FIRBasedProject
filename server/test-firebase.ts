// Simple Firebase connectivity test
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase-config';

async function testFirebaseConnection() {
  try {
    console.log('Testing Firebase connection...');
    
    // Try to access a simple collection
    const testCollection = collection(db, 'test');
    const snapshot = await getDocs(testCollection);
    
    console.log('✅ Firebase connection successful!');
    console.log(`Found ${snapshot.size} documents in test collection`);
    
    return true;
  } catch (error) {
    console.error('❌ Firebase connection failed:', error);
    return false;
  }
}

// Run test if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testFirebaseConnection()
    .then((success) => {
      process.exit(success ? 0 : 1);
    });
}

export { testFirebaseConnection };