import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  UsersIcon, 
  PlusIcon, 
  PhoneIcon, 
  EnvelopeIcon,
  BuildingOfficeIcon,
  TagIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { fetchLeads, createLead, updateLead, deleteLead } from '../store/leadsSlice';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const Leads = () => {
  const dispatch = useDispatch();
  const { leads, loading, error } = useSelector((state) => state.leads);
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    status: 'new',
    score: 0,
    source: '',
    notes: ''
  });

  useEffect(() => {
    dispatch(fetchLeads({}));
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingLead) {
        await dispatch(updateLead({ id: editingLead.id, data: formData })).unwrap();
        toast.success('Lead updated successfully');
      } else {
        if (!user) {
          toast.error('You must be logged in to create a lead.');
          return;
        }
        await dispatch(createLead({ ...formData, user_id: user.id })).unwrap();
        toast.success('Lead created successfully');
      }
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      toast.error(error);
    }
  };

  const handleEdit = (lead) => {
    setEditingLead(lead);
    setFormData({
      name: lead.name,
      email: lead.email,
      phone: lead.phone || '',
      company: lead.company || '',
      status: lead.status,
      score: lead.score || 0,
      source: lead.source || '',
      notes: lead.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (lead) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      try {
        await dispatch(deleteLead(lead.id)).unwrap();
        toast.success('Lead deleted successfully');
      } catch (error) {
        toast.error(error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      status: 'new',
      score: 0,
      source: '',
      notes: ''
    });
    setEditingLead(null);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      new: 'bg-blue-100 text-blue-800',
      contacted: 'bg-yellow-100 text-yellow-800',
      qualified: 'bg-green-100 text-green-800',
      converted: 'bg-purple-100 text-purple-800',
      lost: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getScoreStars = (score) => {
    const stars = Math.min(Math.max(Math.floor(score / 20), 0), 5);
    return (
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <StarIcon
            key={i}
            className={`h-4 w-4 ${i < stars ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (value, item) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{item.email}</div>
        </div>
      )
    },
    {
      key: 'company',
      label: 'Company',
      render: (value) => value || '-'
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (value) => value || '-'
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => getStatusBadge(value)
    },
    {
      key: 'score',
      label: 'Score',
      render: (value) => (
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">{value || 0}</span>
          {getScoreStars(value || 0)}
        </div>
      )
    },
    {
      key: 'source',
      label: 'Source',
      render: (value) => value || '-'
    }
  ];

  if (loading && leads.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-gray-600">Manage your leads and track conversions</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center space-x-2">
          <PlusIcon className="h-5 w-5" />
          <span>Add Lead</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-500">
              <UsersIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Leads</p>
              <p className="text-2xl font-semibold text-gray-900">{leads.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-500">
              <PhoneIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Contacted</p>
              <p className="text-2xl font-semibold text-gray-900">
                {leads.filter(lead => lead.status === 'contacted').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-500">
              <StarIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Qualified</p>
              <p className="text-2xl font-semibold text-gray-900">
                {leads.filter(lead => lead.status === 'qualified').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-500">
              <TagIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Converted</p>
              <p className="text-2xl font-semibold text-gray-900">
                {leads.filter(lead => lead.status === 'converted').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <DataTable
        data={leads}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Add/Edit Lead Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={editingLead ? 'Edit Lead' : 'Add New Lead'}
        size="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company
              </label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="input-field"
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="converted">Converted</option>
                <option value="lost">Lost</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Score (0-100)
              </label>
              <input
                type="number"
                name="score"
                value={formData.score}
                onChange={handleChange}
                min="0"
                max="100"
                className="input-field"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Source
              </label>
              <input
                type="text"
                name="source"
                value={formData.source}
                onChange={handleChange}
                placeholder="e.g., Website, Referral, Social Media"
                className="input-field"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="input-field"
                placeholder="Additional notes about this lead..."
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? <LoadingSpinner size="small" /> : (editingLead ? 'Update Lead' : 'Create Lead')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Leads;