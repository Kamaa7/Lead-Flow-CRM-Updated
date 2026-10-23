import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bars3Icon, 
  BellIcon, 
  MagnifyingGlassIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ArrowDownTrayIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { Menu } from '@headlessui/react';
import { Fragment } from 'react';
import { clsx } from 'clsx';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';

const Header = ({ onMenuClick, user, onSignOut }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  // Fetch notifications from Supabase
  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Initial fetch
  React.useEffect(() => {
    fetchNotifications();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('notifications')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'notifications' },
        () => fetchNotifications()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleExport = async () => {
    try {
      const exportUrl = `${process.env.REACT_APP_API_URL}/export`;
      const { data: leads, error } = await supabase
        .from('leads')
        .select('*');
      
      if (error) throw error;
      
      if (!leads || leads.length === 0) {
        toast.error('No leads to export');
        return;
      }
      
      const headers = Object.keys(leads[0]);
      const csvRows = [
        headers.join(','),
        ...leads.map(lead => headers.map(h => JSON.stringify(lead[h] ?? '')).join(','))
      ];
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = 'leads.csv';
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      window.open(exportUrl, '_blank');
    } catch (error) {
      console.error('Error exporting leads:', error);
      toast.error('Failed to export leads');
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side */}
          <div className="flex items-center">
            <button
              type="button"
              className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
              onClick={onMenuClick}
            >
              <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            </button>
            
            {/* Logo and Search */}
            <div className="flex items-center space-x-4">
              {/* Logo */}
              <div className="flex items-center">
                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                  <span className="text-sm font-bold text-white">LF</span>
                </div>
                {/* Removed LeadFlowCRM text */}
              </div>
              
              {/* Search */}
              <div className={`${isSearchVisible ? 'block' : 'hidden'} md:block`}>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    type="search"
                    placeholder="Search leads, contacts, deals..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full md:w-[300px] lg:w-[400px] bg-white border border-gray-300 rounded-md py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:outline-none focus:text-gray-900 focus:placeholder-gray-400 focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                  <button 
                    onClick={() => setIsSearchVisible(false)}
                    className="md:hidden absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-500"
                  >
                    ×
                  </button>
                </div>
              </div>
              
              {/* Mobile search toggle */}
              <div className="md:hidden">
                <button
                  onClick={() => setIsSearchVisible(!isSearchVisible)}
                  className="p-2 text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <MagnifyingGlassIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Action buttons */}
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-black bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Export
            </button>
            
            <button
              type="button"
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-black hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              + Add Lead
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                type="button"
                className="relative p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-black"
                onClick={() => setNotificationsOpen((open) => !open)}
              >
                <span className="sr-only">View notifications</span>
                <BellIcon className="h-6 w-6" aria-hidden="true" />
                {/* Notification badge */}
                <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white"></span>
              </button>
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="p-4 border-b font-semibold text-gray-800">Notifications</div>
                  <ul className="max-h-60 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <li className="px-4 py-3 text-sm text-gray-500">No notifications yet.</li>
                    ) : (
                      notifications.map((n) => (
                        <li key={n.id} className="px-4 py-3 border-b text-sm text-gray-700 hover:bg-gray-50">
                          {n.message}
                          <span className="block text-xs text-gray-400 mt-1">{new Date(n.timestamp).toLocaleString()}</span>
                        </li>
                      ))
                    )}
                  </ul>
                  <button
                    className="w-full py-2 text-sm text-black hover:underline border-t border-gray-100 bg-gray-50 rounded-b-lg"
                    onClick={() => setNotificationsOpen(false)}
                  >
                    Close
                  </button>
                </div>
              )}
            </div>

            {/* Profile dropdown */}
            <Menu as="div" className="relative">
              
              <div>
                <Menu.Button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="h-8 w-8 rounded-full bg-black flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                </Menu.Button>
              </div>
                <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => navigate('/profile')}
                          className={clsx(
                            active ? 'bg-gray-100' : '',
                            'flex w-full items-center px-4 py-2 text-sm text-gray-700'
                          )}
                        >
                          <UserCircleIcon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
                          Your Profile
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => navigate('/settings')}
                          className={clsx(
                            active ? 'bg-gray-100' : '',
                            'flex w-full items-center px-4 py-2 text-sm text-gray-700'
                          )}
                        >
                          <Cog6ToothIcon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
                          Settings
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={onSignOut}
                          className={clsx(
                            active ? 'bg-gray-100' : '',
                            'flex w-full items-center px-4 py-2 text-sm text-gray-700'
                          )}
                        >
                          <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-gray-500" />
                          Sign out
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
            </Menu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;