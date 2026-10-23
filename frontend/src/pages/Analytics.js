import React from 'react';
import { ChartBarIcon } from '@heroicons/react/24/outline';

const Analytics = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Business insights and performance metrics</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="text-center py-12">
          <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Dashboard</h3>
          <p className="text-gray-600">
            Advanced analytics with AI-powered insights and predictive modeling.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Analytics;