import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { PageHeader, ErrorBanner, Field } from '../components/store/StoreUI';
import { saveStoreProfile } from '../services/storeApi';
import { useStoreProfile } from '../hooks/useStoreProfile';
import { useAuth } from '../contexts/AuthContext';

const EMPTY = { business_name: '', address: '', phone: '', email: '', gstin: '', memo_footer: '', currency: 'INR' };

const StoreProfile = () => {
  const { user } = useAuth();
  const { profile, loading, error, setProfile } = useStoreProfile();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        business_name: profile.business_name || '',
        address: profile.address || '',
        phone: profile.phone || '',
        email: profile.email || '',
        gstin: profile.gstin || '',
        memo_footer: profile.memo_footer || '',
        currency: profile.currency || 'INR',
      });
    }
  }, [profile]);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.business_name.trim()) {
      toast.error('Shop name is required');
      return;
    }
    if (!/^[A-Za-z]{3}$/.test(form.currency.trim())) {
      toast.error('Currency must be a 3-letter code such as INR');
      return;
    }
    setSaving(true);
    try {
      setProfile(await saveStoreProfile(user.id, form));
      toast.success('Store profile saved');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="Store Profile" subtitle="These details are printed on every cash memo and bill" />
      <ErrorBanner message={error} />
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Shop / business name" required className="md:col-span-2">
            <input name="business_name" value={form.business_name} onChange={handleChange} className="input-field" required />
          </Field>
          <Field label="Address" className="md:col-span-2">
            <textarea name="address" value={form.address} onChange={handleChange} rows={3} className="input-field" />
          </Field>
          <Field label="Phone">
            <input name="phone" value={form.phone} onChange={handleChange} className="input-field" />
          </Field>
          <Field label="Email">
            <input type="email" name="email" value={form.email} onChange={handleChange} className="input-field" />
          </Field>
          <Field label="GSTIN">
            <input name="gstin" value={form.gstin} onChange={handleChange} className="input-field" placeholder="Optional" />
          </Field>
          <Field label="Currency code">
            <input name="currency" value={form.currency} onChange={handleChange} maxLength={3} className="input-field uppercase" />
          </Field>
          <Field label="Footer message" className="md:col-span-2">
            <textarea
              name="memo_footer"
              value={form.memo_footer}
              onChange={handleChange}
              rows={2}
              className="input-field"
              placeholder="e.g. Goods once sold will not be taken back. Thank you!"
            />
          </Field>
        </div>
        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StoreProfile;
