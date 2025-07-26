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
    // For simplicity, we'll use the IPFS hash directly as a string
    // and let the smart contract handle the conversion
    // In a real implementation, you'd convert properly to bytes32
    const encoder = new TextEncoder();
    const data = encoder.encode(ipfsHash);
    const hex = Array.from(data, byte => byte.toString(16).padStart(2, '0')).join('');
    return '0x' + hex.padEnd(64, '0');
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
      const bytes32Hashes = documentHashes.map(hash => ipfsHashToBytes32(hash));

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