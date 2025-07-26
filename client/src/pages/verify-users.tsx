import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/use-wallet";
import { useBlockchain } from "@/hooks/use-blockchain";
import { apiRequest } from "@/lib/queryClient";
import { UserCheck, Eye, Check, X, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import TransactionModal from "@/components/transaction-modal";

export default function VerifyUsers() {
  const { account } = useWallet();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { verifyUser, transactionState } = useBlockchain();
  const [showTxModal, setShowTxModal] = useState(false);
  const [currentAction, setCurrentAction] = useState<string>("");

  const { data: user } = useQuery({
    queryKey: ['/api/users/me', account],
    enabled: !!account,
  });

  const { data: pendingUsers, isLoading } = useQuery({
    queryKey: ['/api/users/pending'],
    enabled: user?.role === 'officer' || user?.role === 'admin',
  });

  const verifyUserMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: 'verified' | 'rejected' }) => {
      // Update in our system
      const response = await apiRequest("PATCH", `/api/users/${userId}/status`, {
        status,
        verifiedBy: user?.id,
      });
      const updatedUser = await response.json();
      
      // Submit to blockchain
      setShowTxModal(true);
      setCurrentAction(status === 'verified' ? 'approving' : 'rejecting');
      const txHash = await verifyUser(updatedUser.walletAddress, status === 'verified');
      
      return { updatedUser, txHash };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/pending'] });
      toast({
        title: `User ${variables.status === 'verified' ? 'Approved' : 'Rejected'}`,
        description: `User has been ${variables.status} successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Verification Failed",
        description: error.message || "Failed to update user status",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setTimeout(() => setShowTxModal(false), 3000);
      setCurrentAction("");
    },
  });

  const handleVerifyUser = (userId: string, status: 'verified' | 'rejected') => {
    verifyUserMutation.mutate({ userId, status });
  };

  const viewDocuments = (documentHashes: string[]) => {
    toast({
      title: "View Documents",
      description: "Document viewing would integrate with IPFS gateway here",
    });
  };

  if (user?.role !== 'officer' && user?.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto mt-20">
        <Card className="shadow-xl border-purple-100 text-center p-8">
          <UserCheck className="mx-auto text-orange-500 mb-4" size={48} />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600">
            Only officers and administrators can access user verification.
          </p>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
          <UserCheck className="text-pink-500" size={32} />
          <span>User Verification Queue</span>
        </h2>
        <Badge variant="secondary" className="bg-orange-100 text-orange-700 px-3 py-1">
          {pendingUsers?.length || 0} Pending
        </Badge>
      </div>

      {!pendingUsers || pendingUsers.length === 0 ? (
        <Card className="shadow-xl border-purple-100">
          <CardContent className="text-center py-16">
            <UserCheck className="mx-auto text-gray-400 mb-4" size={64} />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Pending Verifications</h3>
            <p className="text-gray-600">All user registrations have been processed.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingUsers.map((pendingUser: any) => (
            <Card key={pendingUser.id} className="shadow-lg border-purple-200 hover:shadow-xl transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-500 rounded-full flex items-center justify-center">
                      <UserCheck className="text-white" size={20} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {pendingUser.walletAddress.substring(0, 8)}...{pendingUser.walletAddress.substring(pendingUser.walletAddress.length - 6)}
                      </h4>
                      <p className="text-sm text-gray-600 font-mono">{pendingUser.walletAddress}</p>
                      <p className="text-xs text-gray-500 flex items-center space-x-1">
                        <Clock size={12} />
                        <span>Submitted: {new Date(pendingUser.createdAt).toLocaleString()}</span>
                      </p>
                      <p className="text-xs text-gray-500 flex items-center space-x-1">
                        <FileText size={12} />
                        <span>{pendingUser.documentHashes?.length || 0} document(s) uploaded</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => viewDocuments(pendingUser.documentHashes)}
                      className="text-purple-600 hover:text-purple-700 border-purple-200 hover:bg-purple-50"
                    >
                      <Eye className="mr-1" size={16} />
                      View Documents
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleVerifyUser(pendingUser.id, 'verified')}
                      disabled={verifyUserMutation.isPending}
                      className="bg-green-500 text-white hover:bg-green-600"
                    >
                      <Check className="mr-1" size={16} />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleVerifyUser(pendingUser.id, 'rejected')}
                      disabled={verifyUserMutation.isPending}
                      className="bg-red-500 text-white hover:bg-red-600"
                    >
                      <X className="mr-1" size={16} />
                      Reject
                    </Button>
                  </div>
                </div>
                
                <div className="mt-4 bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Contact:</span>
                      <p className="font-medium text-gray-900">{pendingUser.phone}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Documents:</span>
                      <p className="text-purple-600 font-medium">{pendingUser.documentHashes?.length || 0} files</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Wallet:</span>
                      <p className="font-mono text-xs text-gray-700 break-all">
                        {`${pendingUser.walletAddress.slice(0, 10)}...${pendingUser.walletAddress.slice(-6)}`}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <TransactionModal
        isOpen={showTxModal}
        onClose={() => setShowTxModal(false)}
        transactionState={transactionState || { isLoading: false, txHash: null, error: null }}
        title="User Verification"
        description={`Please confirm the transaction to ${currentAction} the user on blockchain.`}
      />
    </div>
  );
}
