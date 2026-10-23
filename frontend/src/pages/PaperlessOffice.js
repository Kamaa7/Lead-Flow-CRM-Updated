import React, { useState } from 'react';
import { 
  DocumentTextIcon, 
  PlusIcon, 
  FolderIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  ShareIcon,
  DocumentDuplicateIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import Modal from '../components/Modal';
import FeatureCard from '../components/FeatureCard';
import toast from 'react-hot-toast';

const PaperlessOffice = () => {
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);
  const [isMergeOpen, setIsMergeOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('documents');
  const [mergeData, setMergeData] = useState({
    template: '',
    contact: '',
    property: ''
  });

  const documentTemplates = [
    {
      id: 1,
      name: 'Purchase Agreement',
      type: 'Contract',
      description: 'Standard real estate purchase agreement template',
      fields: ['buyer_name', 'seller_name', 'property_address', 'purchase_price']
    },
    {
      id: 2,
      name: 'Listing Agreement',
      type: 'Contract',
      description: 'Property listing agreement with commission terms',
      fields: ['owner_name', 'property_address', 'listing_price', 'commission_rate']
    },
    {
      id: 3,
      name: 'Lead Information Sheet',
      type: 'Form',
      description: 'Comprehensive lead intake form',
      fields: ['lead_name', 'email', 'phone', 'property_type', 'budget']
    },
    {
      id: 4,
      name: 'Property Disclosure',
      type: 'Legal',
      description: 'Property condition disclosure document',
      fields: ['property_address', 'owner_name', 'disclosure_items']
    }
  ];

  const recentDocuments = [
    {
      id: 1,
      name: 'Purchase Agreement - 123 Main St',
      type: 'PDF',
      created: '2024-01-15',
      status: 'Completed'
    },
    {
      id: 2,
      name: 'Listing Agreement - 456 Oak Ave',
      type: 'PDF',
      created: '2024-01-14',
      status: 'Draft'
    },
    {
      id: 3,
      name: 'Lead Sheet - John Smith',
      type: 'PDF',
      created: '2024-01-13',
      status: 'Completed'
    }
  ];

  const handleMergeDocument = (e) => {
    e.preventDefault();
    toast.success('Document generated successfully!');
    setIsMergeOpen(false);
    setMergeData({ template: '', contact: '', property: '' });
  };

  const handleChange = (e) => {
    setMergeData({
      ...mergeData,
      [e.target.name]: e.target.value
    });
  };

  const tabs = [
    { id: 'documents', name: 'Documents', icon: DocumentTextIcon },
    { id: 'templates', name: 'Templates', icon: ClipboardDocumentListIcon },
    { id: 'merge', name: 'Document Merge', icon: DocumentDuplicateIcon },
    { id: 'packages', name: 'Packages', icon: FolderIcon }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Paperless Office</h1>
          <p className="text-gray-600">Document management and generation system</p>
        </div>
        <button onClick={() => setIsMergeOpen(true)} className="btn-primary flex items-center space-x-2">
          <PlusIcon className="h-5 w-5" />
          <span>Generate Document</span>
        </button>
      </div>

      {/* Document Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-500">
              <DocumentTextIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Documents</p>
              <p className="text-2xl font-semibold text-gray-900">156</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-500">
              <ClipboardDocumentListIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Templates</p>
              <p className="text-2xl font-semibold text-gray-900">{documentTemplates.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-500">
              <DocumentDuplicateIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Generated Today</p>
              <p className="text-2xl font-semibold text-gray-900">12</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-500">
              <FolderIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Packages</p>
              <p className="text-2xl font-semibold text-gray-900">8</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
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
          {activeTab === 'documents' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Recent Documents</h3>
                <div className="flex space-x-2">
                  <button className="btn-outline">Import</button>
                  <button onClick={() => setIsMergeOpen(true)} className="btn-primary">Generate New</button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Document Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentDocuments.map((doc) => (
                      <tr key={doc.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-3" />
                            <span className="text-sm font-medium text-gray-900">{doc.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {doc.type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {doc.created}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            doc.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {doc.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button className="text-primary-600 hover:text-primary-900">
                              <ArrowDownTrayIcon className="h-4 w-4" />
                            </button>
                            <button className="text-gray-600 hover:text-gray-900">
                              <PrinterIcon className="h-4 w-4" />
                            </button>
                            <button className="text-gray-600 hover:text-gray-900">
                              <ShareIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Document Templates</h3>
                <button className="btn-primary">Create Template</button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documentTemplates.map((template) => (
                  <div key={template.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{template.name}</h4>
                        <p className="text-sm text-gray-500">{template.type}</p>
                      </div>
                      <DocumentTextIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">{template.fields.length} fields</span>
                      <button
                        onClick={() => {
                          setMergeData({ ...mergeData, template: template.name });
                          setIsMergeOpen(true);
                        }}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                      >
                        Use Template
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'merge' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard
                icon={DocumentDuplicateIcon}
                title="Merge with Contact"
                description="Generate documents using contact information"
                onClick={() => setIsMergeOpen(true)}
                color="bg-blue-500"
              />
              <FeatureCard
                icon={UserGroupIcon}
                title="Bulk Document Generation"
                description="Generate multiple documents at once"
                onClick={() => toast('Bulk generation coming soon!')}
                color="bg-green-500"
              />
              <FeatureCard
                icon={ClipboardDocumentListIcon}
                title="Custom Templates"
                description="Create and manage custom document templates"
                onClick={() => toast('Custom templates coming soon!')}
                color="bg-purple-500"
              />
            </div>
          )}

          {activeTab === 'packages' && (
            <div className="text-center py-12">
              <FolderIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Document Packages</h3>
              <p className="text-gray-600">Create and manage document packages for different workflows!</p>
            </div>
          )}
        </div>
      </div>

      {/* Document Merge Modal */}
      <Modal
        isOpen={isMergeOpen}
        onClose={() => setIsMergeOpen(false)}
        title="Generate Document"
        size="max-w-2xl"
      >
        <form onSubmit={handleMergeDocument} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document Template *
            </label>
            <select
              name="template"
              value={mergeData.template}
              onChange={handleChange}
              className="input-field"
              required
            >
              <option value="">Select a template</option>
              {documentTemplates.map((template) => (
                <option key={template.id} value={template.name}>
                  {template.name} ({template.type})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact/Lead
            </label>
            <select
              name="contact"
              value={mergeData.contact}
              onChange={handleChange}
              className="input-field"
            >
              <option value="">Select a contact</option>
              <option value="john_smith">John Smith</option>
              <option value="jane_doe">Jane Doe</option>
              <option value="bob_johnson">Bob Johnson</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Property (Optional)
            </label>
            <select
              name="property"
              value={mergeData.property}
              onChange={handleChange}
              className="input-field"
            >
              <option value="">Select a property</option>
              <option value="123_main_st">123 Main Street</option>
              <option value="456_oak_ave">456 Oak Avenue</option>
              <option value="789_elm_st">789 Elm Street</option>
            </select>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Document Preview</h4>
            <p className="text-sm text-gray-600">
              The selected template will be merged with the contact and property information to generate a personalized document.
            </p>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setIsMergeOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex items-center space-x-2"
            >
              <DocumentDuplicateIcon className="h-4 w-4" />
              <span>Generate Document</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PaperlessOffice;