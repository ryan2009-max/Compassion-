import React, { Suspense, lazy, Component } from "react";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminManagement from "./pages/admin/AdminManagement";
import UserDashboard from "./pages/user/UserDashboard";
import NotFound from "./pages/NotFound";
const OfflinePage = lazy(() => import("./pages/offline/OfflinePage"));

const queryClient = new QueryClient();

class ErrorBoundary extends Component<{ children?: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch() {}
  render() {
    if (this.state.hasError) {
      return <div className="p-6 text-center text-sm">Something went wrong. Please refresh.</div>;
    }
    return this.props.children;
  }
}

const PageContainer = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  return (
    <div key={location.pathname} className="animate-fade-in">
      {children}
    </div>
  );
};

const App = () => {
  const online = useOnlineStatus();
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {!online && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-black text-xs text-center py-1">
            You are offline. Some features may be unavailable.
          </div>
        )}
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <ErrorBoundary>
            <PageContainer>
              <Suspense fallback={<div className="p-4 text-center text-sm">Loading...</div>}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/management" element={<AdminManagement />} />
                  <Route path="/user/dashboard" element={<UserDashboard />} />
                  <Route path="/offline" element={<OfflinePage />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </PageContainer>
          </ErrorBoundary>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
