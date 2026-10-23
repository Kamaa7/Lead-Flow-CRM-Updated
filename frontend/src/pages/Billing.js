import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { TrashIcon, PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { PageHeader, ErrorBanner, Field } from '../components/store/StoreUI';
import { listProducts, listCustomers, createSale, PAYMENT_METHODS } from '../services/storeApi';
import { useStoreProfile } from '../hooks/useStoreProfile';
import { computeTotals, formatMoney, formatQty, roundTo, toNumber, todayISO } from '../utils/money';

let lineKey = 0;
const nextKey = () => {
  lineKey += 1;
  return `line-${lineKey}`;
};

const initialState = () => ({
  docType: 'cash_memo',
  customerId: '',
  customerName: '',
  customerPhone: '',
  customerAddress: '',
  discount: '',
  amountPaid: '',
  paymentMethod: 'cash',
  saleDate: todayISO(),
  notes: '',
});

const Billing = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currency, profile, loading: profileLoading } = useStoreProfile();

  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [sale, setSale] = useState(initialState);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const searchRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const [productRows, customerRows] = await Promise.all([listProducts(), listCustomers()]);
      setProducts(productRows.filter((p) => p.is_active));
      setCustomers(customerRows);
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

  useEffect(() => {
    const preselect = searchParams.get('customer');
    if (preselect && customers.some((c) => c.id === preselect)) {
      setSale((prev) => ({ ...prev, customerId: preselect, docType: 'bill' }));
    }
  }, [searchParams, customers]);

  const productById = useMemo(() => Object.fromEntries(products.map((p) => [p.id, p])), [products]);
  const selectedCustomer = customers.find((c) => c.id === sale.customerId) || null;

  const matches = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return [];
    const exact = products.filter((p) => (p.sku || '').toLowerCase() === term);
    const rest = products.filter(
      (p) => !exact.includes(p) && (p.name.toLowerCase().includes(term) || (p.sku || '').toLowerCase().includes(term))
    );
    return [...exact, ...rest].slice(0, 8);
  }, [products, search]);

  const totals = useMemo(() => computeTotals(items, sale.discount), [items, sale.discount]);

  const qtyInCart = useCallback(
    (productId, exceptKey) =>
      items
        .filter((i) => i.product_id === productId && i.key !== exceptKey)
        .reduce((sum, i) => sum + toNumber(i.qty), 0),
    [items]
  );

  const addProduct = (product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product_id === product.id);
      if (existing) {
        return prev.map((i) => (i.key === existing.key ? { ...i, qty: String(toNumber(i.qty) + 1) } : i));
      }
      return [
        ...prev,
        {
          key: nextKey(),
          product_id: product.id,
          description: product.name,
          unit: product.unit,
          qty: '1',
          unit_price: String(product.sale_price),
          tax_rate: String(product.tax_rate),
        },
      ];
    });
    setSearch('');
    searchRef.current?.focus();
  };

  const addCustomLine = () => {
    setItems((prev) => [
      ...prev,
      { key: nextKey(), product_id: null, description: '', unit: 'pcs', qty: '1', unit_price: '', tax_rate: '0' },
    ]);
  };

  const updateLine = (key, field, value) => {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, [field]: value } : i)));
  };

  const removeLine = (key) => setItems((prev) => prev.filter((i) => i.key !== key));

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (matches.length > 0) addProduct(matches[0]);
    } else if (e.key === 'Escape') {
      setSearch('');
    }
  };

  const setField = (field) => (e) => setSale((prev) => ({ ...prev, [field]: e.target.value }));

  const setDocType = (docType) =>
    setSale((prev) => ({ ...prev, docType, amountPaid: docType === 'cash_memo' ? '' : prev.amountPaid }));

  const stockProblems = useMemo(
    () =>
      items
        .filter((i) => i.product_id)
        .map((i) => {
          const product = productById[i.product_id];
          if (!product) return null;
          const needed = qtyInCart(i.product_id, null);
          return needed > toNumber(product.stock_qty) ? product.id : null;
        })
        .filter(Boolean),
    [items, productById, qtyInCart]
  );

  const validate = () => {
    if (items.length === 0) return 'Add at least one item';
    for (let index = 0; index < items.length; index += 1) {
      const line = items[index];
      const label = `Item ${index + 1}`;
      if (!line.product_id && !line.description.trim()) return `${label}: enter a description`;
      if (roundTo(line.qty, 3) <= 0) return `${label}: quantity must be greater than zero`;
      if (line.unit_price === '' || toNumber(line.unit_price) < 0) return `${label}: enter a valid price`;
      if (toNumber(line.tax_rate) < 0 || toNumber(line.tax_rate) > 100) return `${label}: tax must be 0–100%`;
    }
    if (stockProblems.length > 0) {
      const names = [...new Set(stockProblems)].map((id) => productById[id]?.name).join(', ');
      return `Not enough stock for ${names}`;
    }
    if (totals.discount < 0) return 'Discount cannot be negative';
    if (totals.discount > totals.subtotal) return 'Discount cannot be more than the subtotal';
    if (sale.docType === 'bill') {
      if (!sale.customerId && !sale.customerName.trim()) return 'A bill needs a customer';
      const paid = roundTo(sale.amountPaid, 2);
      if (paid < 0) return 'Amount paid cannot be negative';
      if (paid > totals.grand) return 'Amount paid cannot be more than the bill total';
    }
    return null;
  };

  const handleSave = async (print) => {
    const problem = validate();
    if (problem) {
      toast.error(problem);
      return;
    }
    setSaving(true);
    try {
      const saved = await createSale({
        docType: sale.docType,
        items,
        customerId: sale.customerId || null,
        customerName: sale.customerId ? '' : sale.customerName,
        customerPhone: sale.customerId ? '' : sale.customerPhone,
        customerAddress: sale.customerId ? '' : sale.customerAddress,
        discount: totals.discount,
        amountPaid: sale.amountPaid,
        paymentMethod: sale.paymentMethod,
        saleDate: sale.saleDate,
        notes: sale.notes,
      });
      toast.success(`${saved.doc_number} saved`);
      navigate(print ? `/sales/${saved.id}/print?autoprint=1` : `/sales/${saved.id}`);
    } catch (err) {
      toast.error(err.message);
      load();
    } finally {
      setSaving(false);
    }
  };

  const resetSale = () => {
    if (items.length > 0 && !window.confirm('Clear this sale?')) return;
    setSale(initialState());
    setItems([]);
    setSearch('');
  };

  if (loading || profileLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  const due = sale.docType === 'bill' ? Math.max(0, roundTo(totals.grand - roundTo(sale.amountPaid, 2), 2)) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Sale"
        subtitle="Create a cash memo or a bill"
        actions={
          <button onClick={resetSale} className="btn-secondary">
            Clear
          </button>
        }
      />

      <ErrorBanner message={loadError} />

      {!profile?.business_name && !loadError && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900">
          Your shop name and address are not set, so printed memos will have a blank header.{' '}
          <Link to="/store-profile" className="font-medium underline">
            Set up store profile
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'cash_memo', label: 'Cash Memo', hint: 'Paid in full now' },
                { value: 'bill', label: 'Bill', hint: 'Credit / part payment' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDocType(opt.value)}
                  className={clsx(
                    'rounded-lg border px-4 py-3 text-left transition-colors',
                    sale.docType === opt.value ? 'border-black bg-black text-white' : 'border-gray-300 hover:bg-gray-50'
                  )}
                >
                  <div className="font-semibold">{opt.label}</div>
                  <div className={clsx('text-xs', sale.docType === opt.value ? 'text-gray-300' : 'text-gray-500')}>
                    {opt.hint}
                  </div>
                </button>
              ))}
            </div>

            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Type product name or SKU, press Enter to add"
                className="input-field pl-10"
                autoFocus
              />
              {matches.length > 0 && (
                <ul className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-72 overflow-y-auto">
                  {matches.map((p) => {
                    const available = toNumber(p.stock_qty) - qtyInCart(p.id, null);
                    return (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => addProduct(p)}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between gap-4"
                        >
                          <span>
                            <span className="font-medium text-gray-900">{p.name}</span>
                            {p.sku && <span className="ml-2 text-xs text-gray-500">{p.sku}</span>}
                          </span>
                          <span className="text-sm text-right whitespace-nowrap">
                            {formatMoney(p.sale_price, currency)}
                            <span className={clsx('ml-3 text-xs', available <= 0 ? 'text-red-600' : 'text-gray-500')}>
                              {formatQty(available)} {p.unit} left
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              {search.trim() && matches.length === 0 && (
                <p className="mt-1 text-xs text-gray-500">
                  No product found.{' '}
                  <Link to="/products" className="underline">
                    Add products
                  </Link>{' '}
                  or use a custom item.
                </p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-3 py-3 w-8">#</th>
                    <th className="px-3 py-3">Item</th>
                    <th className="px-3 py-3 w-28">Qty</th>
                    <th className="px-3 py-3 w-32">Rate</th>
                    <th className="px-3 py-3 w-24">Tax %</th>
                    <th className="px-3 py-3 w-32 text-right">Amount</th>
                    <th className="px-3 py-3 w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((line, index) => {
                    const product = line.product_id ? productById[line.product_id] : null;
                    const short = product && stockProblems.includes(product.id);
                    return (
                      <tr key={line.key} className="align-top">
                        <td className="px-3 py-2 text-gray-500 pt-4">{index + 1}</td>
                        <td className="px-3 py-2">
                          <input
                            value={line.description}
                            onChange={(e) => updateLine(line.key, 'description', e.target.value)}
                            placeholder={product ? product.name : 'Item description'}
                            className="input-field"
                          />
                          {product ? (
                            <p className={clsx('mt-1 text-xs', short ? 'text-red-600 font-medium' : 'text-gray-500')}>
                              {formatQty(product.stock_qty)} {product.unit} in stock
                              {short && ' — not enough'}
                            </p>
                          ) : (
                            <p className="mt-1 text-xs text-gray-500">Custom item (no stock tracking)</p>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={line.qty}
                            onChange={(e) => updateLine(line.key, 'qty', e.target.value)}
                            min="0"
                            step="0.001"
                            className="input-field"
                          />
                          <p className="mt-1 text-xs text-gray-500">{line.unit}</p>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={line.unit_price}
                            onChange={(e) => updateLine(line.key, 'unit_price', e.target.value)}
                            min="0"
                            step="0.01"
                            className="input-field"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={line.tax_rate}
                            onChange={(e) => updateLine(line.key, 'tax_rate', e.target.value)}
                            min="0"
                            max="100"
                            step="0.01"
                            className="input-field"
                          />
                        </td>
                        <td className="px-3 py-2 text-right font-medium pt-4">
                          {formatMoney(totals.lines[index], currency)}
                        </td>
                        <td className="px-3 py-2 pt-4">
                          <button
                            type="button"
                            onClick={() => removeLine(line.key)}
                            className="text-gray-400 hover:text-red-600"
                            aria-label="Remove item"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {items.length === 0 && (
                <div className="text-center py-10 text-gray-500">Search for a product above to add it to the sale.</div>
              )}
            </div>
            <div className="p-3 border-t border-gray-200">
              <button type="button" onClick={addCustomLine} className="btn-outline flex items-center gap-2 text-sm">
                <PlusIcon className="h-4 w-4" />
                Custom item
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3">
            <h2 className="font-semibold text-gray-900">Customer</h2>
            <select
              value={sale.customerId}
              onChange={(e) => setSale((prev) => ({ ...prev, customerId: e.target.value }))}
              className="input-field"
            >
              <option value="">{sale.docType === 'bill' ? 'New / unsaved customer' : 'Walk-in customer'}</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.phone ? ` — ${c.phone}` : ''}
                </option>
              ))}
            </select>
            {selectedCustomer ? (
              <div className="text-sm text-gray-600">
                {selectedCustomer.phone && <div>{selectedCustomer.phone}</div>}
                {selectedCustomer.address && <div>{selectedCustomer.address}</div>}
              </div>
            ) : (
              <>
                <input
                  value={sale.customerName}
                  onChange={setField('customerName')}
                  placeholder={sale.docType === 'bill' ? 'Customer name *' : 'Customer name (optional)'}
                  className="input-field"
                />
                <input
                  value={sale.customerPhone}
                  onChange={setField('customerPhone')}
                  placeholder="Phone (optional)"
                  className="input-field"
                />
                {sale.docType === 'bill' && (
                  <textarea
                    value={sale.customerAddress}
                    onChange={setField('customerAddress')}
                    placeholder="Address (optional)"
                    rows={2}
                    className="input-field"
                  />
                )}
              </>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3">
            <h2 className="font-semibold text-gray-900">Payment</h2>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Date">
                <input type="date" value={sale.saleDate} onChange={setField('saleDate')} className="input-field" />
              </Field>
              <Field label="Method">
                <select value={sale.paymentMethod} onChange={setField('paymentMethod')} className="input-field">
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label={`Discount (${currency})`}>
              <input
                type="number"
                value={sale.discount}
                onChange={setField('discount')}
                min="0"
                step="0.01"
                placeholder="0.00"
                className="input-field"
              />
            </Field>

            <dl className="space-y-1 text-sm border-t border-gray-200 pt-3">
              <div className="flex justify-between">
                <dt className="text-gray-600">Subtotal</dt>
                <dd>{formatMoney(totals.subtotal, currency)}</dd>
              </div>
              {totals.discount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-gray-600">Discount</dt>
                  <dd>- {formatMoney(totals.discount, currency)}</dd>
                </div>
              )}
              {totals.tax > 0 && (
                <div className="flex justify-between">
                  <dt className="text-gray-600">Tax</dt>
                  <dd>{formatMoney(totals.tax, currency)}</dd>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-1">
                <dt>Total</dt>
                <dd>{formatMoney(totals.grand, currency)}</dd>
              </div>
            </dl>

            {sale.docType === 'bill' ? (
              <>
                <Field label={`Amount paid now (${currency})`}>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={sale.amountPaid}
                      onChange={setField('amountPaid')}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="input-field"
                    />
                    <button
                      type="button"
                      onClick={() => setSale((prev) => ({ ...prev, amountPaid: String(totals.grand) }))}
                      className="btn-secondary whitespace-nowrap"
                    >
                      Full
                    </button>
                  </div>
                </Field>
                <div className="flex justify-between text-sm font-semibold">
                  <span>Balance due</span>
                  <span className={due > 0 ? 'text-red-600' : 'text-green-700'}>{formatMoney(due, currency)}</span>
                </div>
              </>
            ) : (
              <p className="text-sm text-green-700">Cash memo is recorded as fully paid.</p>
            )}

            <Field label="Notes">
              <input value={sale.notes} onChange={setField('notes')} className="input-field" placeholder="Optional" />
            </Field>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleSave(false)}
                disabled={saving || items.length === 0}
                className="btn-outline disabled:opacity-50"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => handleSave(true)}
                disabled={saving || items.length === 0}
                className="btn-primary disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save & Print'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Billing;
