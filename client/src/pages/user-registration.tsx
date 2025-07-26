import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/use-wallet";
import { useBlockchain } from "@/hooks/use-blockchain";
import { insertUserSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { UserPlus, Upload, Shield, ArrowLeft } from "lucide-react";
import TransactionModal from "@/components/transaction-modal";
import FileUpload from "@/components/file-upload";
import { z } from "zod";

const registrationSchema = insertUserSchema.extend({
  documentFiles: z.any().optional(),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

export default function UserRegistration() {
  const { account } = useWallet();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const { requestRegistration, txStatus, resetTxStatus } = useBlockchain();
  const [showTxModal, setShowTxModal] = useState(false);
  const [documentHashes, setDocumentHashes] = useState<string[]>([]);

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      walletAddress: account || "",
      documentHashes: [],
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegistrationFormData) => {
      // First register user in our system
      const response = await apiRequest("POST", "/api/users/register", data);
      const user = await response.json();
      
      // Then submit to blockchain with document hashes
      if (documentHashes.length > 0) {
        setShowTxModal(true);
        const txHash = await requestRegistration(documentHashes);
        return { user, txHash };
      }
      
      return { user, txHash: null };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
      toast({
        title: "Registration Submitted",
        description: "Your registration has been submitted for verification.",
      });
      form.reset();
      
      // Navigate to dashboard after successful registration
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000); // Give time to show the success message
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to submit registration",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setTimeout(() => setShowTxModal(false), 3000);
    },
  });

  const onSubmit = (data: RegistrationFormData) => {
    if (!account) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    console.log('Current document hashes:', documentHashes);
    if (documentHashes.length === 0) {
      toast({
        title: "Documents Required",
        description: "Please upload at least one identity document",
        variant: "destructive",
      });
      return;
    }

    const formData = {
      ...data,
      walletAddress: account,
      documentHashes: documentHashes,
    };

    registerMutation.mutate(formData);
  };

  const handleFilesUploaded = (hashes: string[]) => {
    console.log('Files uploaded, hashes received:', hashes);
    setDocumentHashes(hashes);
    form.setValue('documentHashes', hashes);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back Button */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
        >
          <ArrowLeft className="mr-2" size={16} />
          Back to Dashboard
        </Button>
      </div>

      <Card className="shadow-xl border-purple-100">
        <CardHeader>
          <CardTitle className="flex items-center space-x-3">
            <UserPlus className="text-purple-600" size={24} />
            <span>User Registration</span>
          </CardTitle>
          <div className="flex items-center space-x-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm w-fit">
            <Shield size={16} />
            <span>Blockchain Secured</span>
          </div>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Personal Information */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-100">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <UserPlus className="text-purple-600" size={20} />
                  <span>Personal Information</span>
                </h4>
                
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="walletAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Wallet Address</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            disabled
                            className="border-purple-200 font-mono text-sm bg-gray-50"
                          />
                        </FormControl>
                        <FormMessage />
                        <p className="text-sm text-gray-600">
                          Your connected wallet address will be used as your unique identifier
                        </p>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Document Upload */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-100">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Upload className="text-purple-600" size={20} />
                  <span>Identity Documents</span>
                </h4>
                
                <FileUpload
                  onFilesUploaded={handleFilesUploaded}
                  maxFiles={3}
                  acceptedTypes={['image/*', 'application/pdf', '.doc', '.docx']}
                  title="Identity Documents"
                  description="Files will be stored securely on IPFS"
                />
                
                <div className="text-sm text-gray-600 mt-4">
                  <p className="font-medium mb-2">Required Documents:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Government-issued Photo ID (Aadhaar, Passport, etc.)</li>
                    <li>Address Proof (Utility Bill, Bank Statement, etc.)</li>
                  </ul>
                </div>
              </div>

              {/* Submit */}
              <div className="flex items-center justify-between pt-6 border-t border-purple-100">
                <p className="text-sm text-gray-600 flex items-center space-x-2">
                  <Shield className="text-purple-600" size={16} />
                  <span>This registration will be recorded on the blockchain</span>
                </p>
                <Button 
                  type="submit"
                  disabled={registerMutation.isPending}
                  className="bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:from-purple-700 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <UserPlus className="mr-2" size={16} />
                  {registerMutation.isPending ? "Submitting..." : "Submit Registration"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <TransactionModal
        isOpen={showTxModal}
        onClose={() => setShowTxModal(false)}
        isLoading={txStatus.isLoading}
        txHash={txStatus.txHash}
        error={txStatus.error}
        title="User Registration"
        description="Please confirm the transaction in MetaMask and wait for blockchain confirmation."
      />
    </div>
  );
}
