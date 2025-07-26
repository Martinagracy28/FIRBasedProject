import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/use-wallet";
import { useBlockchain } from "@/hooks/use-blockchain";
import { insertOfficerSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { ShieldQuestion, UserPlus, Eye, Users, Award, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import TransactionModal from "@/components/transaction-modal";
import { z } from "zod";

const officerFormSchema = insertOfficerSchema.extend({
  userName: z.string().min(1, "Officer name is required"),
  userEmail: z.string().email("Valid email is required"),
  userPhone: z.string().min(1, "Phone number is required"),
  userWalletAddress: z.string().min(1, "Wallet address is required"),
});

type OfficerFormData = z.infer<typeof officerFormSchema>;

export default function ManageOfficers() {
  const { account } = useWallet();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { registerUser, transactionState } = useBlockchain();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showTxModal, setShowTxModal] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['/api/users/me', account],
    enabled: !!account,
  });

  const { data: officers, isLoading } = useQuery({
    queryKey: ['/api/officers'],
    enabled: user?.role === 'admin',
  });

  const form = useForm<OfficerFormData>({
    resolver: zodResolver(officerFormSchema),
    defaultValues: {
      userName: "",
      userEmail: "",
      userPhone: "",
      userWalletAddress: "",
      badgeNumber: "",
      department: "",
    },
  });

  const addOfficerMutation = useMutation({
    mutationFn: async (data: OfficerFormData) => {
      // First create user account
      const userData = {
        walletAddress: data.userWalletAddress,
        name: data.userName,
        email: data.userEmail,
        phone: data.userPhone,
        documentHashes: [], // Officers don't need document verification
      };
      
      const userResponse = await apiRequest("POST", "/api/users/register", userData);
      const newUser = await userResponse.json();
      
      // Immediately verify the user (admin privilege)
      await apiRequest("PATCH", `/api/users/${newUser.id}/status`, {
        status: "verified",
        verifiedBy: user?.id,
      });
      
      // Create officer record
      const officerData = {
        userId: newUser.id,
        badgeNumber: data.badgeNumber,
        department: data.department,
      };
      
      const officerResponse = await apiRequest("POST", "/api/officers", officerData);
      const officer = await officerResponse.json();
      
      // Submit to blockchain
      setShowTxModal(true);
      const txHash = await registerUser(userData);
      
      return { officer, txHash };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/officers'] });
      toast({
        title: "Officer Added Successfully",
        description: "New officer has been registered and verified.",
      });
      form.reset();
      setShowAddDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Add Officer",
        description: error.message || "An error occurred while adding the officer",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setTimeout(() => setShowTxModal(false), 3000);
    },
  });

  const onSubmit = (data: OfficerFormData) => {
    addOfficerMutation.mutate(data);
  };

  const viewOfficerProfile = (officer: any) => {
    toast({
      title: "Officer Profile",
      description: `Viewing profile for ${officer.user.name} (Badge: ${officer.badgeNumber})`,
    });
  };

  const assignCases = (officer: any) => {
    toast({
      title: "Assign Cases",
      description: `Case assignment for ${officer.user.name} would open here`,
    });
  };

  if (user?.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto mt-20">
        <Card className="shadow-xl border-purple-100 text-center p-8">
          <ShieldQuestion className="mx-auto text-orange-500 mb-4" size={48} />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Access Required</h2>
          <p className="text-gray-600">
            Only administrators can manage officers.
          </p>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
          <ShieldQuestion className="text-purple-700" size={32} />
          <span>Officer Management</span>
        </h2>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:from-purple-700 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all duration-200">
              <UserPlus className="mr-2" size={16} />
              Add Officer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Officer</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="userName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Officer's full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="userEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="officer@police.gov" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="userPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+91 XXXXX XXXXX" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="userWalletAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Wallet Address</FormLabel>
                      <FormControl>
                        <Input placeholder="0x..." {...field} className="font-mono text-sm" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="badgeNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Badge Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Badge #12345" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <FormControl>
                        <Input placeholder="Cyber Crime Unit" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={addOfficerMutation.isPending}
                    className="bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:from-purple-700 hover:to-pink-600"
                  >
                    {addOfficerMutation.isPending ? "Adding..." : "Add Officer"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {!officers || officers.length === 0 ? (
        <Card className="shadow-xl border-purple-100">
          <CardContent className="text-center py-16">
            <Users className="mx-auto text-gray-400 mb-4" size={64} />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Officers Found</h3>
            <p className="text-gray-600 mb-6">Get started by adding your first officer.</p>
            <Button
              onClick={() => setShowAddDialog(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:from-purple-700 hover:to-pink-600"
            >
              <UserPlus className="mr-2" size={16} />
              Add First Officer
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {officers.map((officer: any) => (
            <Card key={officer.id} className="shadow-lg border-purple-200 hover:shadow-xl transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-lg font-semibold">
                      {officer.user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{officer.user.name}</h4>
                    <p className="text-sm text-gray-600">Badge: #{officer.badgeNumber}</p>
                    <p className="text-xs text-gray-500">{officer.department}</p>
                  </div>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active Cases:</span>
                    <span className="font-medium text-purple-600">{officer.activeCases}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Closed Cases:</span>
                    <span className="font-medium text-green-600">{officer.closedCases}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Success Rate:</span>
                    <span className="font-medium text-blue-600">
                      {officer.closedCases > 0 ? Math.round((officer.closedCases / (officer.activeCases + officer.closedCases)) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Contact:</span>
                    <span className="font-medium text-gray-700">{officer.user.email}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-purple-100">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-sm text-green-600 font-medium">Active</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => viewOfficerProfile(officer)}
                      className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                    >
                      <Eye className="mr-1" size={14} />
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => assignCases(officer)}
                      className="text-pink-600 hover:text-pink-700 hover:bg-pink-50"
                    >
                      <Award className="mr-1" size={14} />
                      Assign
                    </Button>
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
        isLoading={transactionState.isLoading}
        txHash={transactionState.txHash}
        error={transactionState.error}
        title="Adding Officer"
        description="Please confirm the transaction to register the officer on blockchain."
      />
    </div>
  );
}
