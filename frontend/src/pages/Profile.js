import React from 'react';
import { UserCircleIcon, EnvelopeIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

const Profile = () => {
  const { user } = useAuth();
  const meta = user?.user_metadata || {};

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 bg-gray-50">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Profile Information</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Personal details and information.</p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <UserCircleIcon className="h-5 w-5 mr-2 text-gray-400" />
                Full name
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {meta.full_name || 'Not provided'}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <EnvelopeIcon className="h-5 w-5 mr-2 text-gray-400" />
                Email address
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {user?.email || 'Not provided'}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <BuildingOfficeIcon className="h-5 w-5 mr-2 text-gray-400" />
                Company
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {meta.company || 'Not provided'}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
};

export default Profile;
