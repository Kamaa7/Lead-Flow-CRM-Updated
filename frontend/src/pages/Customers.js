import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, MagnifyingGlassIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { PageHeader, StatCard, ErrorBanner, Field } from '../components/store/StoreUI';
import {
  listCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  listLeadsForImport,
  listOutstandingByCustomer,
} from '../services/storeApi';
import { useStoreProfile } from '../hooks/useStoreProfile';
import { formatMoney, round2 } from '../utils/money';

const EMPTY_CUSTOMER = { name: '', phone: '', email: '', address: '', gstin: '', notes: '', lead_id: null };

const Customers = () => {
  const { currency } = useStoreProfile();
  const [customers, setCustomers] = useState([]);
  const [dues, setDues] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [search, setSearch] = useState('');
  const [onlyDue, setOnlyDue] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_CUSTOMER);
  const [saving, setSaving] = useState(false);

  const [importOpen, setImportOpen] = useState(false);
  const [leads, setLeads] = useState([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadSearch, setLeadSearch] = useState('');

  const load = useCallback(async () => {
    try {
      const [rows, outstanding] = await Promise.all([listCustomers(), listOutstandingByCustomer()]);
      setCustomers(rows);
      setDues(outstanding);
      setLoadError(null);
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return customers.filter((c) => {
      if (onlyDue && !(dues[c.id] > 0)) return false;
      if (!term) return true;
      return [c.name, c.phone, c.email].some((v) => (v || '').toLowerCase().includes(term));
    });
  }, [customers, dues, search, onlyDue]);

  const totalDue = useMemo(() => round2(Object.values(dues).reduce((s, v) => s + v, 0)), [dues]);
  const withDue = useMemo(() => Object.values(dues).filter((v) => v > 0).length, [dues]);

  const linkedLeadIds = useMemo(() => new Set(customers.map((c) => c.lead_id).filter(Boolean)), [customers]);

  const openCreate = (prefill = EMPTY_CUSTOMER) => {
    setEditing(null);
    setForm({ ...EMPTY_CUSTOMER, ...prefill });
    setFormOpen(true);
  };

  const openEdit = (customer) => {
    setEditing(customer);
    setForm({
      name: customer.name,
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      gstin: customer.gstin || '',
      notes: customer.notes || '',
      lead_id: customer.lead_id,
    });
    setFormOpen(true);
  };

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Customer name is required');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const updated = await updateCustomer(editing.id, form);
        setCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        toast.success('Customer updated');
      } else {
        const created = await createCustomer(form);
        setCustomers((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
        toast.success('Customer added');
      }
      setFormOpen(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (customer) => {
    const due = dues[customer.id] || 0;
    const warning = due > 0 ? ` They still owe ${formatMoney(due, currency)}.` : '';
    if (!window.confirm(`Delete "${customer.name}"?${warning} Past sales keep the customer's name.`)) return;
    try {
      await deleteCustomer(customer.id);
      setCustomers((prev) => prev.filter((c) => c.id !== customer.id));
      toast.success('Customer deleted');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const openImport = async () => {
    setImportOpen(true);
    setLeadSearch('');
    setLeadsLoading(true);
    try {
      setLeads(await listLeadsForImport());
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLeadsLoading(false);
    }
  };

  const importLead = (lead) => {
    setImportOpen(false);
    openCreate({
      name: lead.company && lead.company !== lead.name ? `${lead.name} (${lead.company})` : lead.name || '',
      phone: lead.phone || '',
      email: lead.email || '',
      lead_id: lead.id,
    });
  };

  const visibleLeads = useMemo(() => {
    const term = leadSearch.trim().toLowerCase();
    return leads.filter(
      (l) =>
        !linkedLeadIds.has(l.id) &&
        (!term || [l.name, l.company, l.email, l.phone].some((v) => (v || '').toLowerCase().includes(term)))
    );
  }, [leads, leadSearch, linkedLeadIds]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        subtitle="Store customers, contact details and money owed"
        actions={
          <>
            <button onClick={openImport} className="btn-outline flex items-center gap-2">
              <UserPlusIcon className="h-5 w-5" />
              From Lead
            </button>
            <button onClick={() => openCreate()} className="btn-primary flex items-center gap-2">
              <PlusIcon className="h-5 w-5" />
              Add Customer
            </button>
          </>
        }
      />

      <ErrorBanner message={loadError} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Customers" value={customers.length} />
        <StatCard label="Customers with dues" value={withDue} />
        <StatCard label="Total outstanding" value={formatMoney(totalDue, currency)} tone={totalDue > 0 ? 'danger' : 'default'} />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, phone or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={onlyDue} onChange={(e) => setOnlyDue(e.target.checked)} />
            Only with dues
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3 text-right">Outstanding</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {visible.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{c.name}</div>
                    {c.address && <div className="text-xs text-gray-500 truncate max-w-xs">{c.address}</div>}
                    {c.lead_id && <div className="text-xs text-blue-700">Linked to CRM lead</div>}
                  </td>
                  <td className="px-4 py-3">{c.phone || '-'}</td>
                  <td className="px-4 py-3">{c.email || '-'}</td>
                  <td className="px-4 py-3 text-right">
                    {dues[c.id] > 0 ? (
                      <Link
                        to={`/sales?customer=${c.id}`}
                        className="font-semibold text-red-600 underline hover:no-underline"
                      >
                        {formatMoney(dues[c.id], currency)}
                      </Link>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3 whitespace-nowrap">
                      <Link to={`/billing?customer=${c.id}`} className="text-black underline hover:no-underline">
                        New sale
                      </Link>
                      <Link to={`/sales?customer=${c.id}`} className="text-gray-700 underline hover:no-underline">
                        Sales
                      </Link>
                      <button onClick={() => openEdit(c)} className="text-gray-700 underline hover:no-underline">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(c)} className="text-red-600 underline hover:no-underline">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visible.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              {customers.length === 0 ? 'No customers yet.' : 'No customers match.'}
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit Customer' : 'Add Customer'}
        size="max-w-2xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Name" required className="md:col-span-2">
              <input name="name" value={form.name} onChange={handleChange} className="input-field" required autoFocus />
            </Field>
            <Field label="Phone">
              <input type="tel" name="phone" value={form.phone} onChange={handleChange} className="input-field" />
            </Field>
            <Field label="Email">
              <input type="email" name="email" value={form.email} onChange={handleChange} className="input-field" />
            </Field>
            <Field label="Address" className="md:col-span-2">
              <textarea name="address" value={form.address} onChange={handleChange} rows={2} className="input-field" />
            </Field>
            <Field label="GSTIN">
              <input name="gstin" value={form.gstin} onChange={handleChange} className="input-field" />
            </Field>
            <Field label="Notes">
              <input name="notes" value={form.notes} onChange={handleChange} className="input-field" />
            </Field>
          </div>
          {form.lead_id && <p className="text-xs text-blue-700">This customer will be linked to the CRM lead.</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setFormOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Customer'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={importOpen} onClose={() => setImportOpen(false)} title="Create customer from a lead" size="max-w-2xl">
        <input
          type="text"
          placeholder="Search leads..."
          value={leadSearch}
          onChange={(e) => setLeadSearch(e.target.value)}
          className="input-field mb-3"
          autoFocus
        />
        {leadsLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : visibleLeads.length === 0 ? (
          <p className="text-sm text-gray-500 py-6 text-center">No leads available to import.</p>
        ) : (
          <ul className="max-h-[50vh] overflow-y-auto divide-y divide-gray-100">
            {visibleLeads.map((lead) => (
              <li key={lead.id}>
                <button
                  type="button"
                  onClick={() => importLead(lead)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50"
                >
                  <div className="font-medium text-gray-900">{lead.name}</div>
                  <div className="text-xs text-gray-500">
                    {[lead.company, lead.phone, lead.email].filter(Boolean).join(' · ')}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </div>
  );
};

export default Customers;
