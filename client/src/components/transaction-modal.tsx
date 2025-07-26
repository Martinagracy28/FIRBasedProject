import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle, ExternalLink, Loader2 } from "lucide-react";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  txHash: string | null;
  error: string | null;
  title: string;
  description: string;
}

export default function TransactionModal({
  isOpen,
  onClose,
  isLoading,
  txHash,
  error,
  title,
  description,
}: TransactionModalProps) {
  const getExplorerUrl = (hash: string) => {
    // Ethereum Sepolia testnet explorer
    return `https://sepolia.etherscan.io/tx/${hash}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {isLoading && <Loader2 className="animate-spin text-purple-600" size={20} />}
            {txHash && !error && <CheckCircle className="text-green-600" size={20} />}
            {error && <AlertTriangle className="text-red-600" size={20} />}
            <span>{title}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600">{description}</p>
          
          {isLoading && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Processing transaction...</span>
                <span className="text-purple-600">Please wait</span>
              </div>
              <Progress value={33} className="h-2" />
              <p className="text-xs text-gray-500">
                Please confirm the transaction in MetaMask and wait for blockchain confirmation.
              </p>
            </div>
          )}
          
          {txHash && !error && (
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="text-green-600" size={16} />
                  <span className="text-sm font-medium text-green-800">Transaction Successful</span>
                </div>
                <div className="text-xs text-green-700 font-mono break-all">
                  {txHash}
                </div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => window.open(getExplorerUrl(txHash), '_blank')}
              >
                <ExternalLink className="mr-2" size={14} />
                View on Etherscan
              </Button>
            </div>
          )}
          
          {error && (
            <div className="space-y-3">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="text-red-600" size={16} />
                  <span className="text-sm font-medium text-red-800">Transaction Failed</span>
                </div>
                <div className="text-xs text-red-700">
                  {error}
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              {txHash || error ? 'Close' : 'Cancel'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}