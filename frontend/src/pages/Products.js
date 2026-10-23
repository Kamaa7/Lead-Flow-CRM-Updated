import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { PageHeader, StatCard, ErrorBanner, Field } from '../components/store/StoreUI';
import {
  listProducts,
  createProduct,
  updateProduct,
  setProductActive,
  deleteProduct,
  adjustStock,
  listStockMovements,
} from '../services/storeApi';
import { useStoreProfile } from '../hooks/useStoreProfile';
import { formatMoney, formatQty, toNumber } from '../utils/money';

const EMPTY_PRODUCT = {
  sku: '',
  name: '',
  unit: 'pcs',
  sale_price: '',
  tax_rate: '0',
  stock_qty: '0',
  low_stock_alert: '0',
  is_active: true,
};

const EMPTY_ADJUST = { direction: 'add', qty: '', reason: 'purchase', note: '' };

const REASON_LABELS = {
  opening: 'Opening stock',
  sale: 'Sale',
  adjustment: 'Adjustment',
  purchase: 'Purchase / stock in',
  return: 'Customer return',
};

const isLowStock = (p) => toNumber(p.low_stock_alert) > 0 && toNumber(p.stock_qty) <= toNumber(p.low_stock_alert);

const Products = () => {
  const { currency } = useStoreProfile();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('active');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [saving, setSaving] = useState(false);

  const [adjusting, setAdjusting] = useState(null);
  const [adjustForm, setAdjustForm] = useState(EMPTY_ADJUST);

  const [historyFor, setHistoryFor] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      setProducts(await listProducts());
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
    return products.filter((p) => {
      if (filter === 'active' && !p.is_active) return false;
      if (filter === 'inactive' && p.is_active) return false;
      if (filter === 'low' && !(p.is_active && isLowStock(p))) return false;
      if (!term) return true;
      return p.name.toLowerCase().includes(term) || (p.sku || '').toLowerCase().includes(term);
    });
  }, [products, search, filter]);

  const stats = useMemo(() => {
    const active = products.filter((p) => p.is_active);
    return {
      count: active.length,
      low: active.filter(isLowStock).length,
      out: active.filter((p) => toNumber(p.stock_qty) <= 0).length,
      value: active.reduce((sum, p) => sum + toNumber(p.stock_qty) * toNumber(p.sale_price), 0),
    };
  }, [products]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_PRODUCT);
    setFormOpen(true);
  };

  const openEdit = (product) => {
    setEditing(product);
    setForm({
      sku: product.sku || '',
      name: product.name,
      unit: product.unit,
      sale_price: String(product.sale_price),
      tax_rate: String(product.tax_rate),
      stock_qty: String(product.stock_qty),
      low_stock_alert: String(product.low_stock_alert),
      is_active: product.is_active,
    });
    setFormOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Product name is required');
      return;
    }
    if (toNumber(form.sale_price) < 0 || toNumber(form.tax_rate) < 0 || toNumber(form.tax_rate) > 100) {
      toast.error('Check the price and tax rate');
      return;
    }
    if (!editing && toNumber(form.stock_qty) < 0) {
      toast.error('Opening stock cannot be negative');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const updated = await updateProduct(editing.id, form);
        setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        toast.success('Product updated');
      } else {
        const created = await createProduct(form);
        setProducts((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
        toast.success('Product added');
      }
      setFormOpen(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (product) => {
    try {
      const updated = await setProductActive(product.id, !product.is_active);
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      toast.success(updated.is_active ? 'Product activated' : 'Product marked inactive');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? Its stock history will also be removed.`)) return;
    try {
      await deleteProduct(product.id);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      toast.success('Product deleted');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const openAdjust = (product) => {
    setAdjusting(product);
    setAdjustForm(EMPTY_ADJUST);
  };

  const handleAdjust = async (e) => {
    e.preventDefault();
    const qty = toNumber(adjustForm.qty);
    if (qty <= 0) {
      toast.error('Enter a quantity greater than zero');
      return;
    }
    const change = adjustForm.direction === 'add' ? qty : -qty;
    setSaving(true);
    try {
      const updated = await adjustStock({
        productId: adjusting.id,
        changeQty: change,
        reason: adjustForm.direction === 'add' ? adjustForm.reason : 'adjustment',
        note: adjustForm.note,
      });
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      toast.success(`Stock is now ${formatQty(updated.stock_qty)} ${updated.unit}`);
      setAdjusting(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const openHistory = async (product) => {
    setHistoryFor(product);
    setHistory([]);
    setHistoryLoading(true);
    try {
      setHistory(await listStockMovements(product.id));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setHistoryLoading(false);
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
    <div className="space-y-6">
      <PageHeader
        title="Products & Stock"
        subtitle="Keep your item list, prices and stock levels up to date"
        actions={
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <PlusIcon className="h-5 w-5" />
            Add Product
          </button>
        }
      />

      <ErrorBanner message={loadError} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Active products" value={stats.count} />
        <StatCard label="Low stock" value={stats.low} tone={stats.low ? 'danger' : 'default'} />
        <StatCard label="Out of stock" value={stats.out} tone={stats.out ? 'danger' : 'default'} />
        <StatCard label="Stock value (at sale price)" value={formatMoney(stats.value, currency)} />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input-field md:w-48">
            <option value="active">Active</option>
            <option value="low">Low stock</option>
            <option value="inactive">Inactive</option>
            <option value="all">All</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-right">Tax</th>
                <th className="px-4 py-3 text-right">In stock</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {visible.map((p) => (
                <tr key={p.id} className={p.is_active ? 'hover:bg-gray-50' : 'bg-gray-50 text-gray-500'}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{p.name}</div>
                    {!p.is_active && <div className="text-xs text-gray-500">Inactive</div>}
                  </td>
                  <td className="px-4 py-3">{p.sku || '-'}</td>
                  <td className="px-4 py-3 text-right">
                    {formatMoney(p.sale_price, currency)} / {p.unit}
                  </td>
                  <td className="px-4 py-3 text-right">{formatQty(p.tax_rate)}%</td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={
                        toNumber(p.stock_qty) <= 0
                          ? 'font-semibold text-red-600'
                          : isLowStock(p)
                          ? 'font-semibold text-yellow-700'
                          : 'font-medium'
                      }
                    >
                      {formatQty(p.stock_qty)} {p.unit}
                    </span>
                    {p.is_active && isLowStock(p) && toNumber(p.stock_qty) > 0 && (
                      <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-800">Low</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2 whitespace-nowrap">
                      <button onClick={() => openAdjust(p)} className="text-black underline hover:no-underline">
                        Stock
                      </button>
                      <button onClick={() => openHistory(p)} className="text-gray-700 underline hover:no-underline">
                        History
                      </button>
                      <button onClick={() => openEdit(p)} className="text-gray-700 underline hover:no-underline">
                        Edit
                      </button>
                      <button onClick={() => handleToggleActive(p)} className="text-gray-700 underline hover:no-underline">
                        {p.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button onClick={() => handleDelete(p)} className="text-red-600 underline hover:no-underline">
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
              {products.length === 0 ? 'No products yet. Add your first product to start billing.' : 'No products match.'}
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit Product' : 'Add Product'}
        size="max-w-2xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Name" required className="md:col-span-2">
              <input name="name" value={form.name} onChange={handleFormChange} className="input-field" required autoFocus />
            </Field>
            <Field label="SKU / Code">
              <input name="sku" value={form.sku} onChange={handleFormChange} className="input-field" />
            </Field>
            <Field label="Unit">
              <input
                name="unit"
                value={form.unit}
                onChange={handleFormChange}
                className="input-field"
                placeholder="pcs, kg, ltr, box..."
              />
            </Field>
            <Field label={`Sale price (${currency}, before tax)`} required>
              <input
                type="number"
                name="sale_price"
                value={form.sale_price}
                onChange={handleFormChange}
                min="0"
                step="0.01"
                className="input-field"
                required
              />
            </Field>
            <Field label="Tax rate (%)">
              <input
                type="number"
                name="tax_rate"
                value={form.tax_rate}
                onChange={handleFormChange}
                min="0"
                max="100"
                step="0.01"
                className="input-field"
              />
            </Field>
            {editing ? (
              <Field label="Current stock">
                <div className="input-field bg-gray-50 text-gray-600">
                  {formatQty(editing.stock_qty)} {editing.unit} (use “Stock” to change)
                </div>
              </Field>
            ) : (
              <Field label="Opening stock">
                <input
                  type="number"
                  name="stock_qty"
                  value={form.stock_qty}
                  onChange={handleFormChange}
                  min="0"
                  step="0.001"
                  className="input-field"
                />
              </Field>
            )}
            <Field label="Low stock alert at">
              <input
                type="number"
                name="low_stock_alert"
                value={form.low_stock_alert}
                onChange={handleFormChange}
                min="0"
                step="0.001"
                className="input-field"
              />
            </Field>
            <label className="flex items-center gap-2 text-sm text-gray-700 md:col-span-2">
              <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleFormChange} />
              Active (available for billing)
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setFormOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Product'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={Boolean(adjusting)} onClose={() => setAdjusting(null)} title="Update Stock">
        {adjusting && (
          <form onSubmit={handleAdjust} className="space-y-4">
            <p className="text-sm text-gray-600">
              <span className="font-medium text-gray-900">{adjusting.name}</span> — currently{' '}
              {formatQty(adjusting.stock_qty)} {adjusting.unit}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'add', label: 'Add stock' },
                { value: 'remove', label: 'Remove stock' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setAdjustForm((prev) => ({ ...prev, direction: opt.value }))}
                  className={adjustForm.direction === opt.value ? 'btn-primary' : 'btn-secondary'}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <Field label={`Quantity (${adjusting.unit})`} required>
              <input
                type="number"
                value={adjustForm.qty}
                onChange={(e) => setAdjustForm((prev) => ({ ...prev, qty: e.target.value }))}
                min="0"
                step="0.001"
                className="input-field"
                required
                autoFocus
              />
            </Field>
            {adjustForm.direction === 'add' ? (
              <Field label="Reason">
                <select
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm((prev) => ({ ...prev, reason: e.target.value }))}
                  className="input-field"
                >
                  <option value="purchase">Purchase / stock in</option>
                  <option value="return">Customer return</option>
                  <option value="adjustment">Correction</option>
                </select>
              </Field>
            ) : (
              <p className="text-xs text-gray-500">
                Removals are recorded as a correction (damage, loss, count mismatch). Sales reduce stock automatically.
              </p>
            )}
            <Field label="Note">
              <input
                value={adjustForm.note}
                onChange={(e) => setAdjustForm((prev) => ({ ...prev, note: e.target.value }))}
                className="input-field"
                placeholder="Supplier, invoice no., reason..."
              />
            </Field>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setAdjusting(null)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
                {saving ? 'Saving...' : 'Update Stock'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        isOpen={Boolean(historyFor)}
        onClose={() => setHistoryFor(null)}
        title={historyFor ? `Stock history — ${historyFor.name}` : ''}
        size="max-w-3xl"
      >
        {historyLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : history.length === 0 ? (
          <p className="text-sm text-gray-500 py-6 text-center">No stock movements recorded yet.</p>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr className="text-left text-xs font-medium text-gray-500 uppercase">
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Note</th>
                  <th className="px-3 py-2 text-right">Change</th>
                  <th className="px-3 py-2 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.map((m) => (
                  <tr key={m.id}>
                    <td className="px-3 py-2 whitespace-nowrap">{new Date(m.created_at).toLocaleString('en-IN')}</td>
                    <td className="px-3 py-2">{REASON_LABELS[m.reason] || m.reason}</td>
                    <td className="px-3 py-2 text-gray-600">{m.note || '-'}</td>
                    <td
                      className={`px-3 py-2 text-right font-medium ${
                        toNumber(m.change_qty) < 0 ? 'text-red-600' : 'text-green-700'
                      }`}
                    >
                      {toNumber(m.change_qty) > 0 ? '+' : ''}
                      {formatQty(m.change_qty)}
                    </td>
                    <td className="px-3 py-2 text-right">{formatQty(m.balance_after)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Products;
