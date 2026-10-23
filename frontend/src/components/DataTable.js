import React, { useState } from 'react';
import { 
  ChevronUpIcon, 
  ChevronDownIcon, 
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { Menu } from '@headlessui/react';
import { Fragment } from 'react';
import { clsx } from 'clsx';

const DataTable = ({ 
  data = [], 
  columns = [], 
  onEdit, 
  onDelete, 
  searchable = true,
  sortable = true 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const handleSort = (key) => {
    if (!sortable) return;
    
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredData = data.filter(item =>
    Object.values(item).some(value =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {searchable && (
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={clsx(
                    'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
                    sortable && 'cursor-pointer hover:bg-gray-100'
                  )}
                  onClick={() => handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {sortable && sortConfig.key === column.key && (
                      sortConfig.direction === 'asc' ? 
                        <ChevronUpIcon className="h-4 w-4" /> : 
                        <ChevronDownIcon className="h-4 w-4" />
                    )}
                  </div>
                </th>
              ))}
              {(onEdit || onDelete) && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedData.map((item, index) => (
              <tr key={item.id || index} className="hover:bg-gray-50">
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {column.render ? column.render(item[column.key], item) : item[column.key]}
                  </td>
                ))}
                {(onEdit || onDelete) && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Menu as="div" className="relative inline-block text-left">
                      <Menu.Button className="p-2 rounded-md text-gray-400 hover:text-gray-600">
                        <EllipsisVerticalIcon className="h-5 w-5" />
                      </Menu.Button>
                      <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <div className="px-1 py-1">
                          {onEdit && (
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => onEdit(item)}
                                  className={clsx(
                                    active ? 'bg-primary-500 text-white' : 'text-gray-900',
                                    'group flex w-full items-center rounded-md px-2 py-2 text-sm'
                                  )}
                                >
                                  <PencilIcon className="mr-2 h-5 w-5" />
                                  Edit
                                </button>
                              )}
                            </Menu.Item>
                          )}
                          {onDelete && (
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => onDelete(item)}
                                  className={clsx(
                                    active ? 'bg-red-500 text-white' : 'text-gray-900',
                                    'group flex w-full items-center rounded-md px-2 py-2 text-sm'
                                  )}
                                >
                                  <TrashIcon className="mr-2 h-5 w-5" />
                                  Delete
                                </button>
                              )}
                            </Menu.Item>
                          )}
                        </div>
                      </Menu.Items>
                    </Menu>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        
        {sortedData.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No data found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataTable;