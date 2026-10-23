import React, { Fragment } from 'react';
import { Dialog } from '@headlessui/react';
import { NavLink, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  XMarkIcon,
  HomeIcon,
  UsersIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  ViewColumnsIcon,
  EnvelopeIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  SparklesIcon,
  DocumentTextIcon,
  CodeBracketIcon,
  ClipboardDocumentListIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  CurrencyDollarIcon,
  ShoppingCartIcon,
  ReceiptPercentIcon,
  ArchiveBoxIcon,
  UserGroupIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/', icon: ChartBarIcon, end: true },
  { name: 'Leads', href: '/leads', icon: UsersIcon },
  { name: 'Messages', href: '/messages', icon: ChatBubbleLeftRightIcon },
  { name: 'Calendar', href: '/calendar', icon: CalendarDaysIcon },
  { name: 'Deals', href: '/deals', icon: CurrencyDollarIcon },
  { name: 'Reports', href: '/reports', icon: DocumentTextIcon },
  { name: 'Pricing', href: '/pricing', icon: CurrencyDollarIcon },
];

const storeNavigation = [
  { name: 'New Sale', href: '/billing', icon: ShoppingCartIcon },
  { name: 'Sales Register', href: '/sales', icon: ReceiptPercentIcon },
  { name: 'Products & Stock', href: '/products', icon: ArchiveBoxIcon },
  { name: 'Customers', href: '/customers', icon: UserGroupIcon },
  { name: 'Store Profile', href: '/store-profile', icon: BuildingStorefrontIcon },
];

const NavItem = ({ item }) => (
  <NavLink
    to={item.href}
    end={item.end}
    className={({ isActive }) =>
      clsx(
        isActive ? 'bg-black text-white' : 'text-black hover:bg-gray-100',
        'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200'
      )
    }
  >
    {({ isActive }) => (
      <>
        <item.icon
          className={clsx(isActive ? 'text-white' : 'text-black', 'mr-3 h-5 w-5 flex-shrink-0')}
          aria-hidden="true"
        />
        {item.name}
      </>
    )}
  </NavLink>
);

const Sidebar = ({ isOpen, onClose, user }) => {
  const location = useLocation();
  
  // Ensure isOpen is always a boolean
  const isSidebarOpen = Boolean(isOpen);

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white">
      {/* Logo */}
      <div className="flex items-center flex-shrink-0 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <span className="text-sm font-bold text-white">LF</span>
          </div>
          <div className="ml-3">
            <h1 className="text-xl font-bold text-black">LeadFlowCRM</h1>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
        {navigation.map((item) => (
          <NavItem key={item.name} item={item} />
        ))}
        <p className="px-3 pt-4 pb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">Store</p>
        {storeNavigation.map((item) => (
          <NavItem key={item.name} item={item} />
        ))}
      </nav>

      {/* Settings at bottom */}
      <div className="px-4 pb-4 border-t border-gray-200 pt-4 space-y-2">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            clsx(
              isActive
                ? 'bg-black text-white'
                : 'text-black hover:bg-gray-100',
              'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200'
            )
          }
        >
          {({ isActive }) => (
            <>
              <Cog6ToothIcon
                className={clsx(
                  isActive ? 'text-white' : 'text-black',
                  'mr-3 h-5 w-5 flex-shrink-0'
                )}
                aria-hidden="true"
              />
              Settings
            </>
          )}
        </NavLink>
        <NavLink
          to="/integrations"
          className={({ isActive }) =>
            clsx(
              isActive
                ? 'bg-black text-white'
                : 'text-black hover:bg-gray-100',
              'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200'
            )
          }
        >
          {({ isActive }) => (
            <>
              <CodeBracketIcon
                className={clsx(
                  isActive ? 'text-white' : 'text-black',
                  'mr-3 h-5 w-5 flex-shrink-0'
                )}
                aria-hidden="true"
              />
              Integrations
            </>
          )}
        </NavLink>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile sidebar */}
      <Dialog 
        as="div" 
        className="relative z-50 lg:hidden" 
        open={isSidebarOpen}
        onClose={onClose}
      >
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
        <div className="fixed inset-0 flex">
          <Dialog.Panel className="relative flex w-full max-w-xs flex-1 flex-col bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={onClose}
              >
                <span className="sr-only">Close sidebar</span>
                <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
              </button>
            </div>
            <SidebarContent />
          </Dialog.Panel>
          <div className="w-14 flex-shrink-0" aria-hidden="true">
            {/* Force sidebar to shrink to fit close icon */}
          </div>
        </div>
      </Dialog>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <SidebarContent />
      </div>
    </>
  );
};

export default Sidebar;