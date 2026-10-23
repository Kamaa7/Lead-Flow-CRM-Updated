import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { FaGoogle, FaMapMarkedAlt, FaRegCalendarAlt, FaMicrosoft, FaBolt, FaRegFileAlt, FaRegFileExcel, FaRegFileWord, FaPlus } from 'react-icons/fa';

const integrations = [
  {
    name: 'Google Maps',
    icon: <FaMapMarkedAlt className="h-8 w-8 text-blue-500" />,
    description: 'Visualize and manage locations for leads, properties, and deals.',
    connectText: 'Connect Google Maps',
  },
  {
    name: 'Google Sheets',
    icon: <FaRegFileExcel className="h-8 w-8 text-green-500" />,
    description: 'Sync and export CRM data to Google Sheets for analysis and reporting.',
    connectText: 'Connect Sheets',
  },
  {
    name: 'Google Docs',
    icon: <FaRegFileWord className="h-8 w-8 text-blue-600" />,
    description: 'Generate and manage documents directly from your CRM.',
    connectText: 'Connect Docs',
  },
  {
    name: 'Outlook',
    icon: <FaMicrosoft className="h-8 w-8 text-blue-700" />,
    description: 'Sync emails, calendar events, and contacts with Microsoft Outlook.',
    connectText: 'Connect Outlook',
  },
  {
    name: 'Zapier',
    icon: <FaBolt className="h-8 w-8 text-yellow-500" />,
    description: 'Automate workflows and connect to 5,000+ other apps with Zapier.',
    connectText: 'Connect Zapier',
  },
  {
    name: 'Calendly',
    icon: <FaRegCalendarAlt className="h-8 w-8 text-purple-500" />,
    description: 'Let leads and clients book meetings directly into your calendar.',
    connectText: 'Connect Calendly',
  },
  {
    name: 'DaySchedule',
    icon: <FaRegCalendarAlt className="h-8 w-8 text-indigo-500" />,
    description: 'Advanced scheduling and appointment management for your team.',
    connectText: 'Connect DaySchedule',
  },
  {
    name: 'More Integrations',
    icon: <FaPlus className="h-8 w-8 text-gray-400" />,
    description: 'Connect to hundreds of other apps via API or automation tools.',
    connectText: 'Explore More',
  },
];

function IntegrationModal({ open, onClose, integration, connected, onConnect }) {
  if (!integration) return null;
  
  return (
    <Dialog 
      open={Boolean(open)} 
      onClose={onClose} 
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md text-center">
          <div className="flex flex-col items-center mb-4">{integration.icon}</div>
          <Dialog.Title as="h2" className="text-xl font-bold mb-2">{integration.name}</Dialog.Title>
          <Dialog.Description className="text-gray-600 mb-6">
            {integration.description}
          </Dialog.Description>
          {!connected ? (
            <>
              <p className="text-gray-700 mb-6">
                To connect, you will be securely redirected to authenticate with {integration.name}. 
                After connecting, you will be returned to LeadFlow CRM.
              </p>
              <button 
                onClick={onConnect} 
                className="btn-primary w-full mb-2"
              >
                Connect
              </button>
              <button 
                onClick={onClose} 
                className="btn-secondary w-full"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <div className="text-green-600 font-semibold mb-4">
                Successfully connected to {integration.name}!
              </div>
              <button 
                onClick={onClose} 
                className="btn-primary w-full"
              >
                Close
              </button>
            </>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

export default function APIIntegration() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [connected, setConnected] = useState(false);

  const handleOpenModal = (integration) => {
    setSelectedIntegration(integration);
    setConnected(false);
    setModalOpen(true);
  };

  const handleConnect = () => {
    setConnected(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedIntegration(null);
    setConnected(false);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">API & App Integrations</h1>
      <p className="text-gray-600 mb-8">Connect your CRM to the tools you already use. Automate workflows, sync data, and unlock new possibilities with powerful integrations.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((integration) => (
          <div key={integration.name} className="card flex flex-col items-center text-center">
            <div className="mb-4">{integration.icon}</div>
            <h2 className="text-lg font-semibold mb-2">{integration.name}</h2>
            <p className="text-gray-500 mb-4">{integration.description}</p>
            <button className="btn-primary w-full" onClick={() => handleOpenModal(integration)}>{integration.connectText}</button>
          </div>
        ))}
      </div>
      <IntegrationModal
        open={modalOpen}
        onClose={handleCloseModal}
        integration={selectedIntegration}
        connected={connected}
        onConnect={handleConnect}
      />
    </div>
  );
}