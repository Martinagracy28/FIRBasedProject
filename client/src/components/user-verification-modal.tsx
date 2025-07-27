import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useBlockchain } from "@/hooks/use-blockchain";
import { apiRequest } from "@/lib/queryClient";
import { User as UserType } from "@shared/firebase-schema";
import { 
  User, 
  Calendar, 
  Clock, 
  FileText, 
  Check, 
  X, 
  Eye,
  Shield,
  Wallet,
  Hash
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import TransactionModal from "@/components/transaction-modal";

interface UserVerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletAddress: string;
  currentUser: any;
}

export default function UserVerificationModal({ 
  open, 
  onOpenChange, 
  walletAddress, 
  currentUser 
}: UserVerificationModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { verifyUserOnBlockchain, transactionState } = useBlockchain();
  const [showTxModal, setShowTxModal] = useState(false);
  const [currentAction, setCurrentAction] = useState<string>("");

  const { data: userDetails, isLoading } = useQuery<UserType>({
    queryKey: ['/api/users/details', walletAddress],
    enabled: open && !!walletAddress,
  });

  const verifyUserMutation = useMutation({
    mutationFn: async ({ status }: { status: 'verified' | 'rejected' }) => {
      if (!userDetails) throw new Error('User details not available');

      // For rejection, just update database without blockchain transaction
      if (status === 'rejected') {
        const response = await apiRequest("PATCH", `/api/users/${userDetails.id}/status`, {
          status,
          verifiedBy: currentUser?.id,
        });
        const updatedUser = await response.json();
        return { updatedUser, txHash: null };
      }

      // For approval: first show transaction modal, then do blockchain transaction
      setShowTxModal(true);
      setCurrentAction('approving');
      
      try {
        // Submit to blockchain first
        const txHash = await verifyUserOnBlockchain(userDetails.walletAddress);
        
        // Only update database status after blockchain success
        const response = await apiRequest("PATCH", `/api/users/${userDetails.id}/status`, {
          status: 'verified',
          verifiedBy: currentUser?.id,
        });
        const updatedUser = await response.json();
        
        return { updatedUser, txHash };
      } catch (error) {
        // If blockchain fails, don't update database
        setShowTxModal(false);
        setCurrentAction("");
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/details', walletAddress] });
      toast({
        title: `User ${variables.status === 'verified' ? 'Approved' : 'Rejected'}`,
        description: `User has been ${variables.status} successfully.`,
      });
      onOpenChange(false);
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

  const handleVerifyUser = (status: 'verified' | 'rejected') => {
    verifyUserMutation.mutate({ status });
  };

  const viewDocument = (documentHash: string) => {
    // Check if this is a mock hash (contains many zeros or doesn't start with Qm)
    const isMockHash = !documentHash.startsWith('Qm') || documentHash.includes('00000000000');

    if (isMockHash) {
      toast({
        title: "Development Mode",
        description: `Document Hash: ${documentHash}\n\nThis is a mock hash generated in development mode. In production, this would open the actual document from IPFS.`,
        duration: 5000,
      });
      return;
    }

    // For valid IPFS hashes, try to open from multiple gateways
    const gateways = [
      `https://ipfs.io/ipfs/${documentHash}`,
      `https://gateway.pinata.cloud/ipfs/${documentHash}`,
      `https://dweb.link/ipfs/${documentHash}`
    ];

    // Try opening with the first gateway, with fallback options
    window.open(gateways[0], '_blank');

    // Show info toast about the hash
    toast({
      title: "Opening IPFS Document",
      description: `Opening document: ${documentHash.substring(0, 20)}...`,
      duration: 3000,
    });
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Shield className="text-purple-600" size={24} />
              <span>User Verification Details</span>
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : userDetails ? (
            <div className="space-y-6">
              {/* User Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="text-blue-600" size={20} />
                    <span>User Overview</span>
                    <Badge className={getStatusColor(userDetails.status)}>
                      {userDetails.status.toUpperCase()}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm">
                        <Wallet className="text-gray-500" size={16} />
                        <span className="font-medium">Wallet Address:</span>
                      </div>
                      <p className="font-mono text-sm bg-gray-100 p-2 rounded border-l-4 border-purple-500">
                        {userDetails.walletAddress}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm">
                        <Hash className="text-gray-500" size={16} />
                        <span className="font-medium">User ID:</span>
                      </div>
                      <p className="font-mono text-sm bg-gray-100 p-2 rounded">
                        {userDetails.id}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="text-gray-500" size={16} />
                      <div>
                        <p className="text-sm font-medium">Registration Date</p>
                        <p className="text-sm text-gray-600">{formatDate(userDetails.createdAt)}</p>
                      </div>
                    </div>

                    {userDetails.verifiedAt && (
                      <div className="flex items-center space-x-2">
                        <Clock className="text-gray-500" size={16} />
                        <div>
                          <p className="text-sm font-medium">Verified Date</p>
                          <p className="text-sm text-gray-600">{formatDate(userDetails.verifiedAt)}</p>
                        </div>
                      </div>
                    )}

                    {userDetails.verifiedBy && (
                      <div className="flex items-center space-x-2">
                        <Shield className="text-gray-500" size={16} />
                        <div>
                          <p className="text-sm font-medium">Verified By</p>
                          <p className="text-sm text-gray-600">{userDetails.verifiedBy}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Documents Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="text-green-600" size={20} />
                    <span>Submitted Documents</span>
                    <Badge variant="outline">
                      {userDetails.documentHashes?.length || 0} Document(s)
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {userDetails.documentHashes && userDetails.documentHashes.length > 0 ? (
                    <div className="space-y-3">
                      {userDetails.documentHashes.map((hash: string, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                          <div className="flex items-center space-x-3">
                            <FileText className="text-blue-500" size={20} />
                            <div>
                              <p className="font-medium">Document {index + 1}</p>
                              <p className="text-sm text-gray-600 font-mono">
                                {hash.substring(0, 20)}...{hash.substring(hash.length - 20)}
                              </p>
                              <div className="mt-1">
                                {!hash.startsWith('Qm') || hash.includes('00000000000') ? (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                                    Development Hash
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                    Valid IPFS Hash
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewDocument(hash)}
                            className="flex items-center space-x-1"
                          >
                            <Eye size={16} />
                            <span>View</span>
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="mx-auto mb-2" size={32} />
                      <p>No documents submitted</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Role and Permissions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="text-purple-600" size={20} />
                    <span>Role & Permissions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4">
                    <Badge variant="outline" className="text-lg px-3 py-1">
                      {userDetails.role.toUpperCase()}
                    </Badge>
                    <div className="text-sm text-gray-600">
                      {userDetails.role === 'none' && 'No system permissions'}
                      {userDetails.role === 'user' && 'Can file FIRs and track cases'}
                      {userDetails.role === 'officer' && 'Can manage FIRs and verify users'}
                      {userDetails.role === 'admin' && 'Full system access'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8">
              <User className="mx-auto text-gray-400 mb-2" size={48} />
              <p className="text-gray-600">User not found</p>
            </div>
          )}

          {userDetails && userDetails.status === 'pending' && (
            <DialogFooter className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={verifyUserMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleVerifyUser('rejected')}
                disabled={verifyUserMutation.isPending}
                className="flex items-center space-x-2"
              >
                <X size={16} />
                <span>Reject</span>
              </Button>
              <Button
                onClick={() => handleVerifyUser('verified')}
                disabled={verifyUserMutation.isPending}
                className="bg-green-600 hover:bg-green-700 flex items-center space-x-2"
              >
                <Check size={16} />
                <span>Approve</span>
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <TransactionModal
        isOpen={showTxModal}
        onClose={() => setShowTxModal(false)}
        title="User Verification"
        description={`Please confirm the transaction to ${currentAction} the user on blockchain.`}
        transactionState={transactionState}
      />
    </>
  );
}