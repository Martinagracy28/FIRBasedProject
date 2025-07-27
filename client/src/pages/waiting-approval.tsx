import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/hooks/use-wallet";
import { useLocation } from "wouter";
import { Clock, Shield, CheckCircle, AlertCircle, ArrowLeft, RefreshCw, UserPlus, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ROLES } from "@/lib/constants";
import type { User } from "@shared/schema";

export default function WaitingApproval() {
  const { account } = useWallet();
  const [, navigate] = useLocation();

  const { data: user, isLoading, refetch } = useQuery<User>({
    queryKey: ['/api/users/me', account],
    enabled: !!account,
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <Skeleton className="h-8 w-48 mb-6" />
        <Card className="shadow-xl border-purple-100">
          <CardHeader>
            <Skeleton className="h-6 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-10 w-32" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user is verified, redirect to dashboard
  if (user && user.role !== ROLES.NONE) {
    navigate('/dashboard');
    return null;
  }

  const getStatusInfo = () => {
    if (!user) {
      return {
        status: 'not-registered',
        title: 'Registration Required',
        description: 'You need to register first before accessing the system.',
        icon: AlertCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      };
    }

    return {
      status: 'pending',
      title: 'Waiting for Approval',
      description: 'Your registration has been submitted and is pending verification by our officers.',
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate('/dashboard')}
        className="mb-6 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
      >
        <ArrowLeft className="mr-2" size={16} />
        Back to Dashboard
      </Button>

      <div className="space-y-6">
        {/* Status Card */}
        <Card className={`shadow-xl ${statusInfo.borderColor} border-2`}>
          <CardHeader className={`${statusInfo.bgColor} rounded-t-lg`}>
            <CardTitle className="flex items-center space-x-3">
              <div className={`w-10 h-10 ${statusInfo.color} bg-white rounded-full flex items-center justify-center`}>
                <StatusIcon size={20} />
              </div>
              <span className={`text-xl ${statusInfo.color}`}>{statusInfo.title}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-gray-700 mb-6">{statusInfo.description}</p>

            {!user ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  To get started with SecureFIR, you need to register with your identity documents.
                </p>
                <Button 
                  onClick={() => navigate('/register')}
                  className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white w-full py-3"
                >
                  <UserPlus className="mr-2" size={20} />
                  Register Now
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* User Details */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Registration Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Wallet Address:</span>
                      <span className="font-mono text-xs bg-white px-2 py-1 rounded">
                        {user.walletAddress}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Registration Date:</span>
                      <span>
                        {user.createdAt ? new Date(user.createdAt as any).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Documents Uploaded:</span>
                      <span className="text-green-600 font-medium">
                        {user.documentHashes?.length || 0} files
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Status:</span>
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        {user.status === 'pending' ? 'Pending Review' : user.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button 
                    onClick={() => refetch()}
                    variant="outline"
                    className="flex-1 border-purple-200 text-purple-600 hover:bg-purple-50"
                  >
                    <RefreshCw className="mr-2" size={16} />
                    Refresh Status
                  </Button>
                  <Button 
                    onClick={() => navigate('/register')}
                    variant="outline"
                    className="flex-1 border-gray-200"
                  >
                    <ExternalLink className="mr-2" size={16} />
                    Update Registration
                  </Button>
                </div>

                {/* Next Steps */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">What happens next?</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Our officers will review your submitted documents</li>
                    <li>• Verification typically takes 24-48 hours</li>
                    <li>• You'll be notified once your account is verified</li>
                    <li>• After verification, you can file FIRs and track cases</li>
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card className="border-purple-100">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-purple-600">
              <Shield size={20} />
              <span>Need Help?</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600">
              <p>
                <strong>Registration Issues:</strong> Ensure all required documents are uploaded and clear.
              </p>
              <p>
                <strong>Verification Delays:</strong> During peak times, verification may take longer than usual.
              </p>
              <p>
                <strong>Technical Support:</strong> Contact our support team if you encounter any technical issues.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}