import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  BuildingOfficeIcon, 
  PlusIcon, 
  MapPinIcon,
  CurrencyDollarIcon,
  HomeIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import { fetchProperties, createProperty, updateProperty, deleteProperty } from '../store/propertiesSlice';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Properties = () => {
  const dispatch = useDispatch();
  const { properties, loading, error } = useSelector((state) => state.properties);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    address: '',
    price: '',
    property_type: 'house',
    status: 'available',
    description: ''
  });

  useEffect(() => {
    dispatch(fetchProperties({}));
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const propertyData = {
        ...formData,
        price: formData.price ? parseFloat(formData.price) : null
      };
      
      if (editingProperty) {
        await dispatch(updateProperty({ id: editingProperty.id, data: propertyData })).unwrap();
        toast.success('Property updated successfully');
      } else {
        await dispatch(createProperty(propertyData)).unwrap();
        toast.success('Property created successfully');
      }
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      toast.error(error);
    }
  };

  const handleEdit = (property) => {
    setEditingProperty(property);
    setFormData({
      title: property.title,
      address: property.address,
      price: property.price?.toString() || '',
      property_type: property.property_type,
      status: property.status,
      description: property.description || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (property) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      try {
        await dispatch(deleteProperty(property.id)).unwrap();
        toast.success('Property deleted successfully');
      } catch (error) {
        toast.error(error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      address: '',
      price: '',
      property_type: 'house',
      status: 'available',
      description: ''
    });
    setEditingProperty(null);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      available: 'bg-green-100 text-green-800',
      sold: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rented: 'bg-blue-100 text-blue-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatPrice = (price) => {
    if (!price) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const columns = [
    {
      key: 'title',
      label: 'Property',
      render: (value, item) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500 flex items-center">
            <MapPinIcon className="h-4 w-4 mr-1" />
            {item.address}
          </div>
        </div>
      )
    },
    {
      key: 'property_type',
      label: 'Type',
      render: (value) => (
        <span className="capitalize">{value.replace('_', ' ')}</span>
      )
    },
    {
      key: 'price',
      label: 'Price',
      render: (value) => formatPrice(value)
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => getStatusBadge(value)
    }
  ];

  if (loading && properties.length === 0) {
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
          <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
          <p className="text-gray-600">Manage your property listings and inventory</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center space-x-2">
          <PlusIcon className="h-5 w-5" />
          <span>Add Property</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-500">
              <BuildingOfficeIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Properties</p>
              <p className="text-2xl font-semibold text-gray-900">{properties.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-500">
              <TagIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Available</p>
              <p className="text-2xl font-semibold text-gray-900">
                {properties.filter(prop => prop.status === 'available').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-red-500">
              <HomeIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Sold</p>
              <p className="text-2xl font-semibold text-gray-900">
                {properties.filter(prop => prop.status === 'sold').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-500">
              <CurrencyDollarIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg. Price</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatPrice(properties.reduce((sum, prop) => sum + (prop.price || 0), 0) / properties.length || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Properties Table */}
      <DataTable
        data={properties}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Add/Edit Property Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={editingProperty ? 'Edit Property' : 'Add New Property'}
        size="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Property Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address *
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="input-field"
                placeholder="0.00"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Type
              </label>
              <select
                name="property_type"
                value={formData.property_type}
                onChange={handleChange}
                className="input-field"
              >
                <option value="house">House</option>
                <option value="apartment">Apartment</option>
                <option value="condo">Condo</option>
                <option value="townhouse">Townhouse</option>
                <option value="commercial">Commercial</option>
                <option value="land">Land</option>
              </select>
            </div>
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
              <option value="available">Available</option>
              <option value="pending">Pending</option>
              <option value="sold">Sold</option>
              <option value="rented">Rented</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="input-field"
              placeholder="Property description, features, etc..."
            />
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
              {loading ? <LoadingSpinner size="small" /> : (editingProperty ? 'Update Property' : 'Create Property')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Properties;