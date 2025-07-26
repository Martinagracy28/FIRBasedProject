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
import { insertOfficerSchema } from "@shared/firebase-schema";
import { apiRequest } from "@/lib/queryClient";
import { ShieldCheck, UserPlus, Phone, MapPin, Badge as BadgeIcon, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import TransactionModal from "@/components/transaction-modal";
import { z } from "zod";

const officerFormSchema = insertOfficerSchema;
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
      name: "",
      phone: "",
      walletAddress: "",
      badgeNumber: "",
      department: "",
    },
  });

  const addOfficerMutation = useMutation({
    mutationFn: async (data: OfficerFormData) => {
      // Submit to blockchain first
      setShowTxModal(true);
      const txHash = await registerUser({
        walletAddress: data.walletAddress,
        documentHashes: []
      });
      
      // Create officer in database
      const response = await apiRequest("POST", "/api/officers", data);
      const officer = await response.json();
      
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

  // Check if user is admin
  if (user?.role !== 'admin') {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <ShieldCheck className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
            <p className="text-muted-foreground">
              Only administrators can manage officers.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-purple-900 dark:text-purple-100">
            Manage Officers
          </h1>
          <p className="text-muted-foreground mt-1">
            Add and manage police officers in the system
          </p>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Officer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-purple-900 dark:text-purple-100">
                Add New Officer
              </DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Officer Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter full name" 
                          {...field} 
                          className="focus:ring-purple-500 focus:border-purple-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter phone number" 
                          {...field} 
                          className="focus:ring-purple-500 focus:border-purple-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="walletAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Wallet Address</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="0x..." 
                          {...field} 
                          className="focus:ring-purple-500 focus:border-purple-500"
                        />
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
                        <Input 
                          placeholder="Enter badge number" 
                          {...field} 
                          className="focus:ring-purple-500 focus:border-purple-500"
                        />
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
                        <Input 
                          placeholder="Enter department" 
                          {...field} 
                          className="focus:ring-purple-500 focus:border-purple-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end space-x-2 pt-4">
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
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {addOfficerMutation.isPending ? "Adding..." : "Add Officer"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Officers List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-purple-900 dark:text-purple-100">
            <Users className="h-5 w-5 mr-2" />
            Officers ({officers?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : officers?.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No Officers Yet</h3>
              <p className="text-muted-foreground mb-4">
                Start by adding the first officer to the system.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {officers?.map((officer: any) => (
                <div 
                  key={officer.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                      <ShieldCheck className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    
                    <div>
                      <h3 className="font-semibold">{officer.name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <BadgeIcon className="h-3 w-3 mr-1" />
                          {officer.badgeNumber}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {officer.department}
                        </div>
                        <div className="flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {officer.phone}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">
                      {officer.activeCases} Active
                    </Badge>
                    <Badge variant="outline">
                      {officer.closedCases} Closed
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Modal */}
      <TransactionModal 
        isOpen={showTxModal}
        onClose={() => setShowTxModal(false)}
        transactionState={transactionState}
        title="Adding Officer to Blockchain"
        description="Recording officer information on the blockchain for transparency and security."
      />
    </div>
  );
}