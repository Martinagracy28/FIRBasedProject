import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, TrendingUp, AlertCircle, Users, FileText, CheckCircle, UserPlus, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useWallet } from "@/hooks/use-wallet";
import { useLocation } from "wouter";
import { ROLES } from "@/lib/constants";
import type { User } from "@shared/schema";

export default function Dashboard() {
  const { account } = useWallet();
  const [, navigate] = useLocation();

  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ['/api/users/me', account],
    enabled: !!account,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
  });

  const { data: recentFirs, isLoading: firsLoading } = useQuery({
    queryKey: ['/api/firs'],
  });

  if (userLoading || statsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  // Handle unregistered users
  if (!user) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <UserPlus className="text-white" size={32} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to SecureFIR</h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            You need to register first to access the FIR management system. Your registration will be verified by our officers.
          </p>
          <Button 
            onClick={() => navigate('/register')}
            className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white px-8 py-3 text-lg"
          >
            <UserPlus className="mr-2" size={20} />
            Register Now
          </Button>
        </div>
      </div>
    );
  }

  // Handle pending verification
  if (user.role === ROLES.NONE && user.status === 'pending') {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="text-white" size={32} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Registration Under Review</h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Your registration has been submitted and is currently being reviewed by our officers. You'll be notified once verified.
          </p>
          <Button 
            onClick={() => navigate('/waiting-approval')}
            variant="outline"
            className="border-yellow-500 text-yellow-600 hover:bg-yellow-50 px-8 py-3"
          >
            <RefreshCw className="mr-2" size={20} />
            Check Status
          </Button>
        </div>
      </div>
    );
  }

  const userRole = user?.role || ROLES.NONE;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Dashboard Overview</h2>
          <p className="text-gray-600 mt-1">Welcome back, {userRole === ROLES.ADMIN ? 'Administrator' : userRole === ROLES.OFFICER ? 'Officer' : 'User'}</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Clock size={16} />
          <span>Last updated: 2 minutes ago</span>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-xl transition-shadow duration-200 border-purple-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total FIRs</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalFirs || 0}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-500 rounded-lg flex items-center justify-center">
                <FileText className="text-white" size={20} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="text-green-600 mr-1" size={16} />
              <span className="text-green-600 font-medium">+12%</span>
              <span className="text-gray-600 ml-2">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-shadow duration-200 border-purple-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Verification</p>
                <p className="text-3xl font-bold text-orange-600">{stats?.pendingVerification || 0}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
                <AlertCircle className="text-white" size={20} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-orange-600 font-medium">Urgent</span>
              <span className="text-gray-600 ml-2">attention needed</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-shadow duration-200 border-purple-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Officers</p>
                <p className="text-3xl font-bold text-green-600">{stats?.activeOfficers || 0}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-green-600 rounded-lg flex items-center justify-center">
                <Users className="text-white" size={20} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600 font-medium">98%</span>
              <span className="text-gray-600 ml-2">availability</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-shadow duration-200 border-purple-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Closed Cases</p>
                <p className="text-3xl font-bold text-blue-600">{stats?.closedCases || 0}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                <CheckCircle className="text-white" size={20} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-blue-600 font-medium">75%</span>
              <span className="text-gray-600 ml-2">resolution rate</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent FIRs */}
      <Card className="border-purple-100">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="text-purple-600" size={20} />
            <span>Recent FIRs</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {firsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {recentFirs?.slice(0, 5).map((fir: any) => (
                <div key={fir.id} className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-500 rounded-full flex items-center justify-center">
                      <FileText className="text-white" size={16} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{fir.firNumber}</p>
                      <p className="text-sm text-gray-600">{fir.complainant?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                      {fir.incidentType}
                    </Badge>
                    <Badge 
                      className={
                        fir.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        fir.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        fir.status === 'closed' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }
                    >
                      {fir.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              )) || (
                <div className="text-center py-8">
                  <FileText className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-600">No FIRs found</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
