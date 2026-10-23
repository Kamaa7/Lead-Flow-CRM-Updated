import React from 'react';
import { clsx } from 'clsx';
import { DOC_TYPE_LABELS } from '../../services/storeApi';

const STATUS_STYLES = {
  paid: 'bg-green-100 text-green-800',
  partial: 'bg-yellow-100 text-yellow-800',
  unpaid: 'bg-red-100 text-red-800',
};

export const StatusBadge = ({ status }) => (
  <span className={clsx('px-2 py-1 text-xs font-medium rounded-full', STATUS_STYLES[status] || 'bg-gray-100 text-gray-800')}>
    {status ? status.charAt(0).toUpperCase() + status.slice(1) : '-'}
  </span>
);

export const DocTypeBadge = ({ docType }) => (
  <span
    className={clsx(
      'px-2 py-1 text-xs font-medium rounded-full',
      docType === 'bill' ? 'bg-blue-100 text-blue-800' : 'bg-gray-900 text-white'
    )}
  >
    {DOC_TYPE_LABELS[docType] || docType}
  </span>
);

export const PageHeader = ({ title, subtitle, actions }) => (
  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      {subtitle && <p className="text-gray-600">{subtitle}</p>}
    </div>
    {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
  </div>
);

export const StatCard = ({ label, value, tone = 'default' }) => (
  <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
    <p className="text-sm font-medium text-gray-600">{label}</p>
    <p
      className={clsx(
        'mt-1 text-2xl font-semibold',
        tone === 'danger' ? 'text-red-600' : tone === 'success' ? 'text-green-700' : 'text-gray-900'
      )}
    >
      {value}
    </p>
  </div>
);

export const ErrorBanner = ({ message }) =>
  message ? (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{message}</div>
  ) : null;

export const Field = ({ label, required, children, className }) => (
  <div className={className}>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
      {required && ' *'}
    </label>
    {children}
  </div>
);
