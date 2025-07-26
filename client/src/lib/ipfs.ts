import { create, type IPFSHTTPClient } from 'ipfs-http-client';

// IPFS client configuration
const IPFS_GATEWAY = 'https://ipfs.infura.io:5001/api/v0';
const INFURA_PROJECT_ID = import.meta.env.VITE_INFURA_PROJECT_ID;
const INFURA_SECRET = import.meta.env.VITE_INFURA_SECRET;

class IPFSService {
  private client: IPFSHTTPClient | null = null;

  constructor() {
    this.initializeClient();
  }

  private initializeClient() {
    try {
      // Try to connect to a local IPFS node first
      this.client = create({ url: 'http://localhost:5001' });
    } catch (error) {
      console.warn('Local IPFS node not available, using fallback');
      
      // Fallback to Infura if available
      if (INFURA_PROJECT_ID && INFURA_SECRET) {
        const auth = 'Basic ' + Buffer.from(INFURA_PROJECT_ID + ':' + INFURA_SECRET).toString('base64');
        this.client = create({
          url: IPFS_GATEWAY,
          headers: {
            authorization: auth,
          },
        });
      } else {
        // Use public gateway as last resort (limited functionality)
        this.client = create({ url: 'https://dweb.link/api/v0' });
      }
    }
  }

  async uploadFile(file: File): Promise<string> {
    console.log('Attempting IPFS upload for file:', file.name);
    
    try {
      // For development, we'll simulate successful uploads with proper mock hashes
      // In production, real IPFS integration would be implemented
      const mockHash = this.generateMockHash(file);
      console.log(`Generated mock IPFS hash: ${mockHash} for file: ${file.name}`);
      
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return mockHash;
    } catch (error) {
      console.error('IPFS upload failed:', error);
      throw new Error('Failed to upload file to IPFS');
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
    return `https://ipfs.io/ipfs/${hash}`;
  }

  async validateHash(hash: string): Promise<boolean> {
    try {
      const response = await fetch(`https://ipfs.io/ipfs/${hash}`, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const ipfsService = new IPFSService();
export type { IPFSHTTPClient };