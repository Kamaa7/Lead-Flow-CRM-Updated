import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';

const Footer = () => (
  <footer className="w-full border-t border-gray-200 bg-white mt-16">
    <div className="max-w-7xl mx-auto py-12 px-6 grid grid-cols-1 md:grid-cols-4 gap-8 text-sm text-gray-700">
      <div>
        <div className="flex items-center mb-2">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <span className="text-sm font-bold text-white">LF</span>
          </div>
          <span className="ml-2 text-lg font-bold text-black">LeadFlowCRM</span>
        </div>
        <p className="text-gray-500 mb-4">The modern CRM solution for Microsoft Access users.</p>
      </div>
      <div>
        <h4 className="font-semibold mb-2">Product</h4>
        <ul>
          <li><a href="#" className="hover:underline">Features</a></li>
          <li><a href="#" className="hover:underline">Pricing</a></li>
          <li><a href="#" className="hover:underline">Testimonials</a></li>
          <li><a href="#" className="hover:underline">FAQ</a></li>
        </ul>
      </div>
      <div>
        <h4 className="font-semibold mb-2">Company</h4>
        <ul>
          <li><a href="#" className="hover:underline">About</a></li>
          <li><a href="#" className="hover:underline">Blog</a></li>
          <li><a href="#" className="hover:underline">Careers</a></li>
          <li><a href="#" className="hover:underline">Contact</a></li>
        </ul>
      </div>
      <div>
        <h4 className="font-semibold mb-2">Legal</h4>
        <ul>
          <li><a href="#" className="hover:underline">Privacy Policy</a></li>
          <li><a href="#" className="hover:underline">Terms of Service</a></li>
          <li><a href="#" className="hover:underline">Cookie Policy</a></li>
        </ul>
      </div>
    </div>
    <div className="text-center text-xs text-gray-400 py-4 border-t border-gray-100">© 2025 LeadFlowCRM. All rights reserved.</div>
  </footer>
);

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, loading } = useAuth();

  // Hide sidebar on mobile when route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        user={user}
      />
      <div className="lg:pl-64 flex-1 flex flex-col">
        <Header 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
          user={user}
          onSignOut={handleSignOut}
        />
        <main className="py-6 px-4 sm:px-6 lg:px-8 flex-1">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Layout;