import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { FloatingAIChatWidget } from './components/common/FloatingAIChatWidget';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { LostItemsPage } from './pages/LostItemsPage';
import { FoundItemsPage } from './pages/FoundItemsPage';
import { ItemDetailsPage } from './pages/ItemDetailsPage';
import { ReportLostPage } from './pages/ReportLostPage';
import { ReportFoundPage } from './pages/ReportFoundPage';
import { MatchesPage } from './pages/MatchesPage';
import { ChatbotPage } from './pages/ChatbotPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ClaimsPage } from './pages/ClaimsPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

// Protected Route Guard for Authenticated Students
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading session...</div>;
  }
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// Admin Route Guard
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading session...</div>;
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <div className="flex flex-col min-h-screen bg-slate-50 font-sans selection:bg-brand-500 selection:text-white">
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/lost-items" element={<LostItemsPage />} />
                <Route path="/found-items" element={<FoundItemsPage />} />
                <Route path="/items/:type/:id" element={<ItemDetailsPage />} />
                <Route path="/chatbot" element={<ChatbotPage />} />

                {/* Protected Student Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/report-lost"
                  element={
                    <ProtectedRoute>
                      <ReportLostPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/report-found"
                  element={
                    <ProtectedRoute>
                      <ReportFoundPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/matches"
                  element={
                    <ProtectedRoute>
                      <MatchesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/claims"
                  element={
                    <ProtectedRoute>
                      <ClaimsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/notifications"
                  element={
                    <ProtectedRoute>
                      <NotificationsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Protected Routes */}
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <AdminDashboardPage />
                    </AdminRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
            <FloatingAIChatWidget />
          </div>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;
