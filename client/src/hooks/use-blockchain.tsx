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

  // Call fileFIR on the smart contract
  const fileFIR = useCallback(async (firData: {
    complainantName: string;
    complainantContact: string;
    incidentType: string;
    incidentDate: Date;
    incidentLocation: string;
    description: string;
    suspects: string[];
    victims: string[];
    witnesses: string[];
    evidenceHashes: string[];
  }): Promise<string | null> => {
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

      // Convert incident date to Unix timestamp
      const incidentDateTime = Math.floor(firData.incidentDate.getTime() / 1000);

      // Convert evidence IPFS hashes to bytes32 format
      const evidenceHashesBytes32 = firData.evidenceHashes.map(hash => ipfsHashToBytes32(hash));

      console.log('Filing FIR with data:', {
        complainantName: firData.complainantName,
        complainantContact: firData.complainantContact,
        incidentType: firData.incidentType,
        incidentDateTime,
        incidentLocation: firData.incidentLocation,
        description: firData.description,
        suspects: firData.suspects,
        victims: firData.victims,
        witnesses: firData.witnesses,
        evidenceHashes: evidenceHashesBytes32
      });

      // Call the contract function
      const tx = await contract.fileFIR(
        firData.complainantName,
        firData.complainantContact,
        firData.incidentType,
        incidentDateTime,
        firData.incidentLocation,
        firData.description,
        firData.suspects,
        firData.victims,
        firData.witnesses,
        evidenceHashesBytes32
      );

      console.log('Transaction submitted:', tx.hash);

      setTxStatus({
        isLoading: true,
        txHash: tx.hash,
        error: null,
        success: false,
      });

      // Wait for transaction confirmation
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);

      setTxStatus({
        isLoading: false,
        txHash: tx.hash,
        error: null,
        success: true,
      });

      return tx.hash;

    } catch (error: any) {
      console.error('FIR filing error:', error);
      setTxStatus({
        isLoading: false,
        txHash: null,
        error: error.message || 'Failed to file FIR on blockchain',
        success: false,
      });
      throw error;
    }
  }, [isConnected, account, ipfsHashToBytes32]);

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

  // Placeholder functions for missing blockchain operations
  const registerUser = useCallback(async (userData: any): Promise<string> => {
    const result = await requestRegistration(userData.documentHashes || []);
    return result || '';
  }, [requestRegistration]);

  const updateFIRStatus = useCallback(async (firId: string, status: string): Promise<string> => {
    // Update FIR status on blockchain
    const statusHash = ipfsHashToBytes32(`${firId}_${status}_${Date.now()}`);
    const result = await requestRegistration([statusHash]);
    return result || '';
  }, [requestRegistration, ipfsHashToBytes32]);

  const assignOfficer = useCallback(async (firId: string, officerId: string): Promise<string> => {
    // Assign officer on blockchain
    const assignHash = ipfsHashToBytes32(`${firId}_officer_${officerId}_${Date.now()}`);
    const result = await requestRegistration([assignHash]);
    return result || '';
  }, [requestRegistration, ipfsHashToBytes32]);

  // Add officer to blockchain using the addOfficer smart contract function
  const addOfficerToBlockchain = useCallback(async (officerWalletAddress: string): Promise<string | null> => {
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

      // Call addOfficer function on the smart contract
      const tx = await contract.addOfficer(officerWalletAddress);
      
      setTxStatus({
        isLoading: true,
        txHash: tx.hash,
        error: null,
        success: false,
      });

      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      setTxStatus({
        isLoading: false,
        txHash: tx.hash,
        error: null,
        success: true,
      });

      console.log('Officer added to blockchain:', receipt);
      return tx.hash;
    } catch (error: any) {
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
  }, [isConnected, account]);

  // Verify user on blockchain using the verifyUser smart contract function
  const verifyUserOnBlockchain = useCallback(async (userAddress: string): Promise<string | null> => {
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

      console.log('Calling verifyUser with:', { userAddress, contractAddress: CONTRACT_ADDRESS });

      // Call verifyUser function on the smart contract
      const tx = await contract.verifyUser(userAddress);
      
      setTxStatus({
        isLoading: true,
        txHash: tx.hash,
        error: null,
        success: false,
      });

      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      setTxStatus({
        isLoading: false,
        txHash: tx.hash,
        error: null,
        success: true,
      });

      console.log('User verified on blockchain:', receipt);
      return tx.hash;
    } catch (error: any) {
      let errorMessage = 'Transaction failed';
      
      if (error.code === 4001 || error.code === 'ACTION_REJECTED') {
        errorMessage = 'Transaction rejected by user';
      } else if (error.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for gas';
      } else if (error.message?.includes('user rejected')) {
        errorMessage = 'Transaction rejected by user';
      } else if (error.message?.includes('Officers cannot self-register as users')) {
        errorMessage = 'Officers cannot self-register as users';
      } else if (error.reason) {
        errorMessage = error.reason;
      } else if (error.message) {
        errorMessage = error.message;
      }

      console.error('User verification blockchain error:', error);

      setTxStatus({
        isLoading: false,
        txHash: null,
        error: errorMessage,
        success: false,
      });
      
      throw new Error(errorMessage);
    }
  }, [isConnected, account]);

  // Assign officer to FIR on blockchain using assignOfficerToFIR function
  const assignOfficerToFIR = useCallback(async (firId: number, officerAddr: string): Promise<string | null> => {
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
      const { ethers } = await import('ethers');
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      console.log('Assigning officer to FIR:', { firId, officerAddr });
      
      const tx = await contract.assignOfficerToFIR(firId, officerAddr);
      
      setTxStatus(prev => ({
        ...prev,
        txHash: tx.hash,
      }));

      const receipt = await tx.wait();
      console.log('Officer assignment transaction confirmed:', receipt);

      setTxStatus({
        isLoading: false,
        txHash: tx.hash,
        error: null,
        success: true,
      });

      return tx.hash;
    } catch (error: any) {
      console.error('Error assigning officer to FIR:', error);
      let errorMessage = 'Failed to assign officer to FIR';
      
      if (error.code === 4001 || error.code === 'ACTION_REJECTED') {
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
      return null;
    }
  }, [isConnected, account]);

  return {
    requestRegistration,
    registerUser,
    verifyUserOnBlockchain,
    fileFIR,
    updateFIRStatus,
    assignOfficer,
    assignOfficerToFIR,
    addOfficerToBlockchain,
    transactionState: txStatus,
    resetTxStatus,
    ipfsHashToBytes32,
  };
}