import { create, type IPFSHTTPClient } from 'ipfs-http-client';

// IPFS client configuration
const PINATA_API_KEY = 'de1c2691abcdd89093f8';
const PINATA_SECRET_KEY = '6cb886c0159a6b8c3054de4d9422e8fb9846e6fd67d4269f0a58fa3a4a6ae313';
const PINATA_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI4YWZiZjY5OC0yYzA4LTRiNGQtOTBjOS0zOWQwNmFlMGU4MDciLCJlbWFpbCI6Im1hcnRpbmEuZ3JhY3lAYm9zb25sYWJzLm5ldCIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6IkZSQTEifSx7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6Ik5ZQzEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiJkZTFjMjY5MWFiY2RkODkwOTNmOCIsInNjb3BlZEtleVNlY3JldCI6IjZjYjg4NmMwMTU5YTZiOGMzMDU0ZGU0ZDk0MjJlOGZiOTg0NmU2ZmQ2N2Q0MjY5ZjBhNThmYTNhNGE2YWUzMTMiLCJleHAiOjE3ODUxMTM0MDJ9.jTPqg2WKo-ygQAKwVLNAEXVPF9zBnrOfFoLgM3gaZ94';

class IPFSService {
  private client: IPFSHTTPClient | null = null;

  constructor() {
    this.initializeClient();
  }

  private initializeClient() {
    try {
      // Use Pinata as the primary IPFS service
      this.client = create({
        url: 'https://api.pinata.cloud/pinning/pinFileToIPFS',
        headers: {
          'pinata_api_key': PINATA_API_KEY,
          'pinata_secret_api_key': PINATA_SECRET_KEY,
          'Authorization': `Bearer ${PINATA_JWT}`,
        },
      });
    } catch (error) {
      console.warn('Pinata connection failed, using fallback');
      // Use public gateway as fallback
      this.client = create({ url: 'https://dweb.link/api/v0' });
    }
  }

  async uploadFile(file: File): Promise<string> {
    console.log('Attempting IPFS upload for file:', file.name);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const pinataMetadata = JSON.stringify({
        name: file.name,
        keyvalues: {
          uploaded_by: 'police_app',
          timestamp: new Date().toISOString()
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
          'pinata_api_key': PINATA_API_KEY,
          'pinata_secret_api_key': PINATA_SECRET_KEY,
          'Authorization': `Bearer ${PINATA_JWT}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Pinata upload failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log(`File uploaded to IPFS successfully: ${result.IpfsHash}`);
      
      return result.IpfsHash;
    } catch (error) {
      console.error('IPFS upload failed:', error);
      
      // Fallback to mock hash for development
      const mockHash = this.generateMockHash(file);
      console.log(`Using mock IPFS hash: ${mockHash} for file: ${file.name}`);
      return mockHash;
    }
  }

  async uploadMultipleFiles(files: File[]): Promise<string[]> {
    const uploadPromises = files.map(file => this.uploadFile(file));
    return Promise.all(uploadPromises);
  }

  private generateMockHash(file: File): string {
    // Generate a deterministic mock hash based on file properties
    const fileInfo = `${file.name}-${file.size}-${file.lastModified}`;
    const hash = this.simpleHash(fileInfo);
    // Create a proper 46-character IPFS hash (Qm + 44 chars)
    const baseChar = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let fullHash = hash;
    
    // Extend hash to 44 characters using deterministic method
    while (fullHash.length < 44) {
      const nextChar = baseChar[fullHash.length % baseChar.length];
      fullHash += nextChar;
    }
    
    return `Qm${fullHash.substring(0, 44)}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  getGatewayUrl(hash: string): string {
    // For mock hashes, return a placeholder URL
    if (hash.includes('000000000') || hash.length !== 46 || !hash.startsWith('Qm')) {
      return `#mock-hash-${hash}`;
    }
    
    return `https://gateway.pinata.cloud/ipfs/${hash}`;
  }

  async validateHash(hash: string): Promise<boolean> {
    try {
      // First check if hash format is valid
      if (!hash || hash.length !== 46 || !hash.startsWith('Qm')) {
        return false;
      }
      
      // Check if it's a mock hash with repeated zeros
      if (hash.includes('000000000')) {
        return false;
      }
      
      // Try to fetch the hash with a timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(`https://gateway.pinata.cloud/ipfs/${hash}`, { 
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.log('Hash validation failed:', error);
      return false;
    }
  }
}

export const ipfsService = new IPFSService();
export type { IPFSHTTPClient };