import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WalletProvider } from "./hooks/use-wallet";
import Layout from "./components/layout";
import Dashboard from "./pages/dashboard";
import FileFir from "./pages/file-fir";
import VerifyUsers from "./pages/verify-users";
import ManageOfficers from "./pages/manage-officers";
import FirTracking from "./pages/fir-tracking";
import UserRegistration from "./pages/user-registration";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/file-fir" component={FileFir} />
        <Route path="/verify-users" component={VerifyUsers} />
        <Route path="/manage-officers" component={ManageOfficers} />
        <Route path="/fir-tracking" component={FirTracking} />
        <Route path="/register" component={UserRegistration} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </WalletProvider>
    </QueryClientProvider>
  );
}

export default App;
