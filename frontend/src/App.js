import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Properties from './pages/Properties';
import Tasks from './pages/Tasks';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Billing from './pages/Billing';
import Sales from './pages/Sales';
import SaleDetail from './pages/SaleDetail';
import SalePrint from './pages/SalePrint';
import StoreProfile from './pages/StoreProfile';
import LoadingSpinner from './components/LoadingSpinner';

// Simple auth wrapper component
const AuthWrapper = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user && !['/login', '/register'].includes(location.pathname)) {
      navigate('/login');
    }
  }, [user, loading, location.pathname, navigate]);

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!user && !['/login', '/register'].includes(location.pathname)) {
    return null; // Will be redirected by the useEffect
  }

  return children;
};

function AppRoutes() {
  const { user } = useAuth();
  const location = useLocation();

  // Public routes that don't require authentication
  if (['/login', '/register'].includes(location.pathname)) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Protected routes
  return (
    <Routes>
      <Route path="/sales/:id/print" element={<SalePrint />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Navigate to="/" replace />} />
        <Route path="/leads" element={<Leads />} />
        <Route path="/properties" element={<Properties />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/sales" element={<Sales />} />
        <Route path="/sales/:id" element={<SaleDetail />} />
        <Route path="/products" element={<Products />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/store-profile" element={<StoreProfile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-100">
        <AuthWrapper>
          <AppRoutes />
        </AuthWrapper>
      </div>
    </AuthProvider>
  );
}

export default App;