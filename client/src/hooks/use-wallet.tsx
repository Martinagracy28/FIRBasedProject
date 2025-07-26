import React, { createContext, useContext, useEffect, useState } from 'react';
import { web3Service } from '@/lib/web3';
import { SEPOLIA_CHAIN_ID } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';

interface WalletContextType {
  isConnected: boolean;
  account: string | null;
  isCorrectNetwork: boolean;
  isLoading: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchNetwork: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const checkConnection = async () => {
    try {
      const accounts = await web3Service.getAccounts();
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setIsConnected(true);
        
        const chainId = await web3Service.getCurrentNetwork();
        console.log('Current chainId:', chainId, 'Expected:', SEPOLIA_CHAIN_ID);
        setIsCorrectNetwork(chainId === SEPOLIA_CHAIN_ID);
      } else {
        setAccount(null);
        setIsConnected(false);
        setIsCorrectNetwork(false);
      }
    } catch (error) {
      console.error('Failed to check wallet connection:', error);
      setAccount(null);
      setIsConnected(false);
      setIsCorrectNetwork(false);
    }
    setIsLoading(false);
  };

  const connectWallet = async () => {
    setIsLoading(true);
    try {
      const isInstalled = await web3Service.isMetaMaskInstalled();
      if (!isInstalled) {
        toast({
          title: "MetaMask Required",
          description: "Please install MetaMask to continue.",
          variant: "destructive",
        });
        return;
      }

      const accounts = await web3Service.connectWallet();
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setIsConnected(true);
        
        // Check network after connection
        const chainId = await web3Service.getCurrentNetwork();
        setIsCorrectNetwork(chainId === SEPOLIA_CHAIN_ID);
        
        toast({
          title: "Wallet Connected",
          description: `Connected to ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect wallet",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const disconnectWallet = () => {
    setAccount(null);
    setIsConnected(false);
    setIsCorrectNetwork(false);
    
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected.",
    });
  };

  const switchNetwork = async () => {
    try {
      await web3Service.switchToSepolia();
      setIsCorrectNetwork(true);
      
      toast({
        title: "Network Switched",
        description: "Successfully switched to Sepolia testnet.",
      });
    } catch (error: any) {
      toast({
        title: "Network Switch Failed",
        description: error.message || "Failed to switch network",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    checkConnection();

    // Set up event listeners
    web3Service.onAccountsChanged((accounts: string[]) => {
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setIsConnected(true);
      } else {
        setAccount(null);
        setIsConnected(false);
        setIsCorrectNetwork(false);
      }
    });

    web3Service.onChainChanged((chainId: string) => {
      setIsCorrectNetwork(chainId === SEPOLIA_CHAIN_ID);
      if (chainId !== SEPOLIA_CHAIN_ID) {
        toast({
          title: "Wrong Network",
          description: "Please switch to Sepolia testnet.",
          variant: "destructive",
        });
      }
    });

    return () => {
      web3Service.removeAllListeners();
    };
  }, [toast]);

  const value = {
    isConnected,
    account,
    isCorrectNetwork,
    isLoading,
    connectWallet,
    disconnectWallet,
    switchNetwork,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
