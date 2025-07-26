import { useState } from 'react';
import { web3Service } from '@/lib/web3';
import { useToast } from '@/hooks/use-toast';

interface TransactionState {
  isLoading: boolean;
  txHash: string | null;
  error: string | null;
}

export function useBlockchain() {
  const [transactionState, setTransactionState] = useState<TransactionState>({
    isLoading: false,
    txHash: null,
    error: null,
  });
  const { toast } = useToast();

  const executeTransaction = async (
    operation: () => Promise<string>,
    successMessage: string = "Transaction successful"
  ) => {
    setTransactionState({ isLoading: true, txHash: null, error: null });

    try {
      const txHash = await operation();
      
      setTransactionState({ isLoading: false, txHash, error: null });
      
      toast({
        title: "Transaction Confirmed",
        description: `${successMessage}\nTx: ${txHash.slice(0, 10)}...`,
      });

      return txHash;
    } catch (error: any) {
      const errorMessage = error.message || "Transaction failed";
      setTransactionState({ isLoading: false, txHash: null, error: errorMessage });
      
      toast({
        title: "Transaction Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error;
    }
  };

  const signMessage = async (message: string): Promise<string> => {
    try {
      const signature = await web3Service.signMessage(message);
      
      toast({
        title: "Message Signed",
        description: "Successfully signed the message",
      });
      
      return signature;
    } catch (error: any) {
      toast({
        title: "Signing Failed",
        description: error.message || "Failed to sign message",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Mock smart contract interactions
  const registerUser = async (userData: any): Promise<string> => {
    return executeTransaction(
      async () => {
        // Simulate blockchain delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        return `0x${Math.random().toString(16).substr(2, 64)}`;
      },
      "User registration submitted to blockchain"
    );
  };

  const verifyUser = async (userAddress: string, isApproved: boolean): Promise<string> => {
    return executeTransaction(
      async () => {
        // Simulate blockchain delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        return `0x${Math.random().toString(16).substr(2, 64)}`;
      },
      `User ${isApproved ? 'approved' : 'rejected'} on blockchain`
    );
  };

  const fileFIR = async (firData: any): Promise<string> => {
    return executeTransaction(
      async () => {
        // Simulate blockchain delay
        await new Promise(resolve => setTimeout(resolve, 3000));
        return `0x${Math.random().toString(16).substr(2, 64)}`;
      },
      "FIR filed and recorded on blockchain"
    );
  };

  const updateFIRStatus = async (firId: string, newStatus: string): Promise<string> => {
    return executeTransaction(
      async () => {
        // Simulate blockchain delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        return `0x${Math.random().toString(16).substr(2, 64)}`;
      },
      `FIR status updated to ${newStatus}`
    );
  };

  const assignOfficer = async (firId: string, officerAddress: string): Promise<string> => {
    return executeTransaction(
      async () => {
        // Simulate blockchain delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        return `0x${Math.random().toString(16).substr(2, 64)}`;
      },
      "Officer assigned to FIR on blockchain"
    );
  };

  return {
    transactionState,
    signMessage,
    registerUser,
    verifyUser,
    fileFIR,
    updateFIRStatus,
    assignOfficer,
  };
}
