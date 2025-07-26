import { SEPOLIA_CHAIN_ID } from './constants';

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (data: any) => void) => void;
      removeListener: (event: string, callback: (data: any) => void) => void;
    };
  }
}

export class Web3Service {
  private static instance: Web3Service;

  private constructor() {}

  static getInstance(): Web3Service {
    if (!Web3Service.instance) {
      Web3Service.instance = new Web3Service();
    }
    return Web3Service.instance;
  }

  async isMetaMaskInstalled(): Promise<boolean> {
    return typeof window.ethereum !== 'undefined' && Boolean(window.ethereum.isMetaMask);
  }

  async connectWallet(): Promise<string[]> {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      // Switch to Sepolia testnet
      await this.switchToSepolia();

      return accounts;
    } catch (error: any) {
      if (error.code === 4001) {
        throw new Error('User rejected the request');
      }
      throw new Error('Failed to connect wallet');
    }
  }

  async getAccounts(): Promise<string[]> {
    if (!window.ethereum) {
      return [];
    }

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_accounts',
      });
      return accounts;
    } catch (error) {
      console.error('Failed to get accounts:', error);
      return [];
    }
  }

  async switchToSepolia(): Promise<void> {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      });
    } catch (switchError: any) {
      // Chain doesn't exist, add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: SEPOLIA_CHAIN_ID,
                chainName: 'Sepolia Testnet',
                nativeCurrency: {
                  name: 'ETH',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: ['https://sepolia.infura.io/v3/'],
                blockExplorerUrls: ['https://sepolia.etherscan.io/'],
              },
            ],
          });
        } catch (addError) {
          throw new Error('Failed to add Sepolia network');
        }
      } else {
        throw new Error('Failed to switch to Sepolia network');
      }
    }
  }

  async getCurrentNetwork(): Promise<string> {
    if (!window.ethereum) {
      return '';
    }

    try {
      const chainId = await window.ethereum.request({
        method: 'eth_chainId',
      });
      return chainId;
    } catch (error) {
      console.error('Failed to get network:', error);
      return '';
    }
  }

  async signMessage(message: string): Promise<string> {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }

    const accounts = await this.getAccounts();
    if (accounts.length === 0) {
      throw new Error('No accounts connected');
    }

    try {
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, accounts[0]],
      });
      return signature;
    } catch (error) {
      throw new Error('Failed to sign message');
    }
  }

  // Mock blockchain transaction - in real implementation, this would interact with smart contracts
  async sendTransaction(to: string, data: string): Promise<string> {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }

    const accounts = await this.getAccounts();
    if (accounts.length === 0) {
      throw new Error('No accounts connected');
    }

    try {
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: accounts[0],
            to,
            data,
            gas: '0x76c0', // 30400
            gasPrice: '0x9184e72a000', // 10000000000000
          },
        ],
      });
      return txHash;
    } catch (error) {
      throw new Error('Transaction failed');
    }
  }

  onAccountsChanged(callback: (accounts: string[]) => void): void {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', callback);
    }
  }

  onChainChanged(callback: (chainId: string) => void): void {
    if (window.ethereum) {
      window.ethereum.on('chainChanged', callback);
    }
  }

  removeAllListeners(): void {
    if (window.ethereum) {
      window.ethereum.removeListener('accountsChanged', () => {});
      window.ethereum.removeListener('chainChanged', () => {});
    }
  }
}

export const web3Service = Web3Service.getInstance();
