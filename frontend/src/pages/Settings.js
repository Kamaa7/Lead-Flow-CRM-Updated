import React from 'react';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';

const Settings = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your account and preferences</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="text-center py-12">
          <Cog6ToothIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Settings</h3>
          <p className="text-gray-600">
            Configure your CRM settings, integrations, and AI preferences.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;