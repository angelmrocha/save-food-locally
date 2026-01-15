import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LocationProvider } from "@/contexts/LocationContext";
import { LoadingSpinner } from "@/components/LoadingSpinner";

import Auth from "./pages/Auth";
import ClientFeed from "./pages/ClientFeed";
import Categories from "./pages/Categories";
import SurpriseBags from "./pages/SurpriseBags";
import Profile from "./pages/Profile";
import ProductDetail from "./pages/ProductDetail";
import MerchantDashboard from "./pages/MerchantDashboard";
import ONGDashboard from "./pages/ONGDashboard";
import DonationConfirmation from "./pages/DonationConfirmation";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner text="Carregando..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" text="Carregando Save Food..." />
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          user ? (
            profile?.role === 'merchant' ? (
              <Navigate to="/merchant" replace />
            ) : profile?.role === 'ong' ? (
              <Navigate to="/ong" replace />
            ) : (
              <Navigate to="/feed" replace />
            )
          ) : (
            <Navigate to="/auth" replace />
          )
        }
      />
      <Route path="/auth" element={user ? <Navigate to="/" replace /> : <Auth />} />
      <Route path="/feed" element={<ProtectedRoute><ClientFeed /></ProtectedRoute>} />
      <Route path="/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
      <Route path="/surprise-bags" element={<ProtectedRoute><SurpriseBags /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/product/:id" element={<ProtectedRoute><ProductDetail /></ProtectedRoute>} />
      <Route path="/merchant" element={<ProtectedRoute><MerchantDashboard /></ProtectedRoute>} />
      <Route path="/ong" element={<ProtectedRoute><ONGDashboard /></ProtectedRoute>} />
      <Route path="/donation/:id" element={<ProtectedRoute><DonationConfirmation /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <LocationProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </LocationProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
