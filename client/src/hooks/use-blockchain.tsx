import { useState, useCallback } from 'react';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contract-abi';
import { useWallet } from './use-wallet';

export interface BlockchainTransactionStatus {
  isLoading: boolean;
  txHash: string | null;
  error: string | null;
  success: boolean;
}

export function useBlockchain() {
  const { account, isConnected } = useWallet();
  const [txStatus, setTxStatus] = useState<BlockchainTransactionStatus>({
    isLoading: false,
    txHash: null,
    error: null,
    success: false,
  });

  // Convert IPFS hash to bytes32 format
  const ipfsHashToBytes32 = useCallback((ipfsHash: string): string => {
    // For IPFS hashes, we need to properly convert to bytes32
    // Method 1: Use keccak256 hash of the IPFS hash string
    try {
      // Import ethers dynamically
      const encoder = new TextEncoder();
      const data = encoder.encode(ipfsHash);
      
      // Create a proper 32-byte hash by taking first 32 bytes and padding if needed
      const bytes = new Uint8Array(32);
      for (let i = 0; i < Math.min(data.length, 32); i++) {
        bytes[i] = data[i];
      }
      
      const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
      return '0x' + hex;
    } catch (error) {
      console.error('Error converting IPFS hash to bytes32:', error);
      // Fallback: create a simple hash
      const encoder = new TextEncoder();
      const data = encoder.encode(ipfsHash);
      const bytes = new Uint8Array(32);
      
      // Fill first bytes with hash data, rest with zeros
      for (let i = 0; i < Math.min(data.length, 32); i++) {
        bytes[i] = data[i];
      }
      
      const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
      return '0x' + hex;
    }
  }, []);

  // Call requestRegistration on the smart contract
  const requestRegistration = useCallback(async (documentHashes: string[]): Promise<string | null> => {
    if (!isConnected || !account || !window.ethereum) {
      throw new Error('Wallet not connected');
    }

    setTxStatus({
      isLoading: true,
      txHash: null,
      error: null,
      success: false,
    });

    try {
      // Import ethers dynamically to avoid build issues
      const { ethers } = await import('ethers');
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      // Convert IPFS hashes to bytes32 format
      const bytes32Hashes = documentHashes.map(hash => {
        const converted = ipfsHashToBytes32(hash);
        console.log(`Converting ${hash} to ${converted}`);
        return converted;
      });

      console.log('Calling requestRegistration with:', {
        documentHashes,
        bytes32Hashes,
        contractAddress: CONTRACT_ADDRESS
      });

      // Call the smart contract function
      const tx = await contract.requestRegistration(bytes32Hashes);
      
      setTxStatus(prev => ({
        ...prev,
        txHash: tx.hash,
      }));

      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        setTxStatus({
          isLoading: false,
          txHash: tx.hash,
          error: null,
          success: true,
        });
        return tx.hash;
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error: any) {
      console.error('Blockchain transaction error:', error);
      let errorMessage = 'Transaction failed';
      
      if (error.code === 'ACTION_REJECTED') {
        errorMessage = 'Transaction rejected by user';
      } else if (error.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for gas';
      } else if (error.message?.includes('user rejected')) {
        errorMessage = 'Transaction rejected by user';
      } else if (error.reason) {
        errorMessage = error.reason;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setTxStatus({
        isLoading: false,
        txHash: null,
        error: errorMessage,
        success: false,
      });
      
      throw new Error(errorMessage);
    }
  }, [isConnected, account, ipfsHashToBytes32]);

  // Reset transaction status
  const resetTxStatus = useCallback(() => {
    setTxStatus({
      isLoading: false,
      txHash: null,
      error: null,
      success: false,
    });
  }, []);

  return {
    requestRegistration,
    txStatus,
    resetTxStatus,
    ipfsHashToBytes32,
  };
}