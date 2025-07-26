import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/use-wallet";
import { useBlockchain } from "@/hooks/use-blockchain";
import { insertFirSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { INCIDENT_TYPES } from "@/lib/constants";
import { FilePlus, User, AlertTriangle, Paperclip, Shield, Upload, Trash2 } from "lucide-react";
import TransactionModal from "@/components/transaction-modal";
import FileUpload from "@/components/file-upload";
import { z } from "zod";

const firFormSchema = insertFirSchema.extend({
  incidentDate: z.string(),
});

type FirFormData = z.infer<typeof firFormSchema>;

export default function FileFir() {
  const { account } = useWallet();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { fileFIR, transactionState } = useBlockchain();
  const [showTxModal, setShowTxModal] = useState(false);
  const [evidenceHashes, setEvidenceHashes] = useState<string[]>([]);

  const { data: user } = useQuery({
    queryKey: ['/api/users/me', account],
    enabled: !!account,
  });

  const form = useForm<FirFormData>({
    resolver: zodResolver(firFormSchema),
    defaultValues: {
      complainantId: user?.id || "",
      incidentType: "",
      incidentDate: "",
      incidentLocation: "",
      description: "",
      evidenceHashes: [],
    },
  });

  const fileFirMutation = useMutation({
    mutationFn: async (data: FirFormData) => {
      const firData = {
        ...data,
        complainantId: user?.id,
        incidentDate: new Date(data.incidentDate),
        evidenceHashes: evidenceHashes,
      };
      
      // First create FIR in our system
      const response = await apiRequest("POST", "/api/firs", firData);
      const fir = await response.json();
      
      // Then submit to blockchain
      setShowTxModal(true);
      const txHash = await fileFIR(firData);
      
      return { fir, txHash };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/firs'] });
      toast({
        title: "FIR Filed Successfully",
        description: "Your FIR has been recorded on the blockchain.",
      });
      form.reset();
      setEvidenceHashes([]);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to File FIR",
        description: error.message || "An error occurred while filing the FIR",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setTimeout(() => setShowTxModal(false), 3000);
    },
  });

  const onSubmit = (data: FirFormData) => {
    if (!user || user.status !== "verified") {
      toast({
        title: "Verification Required",
        description: "You must be a verified user to file an FIR",
        variant: "destructive",
      });
      return;
    }

    fileFirMutation.mutate(data);
  };

  const handleEvidenceUploaded = (hashes: string[]) => {
    setEvidenceHashes(hashes);
    form.setValue('evidenceHashes', hashes);
  };

  if (!user || user.status !== "verified") {
    return (
      <div className="max-w-md mx-auto mt-20">
        <Card className="shadow-xl border-purple-100 text-center p-8">
          <AlertTriangle className="mx-auto text-orange-500 mb-4" size={48} />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Required</h2>
          <p className="text-gray-600">
            You must be a verified user to file an FIR. Please complete your registration and wait for verification.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="shadow-xl border-purple-100">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FilePlus className="text-purple-600" size={24} />
              <span>File New FIR</span>
            </div>
            <div className="flex items-center space-x-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm">
              <Shield size={16} />
              <span>Blockchain Secured</span>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Personal Information Section */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-100">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <User className="text-purple-600" size={20} />
                  <span>Complainant Information</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <Input value={user.name} disabled className="bg-gray-50" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
                    <Input value={user.phone} disabled className="bg-gray-50" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <Input value={user.email} disabled className="bg-gray-50" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Wallet Address</label>
                    <Input value={user.walletAddress} disabled className="bg-gray-50 font-mono text-sm" />
                  </div>
                </div>
              </div>

              {/* Incident Details Section */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-100">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <AlertTriangle className="text-orange-500" size={20} />
                  <span>Incident Details</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="incidentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Incident Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="border-purple-200">
                              <SelectValue placeholder="Select incident type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {INCIDENT_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="incidentDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Incident</FormLabel>
                        <FormControl>
                          <Input 
                            type="datetime-local" 
                            {...field} 
                            className="border-purple-200 focus:ring-purple-600"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="incidentLocation"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Location of Incident</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Detailed address where incident occurred" 
                            {...field} 
                            className="border-purple-200 focus:ring-purple-600"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Incident Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            rows={4}
                            placeholder="Provide detailed description of the incident..." 
                            {...field} 
                            className="border-purple-200 focus:ring-purple-600 resize-none"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Evidence Section */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-100">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Paperclip className="text-purple-600" size={20} />
                  <span>Supporting Evidence</span>
                </h4>
                
                <FileUpload
                  onFilesUploaded={handleEvidenceUploaded}
                  maxFiles={5}
                  acceptedTypes={['image/*', 'video/*', 'application/pdf', '.doc', '.docx']}
                  title="Evidence Files"
                  description="Upload photos, videos, documents related to the incident"
                />
              </div>

              {/* Submit Section */}
              <div className="flex items-center justify-between pt-6 border-t border-purple-100">
                <p className="text-sm text-gray-600 flex items-center space-x-2">
                  <Shield className="text-purple-600" size={16} />
                  <span>This FIR will be recorded on the blockchain</span>
                </p>
                <div className="flex items-center space-x-4">
                  <Button 
                    type="button" 
                    variant="outline"
                    className="border-purple-300 text-purple-700 hover:bg-purple-50"
                  >
                    Save Draft
                  </Button>
                  <Button 
                    type="submit"
                    disabled={fileFirMutation.isPending}
                    className="bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:from-purple-700 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <FilePlus className="mr-2" size={16} />
                    {fileFirMutation.isPending ? "Filing..." : "Submit FIR"}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <TransactionModal
        isOpen={showTxModal}
        onClose={() => setShowTxModal(false)}
        transactionState={transactionState || { isLoading: false, txHash: null, error: null }}
        title="Filing FIR"
        description="Please confirm the transaction in MetaMask and wait for blockchain confirmation."
      />
    </div>
  );
}
