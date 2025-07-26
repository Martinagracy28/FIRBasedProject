// Test Firebase Realtime Database connectivity
import { ref, get, set } from 'firebase/database';
import { db } from './firebase-config';

async function testRealtimeDatabase() {
  try {
    console.log('Testing Firebase Realtime Database connection...');
    
    // Test write operation
    const testRef = ref(db, 'test/connection');
    await set(testRef, {
      timestamp: Date.now(),
      message: 'Connection test successful'
    });
    console.log('✅ Write operation successful');
    
    // Test read operation
    const snapshot = await get(testRef);
    if (snapshot.exists()) {
      console.log('✅ Read operation successful');
      console.log('Data:', snapshot.val());
    }
    
    console.log('✅ Firebase Realtime Database is working perfectly!');
    return true;
    
  } catch (error) {
    console.error('❌ Firebase Realtime Database connection failed:', error);
    return false;
  }
}

// Run test if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testRealtimeDatabase()
    .then((success) => {
      process.exit(success ? 0 : 1);
    });
}

export { testRealtimeDatabase };