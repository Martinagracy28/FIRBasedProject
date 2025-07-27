
import { FirebaseRealtimeStorage } from './firebase-realtime-storage';
import { ipfsService } from '../client/src/lib/ipfs';
import fs from 'fs';
import path from 'path';

// Mock file content for existing hashes - you may need to adjust this based on your actual files
const createMockFile = (hash: string, fileName: string): File => {
  const content = `Mock document content for hash: ${hash}\nGenerated at: ${new Date().toISOString()}`;
  const blob = new Blob([content], { type: 'text/plain' });
  return new File([blob], fileName, { type: 'text/plain' });
};

async function migrateHashesToPinata() {
  const storage = new FirebaseRealtimeStorage();
  
  console.log('Starting migration of existing hashes to Pinata...');
  
  try {
    // Get all users with document hashes
    const allUsers = await storage.getAllUsers();
    let totalMigrated = 0;
    
    for (const user of allUsers) {
      if (user.documentHashes && user.documentHashes.length > 0) {
        console.log(`\nMigrating hashes for user: ${user.walletAddress}`);
        const newHashes: string[] = [];
        
        for (let i = 0; i < user.documentHashes.length; i++) {
          const oldHash = user.documentHashes[i];
          
          // Skip if already a real IPFS hash (starts with Qm and is 46 characters)
          if (oldHash.startsWith('Qm') && oldHash.length === 46 && !oldHash.includes('00000')) {
            console.log(`  Hash ${oldHash} appears to be real IPFS, keeping as is`);
            newHashes.push(oldHash);
            continue;
          }
          
          try {
            // Create a mock file for the hash
            const fileName = `document_${i + 1}_${user.walletAddress.slice(0, 8)}.txt`;
            const mockFile = createMockFile(oldHash, fileName);
            
            // Upload to Pinata
            console.log(`  Uploading mock file for hash: ${oldHash}`);
            const realHash = await uploadFileToPinata(mockFile);
            
            newHashes.push(realHash);
            console.log(`  ✅ Migrated ${oldHash} -> ${realHash}`);
            totalMigrated++;
            
            // Add delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
            
          } catch (error) {
            console.error(`  ❌ Failed to migrate hash ${oldHash}:`, error);
            // Keep the old hash if migration fails
            newHashes.push(oldHash);
          }
        }
        
        // Update user with new hashes if any were migrated
        if (newHashes.some((hash, index) => hash !== user.documentHashes![index])) {
          try {
            await storage.updateUserDocumentHashes(user.id, newHashes);
            console.log(`  Updated user ${user.walletAddress} with new hashes`);
          } catch (error) {
            console.error(`  Failed to update user ${user.walletAddress}:`, error);
          }
        }
      }
    }
    
    // Get all FIRs with evidence hashes
    const allFirs = await storage.getAllFirs();
    
    for (const fir of allFirs) {
      if (fir.evidenceHashes && fir.evidenceHashes.length > 0) {
        console.log(`\nMigrating evidence hashes for FIR: ${fir.firNumber}`);
        const newHashes: string[] = [];
        
        for (let i = 0; i < fir.evidenceHashes.length; i++) {
          const oldHash = fir.evidenceHashes[i];
          
          // Skip if already a real IPFS hash
          if (oldHash.startsWith('Qm') && oldHash.length === 46 && !oldHash.includes('00000')) {
            console.log(`  Hash ${oldHash} appears to be real IPFS, keeping as is`);
            newHashes.push(oldHash);
            continue;
          }
          
          try {
            // Create a mock evidence file
            const fileName = `evidence_${i + 1}_${fir.firNumber}.txt`;
            const mockFile = createMockFile(oldHash, fileName);
            
            // Upload to Pinata
            console.log(`  Uploading mock evidence for hash: ${oldHash}`);
            const realHash = await uploadFileToPinata(mockFile);
            
            newHashes.push(realHash);
            console.log(`  ✅ Migrated ${oldHash} -> ${realHash}`);
            totalMigrated++;
            
            // Add delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
            
          } catch (error) {
            console.error(`  ❌ Failed to migrate evidence hash ${oldHash}:`, error);
            // Keep the old hash if migration fails
            newHashes.push(oldHash);
          }
        }
        
        // Update FIR with new hashes if any were migrated
        if (newHashes.some((hash, index) => hash !== fir.evidenceHashes![index])) {
          try {
            await storage.updateFirEvidenceHashes(fir.id, newHashes);
            console.log(`  Updated FIR ${fir.firNumber} with new evidence hashes`);
          } catch (error) {
            console.error(`  Failed to update FIR ${fir.firNumber}:`, error);
          }
        }
      }
    }
    
    console.log(`\n🎉 Migration completed successfully!`);
    console.log(`Total hashes migrated to Pinata: ${totalMigrated}`);
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

async function uploadFileToPinata(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  
  const pinataMetadata = JSON.stringify({
    name: file.name,
    keyvalues: {
      uploaded_by: 'police_app_migration',
      timestamp: new Date().toISOString(),
      migration: 'true'
    }
  });
  formData.append('pinataMetadata', pinataMetadata);
  
  const pinataOptions = JSON.stringify({
    cidVersion: 0,
  });
  formData.append('pinataOptions', pinataOptions);
  
  const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: {
      'pinata_api_key': 'de1c2691abcdd89093f8',
      'pinata_secret_api_key': '6cb886c0159a6b8c3054de4d9422e8fb9846e6fd67d4269f0a58fa3a4a6ae313',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI4YWZiZjY5OC0yYzA4LTRiNGQtOTBjOS0zOWQwNmFlMGU4MDciLCJlbWFpbCI6Im1hcnRpbmEuZ3JhY3lAYm9zb25sYWJzLm5ldCIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6IkZSQTEifSx7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6Ik5ZQzEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiJkZTFjMjY5MWFiY2RkODkwOTNmOCIsInNjb3BlZEtleVNlY3JldCI6IjZjYjg4NmMwMTU5YTZiOGMzMDU0ZGU0ZDk0MjJlOGZiOTg0NmU2ZmQ2N2Q0MjY5ZjBhNThmYTNhNGE2YWUzMTMiLCJleHAiOjE3ODUxMTM0MDJ9.jTPqg2WKo-ygQAKwVLNAEXVPF9zBnrOfFoLgM3gaZ94',
    },
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error(`Pinata upload failed: ${response.statusText}`);
  }
  
  const result = await response.json();
  return result.IpfsHash;
}

// Run migration if called directly
if (require.main === module) {
  migrateHashesToPinata()
    .then(() => {
      console.log('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

export { migrateHashesToPinata };
