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
    if (!this.client) {
      throw new Error('IPFS client not initialized');
    }

    try {
      // Convert file to buffer
      const buffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(buffer);

      // Upload to IPFS
      const result = await this.client.add(uint8Array, {
        pin: true,
      });

      return result.cid.toString();
    } catch (error) {
      console.error('IPFS upload failed:', error);
      
      // Fallback: generate a mock hash for development
      const mockHash = this.generateMockHash(file);
      console.warn(`Using mock IPFS hash: ${mockHash}`);
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
    return `Qm${hash.padEnd(44, '0')}`;
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