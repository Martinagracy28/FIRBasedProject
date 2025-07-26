import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/use-wallet";
import { Wallet, AlertCircle, Copy, LogOut } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

export default function WalletConnection() {
  const { isConnected, account, isCorrectNetwork, isLoading, connectWallet, disconnectWallet, switchNetwork } = useWallet();
  const { toast } = useToast();

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

  const copyAddress = async () => {
    if (account) {
      try {
        await navigator.clipboard.writeText(account);
        toast({
          title: "Address Copied",
          description: "Wallet address copied to clipboard",
        });
      } catch (error) {
        toast({
          title: "Copy Failed",
          description: "Failed to copy address to clipboard",
          variant: "destructive",
        });
      }
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline"
          className="border-purple-200 text-purple-700 hover:bg-purple-50 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Wallet className="mr-2" size={16} />
          <span className="hidden sm:inline">
            {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Connected'}
          </span>
          <span className="sm:hidden">Wallet</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5 text-sm">
          <div className="font-medium">Wallet Address</div>
          <div className="text-xs text-gray-500 font-mono mt-1">
            {account ? `${account.slice(0, 8)}...${account.slice(-8)}` : 'No address'}
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={copyAddress} className="cursor-pointer">
          <Copy className="mr-2" size={16} />
          Copy Address
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDisconnect} className="cursor-pointer text-red-600 focus:text-red-600">
          <LogOut className="mr-2" size={16} />
          Disconnect Wallet
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
