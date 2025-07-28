import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/use-wallet";
import { useBlockchain } from "@/hooks/use-blockchain";
import { apiRequest } from "@/lib/queryClient";
import { FIR_STATUS, STATUS_COLORS, ROLES } from "@/lib/constants";
import { 
  FileText, 
  Search, 
  Eye, 
  Edit, 
  Clock, 
  User, 
  CheckCircle,
  AlertCircle,
  XCircle,
  Users
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import TransactionModal from "@/components/transaction-modal";

export default function FirTracking() {
  const { account } = useWallet();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { updateFIRStatus, assignOfficer, assignOfficerToFIR, transactionState } = useBlockchain();
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFir, setSelectedFir] = useState<any>(null);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showFirDetails, setShowFirDetails] = useState(false);
  const [showTxModal, setShowTxModal] = useState(false);
  const [updateStatus, setUpdateStatus] = useState("");
  const [updateComments, setUpdateComments] = useState("");
  const [selectedOfficer, setSelectedOfficer] = useState("");

  const { data: user } = useQuery({
    queryKey: ['/api/users/me', account],
    enabled: !!account,
  });

  const { data: officer } = useQuery({
    queryKey: ['/api/officers'],
    enabled: user?.role === 'officer',
    select: (officers: any[]) => officers?.find?.(o => o.userId === user?.id),
  });

  // Build query parameters based on user role
  let queryKey = ['/api/firs'];
  let queryString = '';
  
  if (user?.role === 'user') {
    queryString = `?complainantId=${user.id}`;
    queryKey.push(queryString);
  } else if (user?.role === 'officer' && officer) {
    queryString = `?officerId=${officer.id}`;
    queryKey.push(queryString);
  } else if (user?.role === 'admin') {
    // Admin gets all FIRs, no query parameters needed
    queryKey.push('all');
  }

  const { data: firs, isLoading } = useQuery({
    queryKey: queryKey,
    queryFn: async () => {
      const response = await fetch(`/api/firs${queryString}`);
      if (!response.ok) {
        throw new Error('Failed to fetch FIRs');
      }
      return response.json();
    },
    enabled: !!user,
  });

  const { data: officers } = useQuery({
    queryKey: ['/api/officers'],
    enabled: user?.role === 'admin',
  });

  const updateFirMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFir) return;
      
      const response = await apiRequest("PATCH", `/api/firs/${selectedFir.id}/status`, {
        status: updateStatus,
        comments: updateComments,
        updatedBy: user?.id,
      });
      const updatedFir = await response.json();
      
      setShowTxModal(true);
      const txHash = await updateFIRStatus(selectedFir.id, updateStatus);
      
      return { updatedFir, txHash };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/firs'] });
      toast({
        title: "FIR Status Updated",
        description: `FIR ${selectedFir?.firNumber} status updated to ${updateStatus.replace('_', ' ')}`,
      });
      setShowUpdateDialog(false);
      setSelectedFir(null);
      setUpdateStatus("");
      setUpdateComments("");
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update FIR status",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setTimeout(() => setShowTxModal(false), 3000);
    },
  });

  const assignOfficerMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFir || !selectedOfficer) return;
      
      // Find the selected officer's wallet address
      const officer = officers?.find((o: any) => o.id === selectedOfficer);
      if (!officer) throw new Error('Officer not found');

      setShowTxModal(true);
      
      // Call blockchain function first with numeric FIR ID
      const firId = parseInt(selectedFir.firNumber.replace('FIR', ''));
      const blockchainTxHash = await assignOfficerToFIR(firId, officer.walletAddress);

      if (!blockchainTxHash) {
        throw new Error('Blockchain transaction failed');
      }
      
      // Call backend API to assign officer
      const response = await apiRequest("PATCH", `/api/firs/${selectedFir.id}/assign`, {
        officerId: selectedOfficer,
        blockchainTxHash: blockchainTxHash
      });
      const updatedFir = await response.json();
      
      return { updatedFir, txHash: blockchainTxHash };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/firs'] });
      toast({
        title: "Officer Assigned",
        description: `Officer assigned to FIR ${selectedFir?.firNumber} on blockchain`,
      });
      setShowAssignDialog(false);
      setShowFirDetails(false);
      setSelectedFir(null);
      setSelectedOfficer("");
    },
    onError: (error: any) => {
      toast({
        title: "Assignment Failed",
        description: error.message || "Failed to assign officer",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setTimeout(() => setShowTxModal(false), 3000);
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case FIR_STATUS.PENDING:
        return <Clock className="text-yellow-600" size={16} />;
      case FIR_STATUS.IN_PROGRESS:
        return <AlertCircle className="text-blue-600" size={16} />;
      case FIR_STATUS.CLOSED:
        return <CheckCircle className="text-green-600" size={16} />;
      case FIR_STATUS.REJECTED:
        return <XCircle className="text-red-600" size={16} />;
      default:
        return <Clock className="text-gray-600" size={16} />;
    }
  };

  const canUpdateStatus = (fir: any) => {
    if (user?.role === 'admin') return true;
    if (user?.role === 'officer' && fir.assignedOfficer?.userId === user.id) return true;
    return false;
  };

  const canAssignOfficer = (fir: any) => {
    return user?.role === 'admin';
  };

  const filteredFirs = firs?.filter((fir: any) => {
    const matchesStatus = statusFilter === "all" || fir.status === statusFilter;
    const matchesSearch = searchTerm === "" || 
      fir.firNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fir.complainant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fir.incidentType.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  }) || [];

  const viewFir = (fir: any) => {
    setSelectedFir(fir);
    setShowFirDetails(true);
  };

  const openUpdateDialog = (fir: any) => {
    setSelectedFir(fir);
    setUpdateStatus(fir.status);
    setShowUpdateDialog(true);
  };

  const openAssignDialog = (fir: any) => {
    setSelectedFir(fir);
    setShowAssignDialog(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <div className="flex space-x-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-48" />
          </div>
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const getPageTitle = () => {
    switch (user?.role) {
      case ROLES.ADMIN:
        return "All FIRs";
      case ROLES.OFFICER:
        return "My Assigned FIRs";
      case ROLES.USER:
        return "My Reports";
      default:
        return "FIR Tracking";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
          <FileText className="text-purple-600" size={32} />
          <span>{getPageTitle()}</span>
        </h2>
        <div className="flex items-center space-x-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48 border-purple-200">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value={FIR_STATUS.PENDING}>Pending</SelectItem>
              <SelectItem value={FIR_STATUS.IN_PROGRESS}>In Progress</SelectItem>
              <SelectItem value={FIR_STATUS.CLOSED}>Closed</SelectItem>
              <SelectItem value={FIR_STATUS.REJECTED}>Rejected</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={16} />
            <Input
              placeholder="Search FIRs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64 border-purple-200"
            />
          </div>
        </div>
      </div>

      <Card className="shadow-xl border-purple-100">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>FIR Records</span>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              {filteredFirs.length} Records
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredFirs.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="mx-auto text-gray-400 mb-4" size={64} />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No FIRs Found</h3>
              <p className="text-gray-600">
                {statusFilter !== "all" || searchTerm ? "Try adjusting your filters" : "No FIRs have been filed yet"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-200">
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">FIR ID</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Complainant</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Type</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Status</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Assigned Officer</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-100">
                  {filteredFirs.map((fir: any) => (
                    <tr key={fir.id} className="hover:bg-purple-25 transition-colors duration-200">
                      <td className="py-4 px-6">
                        <span className="font-mono text-sm text-purple-600 font-medium">
                          {fir.firNumber}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-medium text-gray-900">{fir.complainant.name}</p>
                          <p className="text-sm text-gray-600">
                            Filed: {new Date(fir.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          {fir.incidentType.replace('-', ' ')}
                        </Badge>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(fir.status)}
                          <Badge className={STATUS_COLORS[fir.status as keyof typeof STATUS_COLORS]}>
                            {fir.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {fir.assignedOfficer ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-medium">
                                {fir.assignedOfficer.user.name.split(' ').map((n: string) => n[0]).join('')}
                              </span>
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {fir.assignedOfficer.user.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Unassigned</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewFir(fir)}
                            className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                          >
                            <Eye className="mr-1" size={14} />
                            View
                          </Button>
                          {canUpdateStatus(fir) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openUpdateDialog(fir)}
                              className="text-pink-600 hover:text-pink-700 hover:bg-pink-50"
                            >
                              <Edit className="mr-1" size={14} />
                              Update
                            </Button>
                          )}
                          {canAssignOfficer(fir) && !fir.assignedOfficer && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openAssignDialog(fir)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Users className="mr-1" size={14} />
                              Assign
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Update Status Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update FIR Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                FIR: {selectedFir?.firNumber}
              </label>
              <p className="text-sm text-gray-600">{selectedFir?.complainant?.name}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <Select value={updateStatus} onValueChange={setUpdateStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={FIR_STATUS.PENDING}>Pending</SelectItem>
                  <SelectItem value={FIR_STATUS.IN_PROGRESS}>In Progress</SelectItem>
                  <SelectItem value={FIR_STATUS.CLOSED}>Closed</SelectItem>
                  <SelectItem value={FIR_STATUS.REJECTED}>Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Comments</label>
              <Textarea
                value={updateComments}
                onChange={(e) => setUpdateComments(e.target.value)}
                placeholder="Add comments about this status update..."
                rows={3}
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowUpdateDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => updateFirMutation.mutate()}
                disabled={updateFirMutation.isPending || !updateStatus}
                className="bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:from-purple-700 hover:to-pink-600"
              >
                {updateFirMutation.isPending ? "Updating..." : "Update Status"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Officer Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Officer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                FIR: {selectedFir?.firNumber}
              </label>
              <p className="text-sm text-gray-600">{selectedFir?.incidentType}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Officer</label>
              <Select value={selectedOfficer} onValueChange={setSelectedOfficer}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an officer" />
                </SelectTrigger>
                <SelectContent>
                  {officers?.map((officer: any) => (
                    <SelectItem key={officer.id} value={officer.id}>
                      {officer.user.name} - {officer.department} (Badge: {officer.badgeNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => assignOfficerMutation.mutate()}
                disabled={assignOfficerMutation.isPending || !selectedOfficer}
                className="bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:from-purple-700 hover:to-pink-600"
              >
                {assignOfficerMutation.isPending ? "Assigning..." : "Assign Officer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* FIR Details Dialog */}
      <Dialog open={showFirDetails} onOpenChange={setShowFirDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <FileText className="text-purple-600" size={24} />
              <span>FIR Details - {selectedFir?.firNumber}</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedFir && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">FIR Number</label>
                    <p className="text-lg font-semibold text-purple-600">{selectedFir.firNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <Badge className={`${STATUS_COLORS[selectedFir.status]} text-white`}>
                      {selectedFir.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Incident Type</label>
                    <p className="text-gray-900">{selectedFir.incidentType}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Date Filed</label>
                    <p className="text-gray-900">{new Date(selectedFir.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Complainant</label>
                    <p className="text-gray-900">{selectedFir.complainant?.walletAddress}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Location</label>
                    <p className="text-gray-900">{selectedFir.incidentLocation}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Assigned Officer</label>
                    <p className="text-gray-900">
                      {selectedFir.assignedOfficer?.user?.name || 'Not assigned'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Evidence Files</label>
                    <p className="text-gray-900">{selectedFir.evidenceHashes?.length || 0} files</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Description</label>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedFir.description}</p>
                </div>
              </div>

              {/* Evidence Hashes */}
              {selectedFir.evidenceHashes && selectedFir.evidenceHashes.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Evidence Files (IPFS)</label>
                  <div className="space-y-2">
                    {selectedFir.evidenceHashes.map((hash: string, index: number) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg flex items-center justify-between">
                        <span className="text-sm font-mono text-gray-600">{hash}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`https://ipfs.io/ipfs/${hash}`, '_blank')}
                        >
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Updates/History */}
              {selectedFir.updates && selectedFir.updates.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Status Updates</label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {selectedFir.updates.map((update: any, index: number) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex justify-between items-start">
                          <p className="text-sm text-gray-900">{update.comments}</p>
                          <span className="text-xs text-gray-500">
                            {new Date(update.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Actions */}
              {user?.role === 'admin' && (
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">Admin Actions</h3>
                    <div className="flex space-x-3">
                      {!selectedFir.assignedOfficer && (
                        <Button
                          onClick={() => setShowAssignDialog(true)}
                          className="bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:from-purple-700 hover:to-pink-600"
                        >
                          <Users className="mr-2" size={16} />
                          Assign Officer
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => setShowFirDetails(false)}
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <TransactionModal
        isOpen={showTxModal}
        onClose={() => setShowTxModal(false)}
        transactionState={transactionState || { isLoading: false, txHash: null, error: null }}
        title="Blockchain Transaction"
        description="Please confirm the transaction in MetaMask and wait for blockchain confirmation."
      />
    </div>
  );
}
