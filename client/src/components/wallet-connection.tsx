import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/use-wallet";
import { Wallet, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function WalletConnection() {
  const { isConnected, account, isCorrectNetwork, isLoading, connectWallet, switchNetwork } = useWallet();

  if (isLoading) {
    return <Skeleton className="h-10 w-32" />;
  }

  if (!isConnected) {
    return (
      <Button 
        onClick={connectWallet}
        className="bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:from-purple-700 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all duration-200"
      >
        <Wallet className="mr-2" size={16} />
        <span className="hidden sm:inline">Connect Wallet</span>
        <span className="sm:hidden">Connect</span>
      </Button>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <Button 
        onClick={switchNetwork}
        variant="destructive"
        className="shadow-lg hover:shadow-xl transition-all duration-200"
      >
        <AlertCircle className="mr-2" size={16} />
        <span className="hidden sm:inline">Switch Network</span>
        <span className="sm:hidden">Switch</span>
      </Button>
    );
  }

  return (
    <Button 
      variant="outline"
      className="border-purple-200 text-purple-700 hover:bg-purple-50 shadow-lg hover:shadow-xl transition-all duration-200"
    >
      <i className="fab fa-ethereum mr-2"></i>
      <span className="hidden sm:inline">
        {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Connected'}
      </span>
      <span className="sm:hidden">Wallet</span>
    </Button>
  );
}
