import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/hooks/use-wallet";
import { useLocation } from "wouter";
import { Clock, Shield, CheckCircle, AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
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
  if (user && user.role !== 'none') {
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
            <Shield className="text-purple-600" size={24} />
            <span>Registration Status</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Status Card */}
          <div className={`${statusInfo.bgColor} ${statusInfo.borderColor} border-2 rounded-lg p-6`}>
            <div className="flex items-center space-x-4">
              <div className={`${statusInfo.color} p-3 rounded-full bg-white`}>
                <StatusIcon size={32} />
              </div>
              <div className="flex-1">
                <h3 className={`text-xl font-semibold ${statusInfo.color} mb-2`}>
                  {statusInfo.title}
                </h3>
                <p className="text-gray-700 mb-4">
                  {statusInfo.description}
                </p>
                <Badge variant="secondary" className={`${statusInfo.color} ${statusInfo.bgColor}`}>
                  {statusInfo.status === 'pending' ? 'Pending Verification' : 'Not Registered'}
                </Badge>
              </div>
            </div>
          </div>

          {/* User Info */}
          {user && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-100">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Registration Details</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Wallet Address</label>
                  <p className="font-mono text-sm bg-white p-2 rounded border mt-1">
                    {user.walletAddress}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Registration Date</label>
                  <p className="text-sm text-gray-700 mt-1">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'Date not available'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Documents Submitted</label>
                  <p className="text-sm text-gray-700 mt-1">
                    {user.documentHashes?.length || 0} document(s) uploaded to IPFS
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Next Steps */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
              <CheckCircle className="mr-2" size={20} />
              What happens next?
            </h4>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start">
                <span className="w-6 h-6 bg-blue-200 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">1</span>
                <span>Our verification officers will review your submitted documents</span>
              </li>
              <li className="flex items-start">
                <span className="w-6 h-6 bg-blue-200 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">2</span>
                <span>Identity verification will be completed within 24-48 hours</span>
              </li>
              <li className="flex items-start">
                <span className="w-6 h-6 bg-blue-200 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">3</span>
                <span>Once approved, you'll have full access to file and track FIRs</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => refetch()}
              variant="outline"
              className="border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              <RefreshCw className="mr-2" size={16} />
              Refresh Status
            </Button>
            
            {!user && (
              <Button
                onClick={() => navigate('/register')}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Shield className="mr-2" size={16} />
                Register Now
              </Button>
            )}
          </div>

          {/* Contact Support */}
          <div className="text-center text-sm text-gray-600 border-t pt-4">
            <p>
              Having issues? Contact our support team for assistance with your registration.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}