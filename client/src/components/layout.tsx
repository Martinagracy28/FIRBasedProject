import { Shield, Clock, Wifi } from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";
import { useQuery } from "@tanstack/react-query";
import { NAVIGATION, ROLE_COLORS, ROLES } from "@/lib/constants";
import { Link, useLocation } from "wouter";
import WalletConnection from "./wallet-connection";
import RoleBadge from "./role-badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { account, isConnected } = useWallet();
  const [location] = useLocation();

  const { data: user } = useQuery({
    queryKey: ['/api/users/me', account],
    enabled: !!account && isConnected,
  });

  const userRole = user?.role || ROLES.NONE;
  const navigationItems = NAVIGATION[userRole] || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-purple-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Shield className="text-white text-lg" size={20} />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                SecureFIR
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Network Status */}
              <div className="hidden sm:block">
                <span className="text-sm text-gray-600">Sepolia Testnet</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-600 font-medium">Connected</span>
                </div>
              </div>
              
              <WalletConnection />
              <RoleBadge role={userRole} />
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        {isConnected && (
          <aside className="w-64 bg-white shadow-xl border-r border-purple-100 min-h-screen">
            <nav className="p-6">
              <ul className="space-y-3">
                {navigationItems.map((item) => {
                  const isActive = location === item.href || (location === "/" && item.href === "/dashboard");
                  
                  return (
                    <li key={item.href}>
                      <Link href={item.href}>
                        <Button
                          variant={isActive ? "default" : "ghost"}
                          className={`w-full justify-start space-x-3 ${
                            isActive 
                              ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:from-purple-700 hover:to-pink-600" 
                              : "text-gray-700 hover:text-purple-600 hover:bg-purple-50"
                          }`}
                        >
                          <i className={`fas fa-${item.icon} w-5`}></i>
                          <span>{item.label}</span>
                        </Button>
                      </Link>
                    </li>
                  );
                })}
                
                {/* Role-specific sections */}
                {userRole === ROLES.ADMIN && (
                  <>
                    <li className="pt-4">
                      <Separator />
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-3 block">
                        Admin Panel
                      </span>
                    </li>
                  </>
                )}
                
                {userRole === ROLES.OFFICER && (
                  <>
                    <li className="pt-4">
                      <Separator />
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-3 block">
                        Officer Tasks
                      </span>
                    </li>
                  </>
                )}
                
                {userRole === ROLES.USER && (
                  <>
                    <li className="pt-4">
                      <Separator />
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-3 block">
                        User Actions
                      </span>
                    </li>
                  </>
                )}
              </ul>
            </nav>
          </aside>
        )}

        {/* Main Content */}
        <main className={`flex-1 ${isConnected ? 'p-8' : 'p-4'}`}>
          {!isConnected && (
            <div className="max-w-md mx-auto mt-20">
              <div className="bg-white rounded-xl shadow-xl border border-purple-100 p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wifi className="text-white" size={24} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Wallet</h2>
                <p className="text-gray-600 mb-6">
                  Please connect your MetaMask wallet to access the SecureFIR system.
                </p>
                <WalletConnection />
              </div>
            </div>
          )}
          
          {isConnected && children}
        </main>
      </div>
    </div>
  );
}
