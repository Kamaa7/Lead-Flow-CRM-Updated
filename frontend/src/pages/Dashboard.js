import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboardStats } from '../store/analyticsSlice';
import { 
  UsersIcon, 
  BuildingOfficeIcon, 
  CheckCircleIcon, 
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarDaysIcon,
  SparklesIcon,
  ChatBubbleLeftRightIcon,
  BoltIcon,
  ChartBarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  PlusIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import LoadingSpinner from '../components/LoadingSpinner';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const dispatch = useDispatch();
  const { dashboardStats, loading } = useSelector((state) => state.analytics);
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    dispatch(fetchDashboardStats());
  }, [dispatch]);

  // Mock data for charts
  const monthlyLeadsData = [
    { month: 'Jan', leads: 65, converted: 12 },
    { month: 'Feb', leads: 78, converted: 15 },
    { month: 'Mar', leads: 90, converted: 18 },
    { month: 'Apr', leads: 81, converted: 16 },
    { month: 'May', leads: 95, converted: 22 },
    { month: 'Jun', leads: 112, converted: 28 },
  ];

  const leadsByStatusData = [
    { name: 'New', value: 45, color: '#000000' },
    { name: 'Contacted', value: 32, color: '#374151' },
    { name: 'Qualified', value: 18, color: '#6B7280' },
    { name: 'Converted', value: 25, color: '#9CA3AF' },
  ];

  const tasksByPriorityData = [
    { priority: 'High', count: 12, color: '#EF4444' },
    { priority: 'Medium', count: 25, color: '#F59E0B' },
    { priority: 'Low', count: 18, color: '#10B981' },
  ];

  const stats = [
    {
      name: 'Total Leads',
      value: dashboardStats.totalLeads || 1248,
      change: '+12%',
      changeType: 'positive',
      icon: UsersIcon,
      color: 'bg-black',
    },
    {
      name: 'Active Deals',
      value: `$${dashboardStats.totalProperties || 45231}`,
      change: '+7%',
      changeType: 'positive',
      icon: CurrencyDollarIcon,
      color: 'bg-black',
    },
    {
      name: 'Conversion Rate',
      value: dashboardStats.leadConversionRate || '24.5%',
      change: '+2.3%',
      changeType: 'positive',
      icon: ChartBarIcon,
      color: 'bg-black',
    },
    {
      name: 'New Messages',
      value: dashboardStats.totalTasks || 32,
      change: '+14 since yesterday',
      changeType: 'positive',
      icon: ChatBubbleLeftRightIcon,
      color: 'bg-black',
    },
  ];

  const recentLeads = [
    {
      id: 1,
      name: 'Sarah Johnson',
      company: 'Acme Corporation',
      status: 'New',
    },
    {
      id: 2,
      name: 'Michael Chen',
      company: 'Tech Solutions Inc',
      status: 'Contacted',
    },
    {
      id: 3,
      name: 'Emily Rodriguez',
      company: 'Global Industries',
      status: 'Qualified',
    },
    {
      id: 4,
      name: 'David Thompson',
      company: 'Innovation Labs',
      status: 'New',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black">Dashboard</h1>
        </div>
        <div className="flex items-center space-x-4">
          {/* Tabs */}
          <div className="flex space-x-8">
            {['overview', 'analytics', 'reports', 'notifications'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-sm font-medium capitalize ${
                  activeTab === tab
                    ? 'text-black border-b-2 border-black'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          
          {/* Search */}
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
              <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="search"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-48 bg-white border border-gray-300 rounded-md py-1 pl-8 pr-3 text-sm placeholder-gray-500 focus:outline-none focus:text-gray-900 focus:placeholder-gray-400 focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-semibold text-black">{stat.value}</p>
                <p className={`text-sm ${stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.change}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Acquisition */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-black">Lead Acquisition</h3>
            <p className="text-sm text-gray-600">Monthly lead acquisition trends for the current year.</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyLeadsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip />
                <Bar dataKey="leads" fill="#000000" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Leads */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-black">Recent Leads</h3>
            <p className="text-sm text-gray-600">Latest leads added to the system.</p>
          </div>
          <div className="space-y-3">
            {recentLeads.map((lead) => (
              <div key={lead.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <UsersIcon className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-black">{lead.name}</p>
                    <p className="text-xs text-gray-500">{lead.company}</p>
                  </div>
                </div>
                <button className="text-sm font-medium text-black hover:underline">
                  View
                </button>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <button className="w-full py-2 px-4 border border-black text-black bg-white hover:bg-gray-50 rounded-md text-sm font-medium transition-colors duration-200">
              View All Leads
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;