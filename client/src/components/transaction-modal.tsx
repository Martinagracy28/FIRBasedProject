import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

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
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">{title}</DialogTitle>
        </DialogHeader>
        
        <div className="text-center py-6">
          {isLoading && (
            <>
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="text-white animate-spin" size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Processing Transaction</h3>
              <p className="text-gray-600 mb-6">
                {description}
              </p>
            </>
          )}
          
          {txHash && !error && (
            <>
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="text-white" size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Transaction Successful</h3>
              <p className="text-gray-600 mb-6">
                Your transaction has been confirmed on the blockchain.
              </p>
            </>
          )}
          
          {error && (
            <>
              <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="text-white" size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Transaction Failed</h3>
              <p className="text-gray-600 mb-6">
                {error}
              </p>
            </>
          )}
          
          {txHash && (
            <div className="bg-purple-50 rounded-lg p-4 mb-6 text-left">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Transaction Hash:</span>
              </div>
              <p className="font-mono text-purple-600 text-xs break-all mt-1">
                {txHash}
              </p>
            </div>
          )}
          
          <Button 
            onClick={onClose}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:from-purple-700 hover:to-pink-600"
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Close'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
