import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PlusIcon, ArrowDownTrayIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';
import { PageHeader, StatCard, ErrorBanner, StatusBadge, DocTypeBadge } from '../components/store/StoreUI';
import { listSales, listCustomers, DOC_TYPE_LABELS, paymentMethodLabel } from '../services/storeApi';
import { useStoreProfile } from '../hooks/useStoreProfile';
import { formatMoney, round2, toNumber, todayISO } from '../utils/money';

const monthStartISO = () => `${todayISO().slice(0, 7)}-01`;

const csvCell = (value) => {
  const s = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const Sales = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const customerFilter = searchParams.get('customer') || '';
  const { currency } = useStoreProfile();

  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [from, setFrom] = useState(customerFilter ? '' : monthStartISO());
  const [to, setTo] = useState('');
  const [docType, setDocType] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rows, customerRows] = await Promise.all([
        listSales({ from, to, docType, status, customerId: customerFilter }),
        listCustomers(),
      ]);
      setSales(rows);
      setCustomers(customerRows);
      setLoadError(null);
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }, [from, to, docType, status, customerFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const customerName = customers.find((c) => c.id === customerFilter)?.name;

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return sales.filter((s) => {
      if (!term) return true;
      return (
        s.doc_number.toLowerCase().includes(term) ||
        (s.customer_name || '').toLowerCase().includes(term) ||
        (s.customer_phone || '').toLowerCase().includes(term)
      );
    });
  }, [sales, search]);

  const stats = useMemo(() => {
    const total = visible.reduce((sum, s) => sum + toNumber(s.grand_total), 0);
    const paid = visible.reduce((sum, s) => sum + toNumber(s.amount_paid), 0);
    return { count: visible.length, total: round2(total), paid: round2(paid), due: round2(total - paid) };
  }, [visible]);

  const setRange = (range) => {
    if (range === 'today') {
      setFrom(todayISO());
      setTo(todayISO());
    } else if (range === 'month') {
      setFrom(monthStartISO());
      setTo('');
    } else {
      setFrom('');
      setTo('');
    }
  };

  const clearCustomer = () => {
    searchParams.delete('customer');
    setSearchParams(searchParams);
  };

  const exportCsv = () => {
    const header = ['Date', 'Number', 'Type', 'Customer', 'Phone', 'Subtotal', 'Discount', 'Tax', 'Total', 'Paid', 'Due', 'Status', 'Method'];
    const rows = visible.map((s) => [
      s.sale_date,
      s.doc_number,
      DOC_TYPE_LABELS[s.doc_type],
      s.customer_name || 'Walk-in',
      s.customer_phone || '',
      s.subtotal,
      s.discount,
      s.tax_total,
      s.grand_total,
      s.amount_paid,
      round2(toNumber(s.grand_total) - toNumber(s.amount_paid)).toFixed(2),
      s.status,
      paymentMethodLabel(s.payment_method),
    ]);
    const csv = [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');
    const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-${from || 'all'}-to-${to || todayISO()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Register"
        subtitle="All cash memos and bills"
        actions={
          <>
            <button onClick={exportCsv} disabled={visible.length === 0} className="btn-outline flex items-center gap-2 disabled:opacity-50">
              <ArrowDownTrayIcon className="h-5 w-5" />
              Export CSV
            </button>
            <Link to="/billing" className="btn-primary flex items-center gap-2">
              <PlusIcon className="h-5 w-5" />
              New Sale
            </Link>
          </>
        }
      />

      <ErrorBanner message={loadError} />

      {customerFilter && (
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 text-sm">
          <span>
            Showing sales for <span className="font-semibold">{customerName || 'selected customer'}</span>
          </span>
          <button onClick={clearCustomer} className="underline">
            Show all customers
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Documents" value={stats.count} />
        <StatCard label="Total sales" value={formatMoney(stats.total, currency)} />
        <StatCard label="Collected" value={formatMoney(stats.paid, currency)} tone="success" />
        <StatCard label="Outstanding" value={formatMoney(stats.due, currency)} tone={stats.due > 0 ? 'danger' : 'default'} />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200 space-y-3">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setRange('today')} className="btn-secondary text-sm">
              Today
            </button>
            <button onClick={() => setRange('month')} className="btn-secondary text-sm">
              This month
            </button>
            <button onClick={() => setRange('all')} className="btn-secondary text-sm">
              All time
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="relative md:col-span-2">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Number, customer or phone..."
                className="input-field pl-10"
              />
            </div>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input-field" aria-label="From date" />
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input-field" aria-label="To date" />
            <div className="grid grid-cols-2 gap-2">
              <select value={docType} onChange={(e) => setDocType(e.target.value)} className="input-field" aria-label="Type">
                <option value="">All types</option>
                <option value="cash_memo">Cash memo</option>
                <option value="bill">Bill</option>
              </select>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="input-field" aria-label="Status">
                <option value="">Any status</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="large" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Number</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-right">Due</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {visible.map((s) => {
                  const due = round2(toNumber(s.grand_total) - toNumber(s.amount_paid));
                  return (
                    <tr key={s.id} onClick={() => navigate(`/sales/${s.id}`)} className="cursor-pointer hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">{new Date(`${s.sale_date}T00:00:00`).toLocaleDateString('en-IN')}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{s.doc_number}</td>
                      <td className="px-4 py-3">
                        <DocTypeBadge docType={s.doc_type} />
                      </td>
                      <td className="px-4 py-3">
                        <div>{s.customer_name || 'Walk-in'}</div>
                        {s.customer_phone && <div className="text-xs text-gray-500">{s.customer_phone}</div>}
                      </td>
                      <td className="px-4 py-3 text-right">{formatMoney(s.grand_total, currency)}</td>
                      <td className={`px-4 py-3 text-right ${due > 0 ? 'font-semibold text-red-600' : 'text-gray-500'}`}>
                        {due > 0 ? formatMoney(due, currency) : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={s.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {visible.length === 0 && <div className="text-center py-12 text-gray-500">No sales found for these filters.</div>}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sales;
