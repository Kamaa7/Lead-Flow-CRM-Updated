import React, { useState } from 'react';
import { 
  EnvelopeIcon, 
  PlusIcon, 
  PaperAirplaneIcon,
  InboxIcon,
  DocumentTextIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import Modal from '../components/Modal';
import FeatureCard from '../components/FeatureCard';
import toast from 'react-hot-toast';

const EmailCenter = () => {
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('compose');
  const [emailData, setEmailData] = useState({
    to: '',
    subject: '',
    body: '',
    template: ''
  });

  const handleSendEmail = (e) => {
    e.preventDefault();
    // Simulate sending email
    toast.success('Email sent successfully!');
    setIsComposeOpen(false);
    setEmailData({ to: '', subject: '', body: '', template: '' });
  };

  const handleChange = (e) => {
    setEmailData({
      ...emailData,
      [e.target.name]: e.target.value
    });
  };

  const emailTemplates = [
    {
      id: 1,
      name: 'Welcome Email',
      subject: 'Welcome to LeadFlow CRM!',
      body: 'Thank you for joining LeadFlow CRM. We\'re excited to help you manage your leads and grow your business.'
    },
    {
      id: 2,
      name: 'Follow-up Email',
      subject: 'Following up on our conversation',
      body: 'Hi there! I wanted to follow up on our recent conversation about your property needs.'
    },
    {
      id: 3,
      name: 'Property Update',
      subject: 'New property matches your criteria',
      body: 'We found a new property that matches your search criteria. Would you like to schedule a viewing?'
    }
  ];

  const handleTemplateSelect = (template) => {
    setEmailData({
      ...emailData,
      subject: template.subject,
      body: template.body
    });
    setIsTemplateOpen(false);
  };

  const tabs = [
    { id: 'compose', name: 'Compose', icon: PlusIcon },
    { id: 'inbox', name: 'Inbox', icon: InboxIcon },
    { id: 'templates', name: 'Templates', icon: DocumentTextIcon },
    { id: 'campaigns', name: 'Campaigns', icon: UserGroupIcon },
    { id: 'analytics', name: 'Analytics', icon: ChartBarIcon },
    { id: 'settings', name: 'Settings', icon: Cog6ToothIcon }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Center</h1>
          <p className="text-gray-600">Email campaigns and auto-responders</p>
        </div>
        <button onClick={() => setIsComposeOpen(true)} className="btn-primary flex items-center space-x-2">
          <PlusIcon className="h-5 w-5" />
          <span>Compose Email</span>
        </button>
      </div>

      {/* Email Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-500">
              <EnvelopeIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Emails Sent</p>
              <p className="text-2xl font-semibold text-gray-900">1,234</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-500">
              <ChartBarIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Open Rate</p>
              <p className="text-2xl font-semibold text-gray-900">24.5%</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-500">
              <PaperAirplaneIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Click Rate</p>
              <p className="text-2xl font-semibold text-gray-900">3.2%</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-500">
              <UserGroupIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Subscribers</p>
              <p className="text-2xl font-semibold text-gray-900">5,678</p>
            </div>
          </div>
        </div>
      </div>

      {/* Email Features */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'compose' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard
                icon={PlusIcon}
                title="New Email"
                description="Compose and send a new email to your contacts"
                onClick={() => setIsComposeOpen(true)}
                color="bg-blue-500"
              />
              <FeatureCard
                icon={DocumentTextIcon}
                title="Use Template"
                description="Start with a pre-designed email template"
                onClick={() => setIsTemplateOpen(true)}
                color="bg-green-500"
              />
              <FeatureCard
                icon={UserGroupIcon}
                title="Bulk Email"
                description="Send emails to multiple contacts at once"
                onClick={() => toast('Bulk email feature coming soon!')}
                color="bg-purple-500"
              />
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Email Templates</h3>
                <button className="btn-primary">Create Template</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {emailTemplates.map((template) => (
                  <div key={template.id} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">{template.name}</h4>
                    <p className="text-sm text-gray-600 mb-2">{template.subject}</p>
                    <p className="text-xs text-gray-500 mb-4 line-clamp-3">{template.body}</p>
                    <button
                      onClick={() => handleTemplateSelect(template)}
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      Use Template
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'inbox' && (
            <div className="text-center py-12">
              <InboxIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Email Inbox</h3>
              <p className="text-gray-600">Inbox functionality coming soon!</p>
            </div>
          )}

          {activeTab === 'campaigns' && (
            <div className="text-center py-12">
              <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Email Campaigns</h3>
              <p className="text-gray-600">Create and manage email campaigns with automation!</p>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="text-center py-12">
              <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Email Analytics</h3>
              <p className="text-gray-600">Track email performance and engagement metrics!</p>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="text-center py-12">
              <Cog6ToothIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Email Settings</h3>
              <p className="text-gray-600">Configure email settings and preferences!</p>
            </div>
          )}
        </div>
      </div>

      {/* Compose Email Modal */}
      <Modal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        title="Compose Email"
        size="max-w-4xl"
      >
        <form onSubmit={handleSendEmail} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To *
            </label>
            <input
              type="email"
              name="to"
              value={emailData.to}
              onChange={handleChange}
              className="input-field"
              placeholder="recipient@example.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject *
            </label>
            <input
              type="text"
              name="subject"
              value={emailData.subject}
              onChange={handleChange}
              className="input-field"
              placeholder="Email subject"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message *
            </label>
            <textarea
              name="body"
              value={emailData.body}
              onChange={handleChange}
              rows={10}
              className="input-field"
              placeholder="Write your email message here..."
              required
            />
          </div>
          
          <div className="flex justify-between items-center pt-4">
            <button
              type="button"
              onClick={() => setIsTemplateOpen(true)}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              Use Template
            </button>
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setIsComposeOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary flex items-center space-x-2"
              >
                <PaperAirplaneIcon className="h-4 w-4" />
                <span>Send Email</span>
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Template Selection Modal */}
      <Modal
        isOpen={isTemplateOpen}
        onClose={() => setIsTemplateOpen(false)}
        title="Choose Email Template"
        size="max-w-2xl"
      >
        <div className="grid grid-cols-1 gap-4">
          {emailTemplates.map((template) => (
            <div
              key={template.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 cursor-pointer"
              onClick={() => handleTemplateSelect(template)}
            >
              <h4 className="font-medium text-gray-900 mb-2">{template.name}</h4>
              <p className="text-sm text-gray-600 mb-2">{template.subject}</p>
              <p className="text-xs text-gray-500">{template.body}</p>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default EmailCenter;