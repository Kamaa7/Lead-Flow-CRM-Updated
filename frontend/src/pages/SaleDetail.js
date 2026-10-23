import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeftIcon, ArrowDownTrayIcon, PrinterIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import SaleDocument from '../components/store/SaleDocument';
import { ErrorBanner, Field, StatusBadge, DocTypeBadge } from '../components/store/StoreUI';
import { getSale, recordPayment, PAYMENT_METHODS, paymentMethodLabel } from '../services/storeApi';
import { useStoreProfile } from '../hooks/useStoreProfile';
import { formatMoney, round2, toNumber } from '../utils/money';

const SaleDetail = () => {
  const { id } = useParams();
  const { profile, currency } = useStoreProfile();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [payOpen, setPayOpen] = useState(false);
  const [payment, setPayment] = useState({ amount: '', method: 'cash', note: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await getSale(id));
      setLoadError(null);
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <Link to="/sales" className="inline-flex items-center gap-1 text-sm underline">
          <ArrowLeftIcon className="h-4 w-4" /> Back to sales
        </Link>
        <ErrorBanner message={loadError || 'Sale not found'} />
      </div>
    );
  }

  const { sale, items, payments } = data;
  const due = round2(toNumber(sale.grand_total) - toNumber(sale.amount_paid));

  const openPayment = () => {
    setPayment({ amount: due.toFixed(2), method: 'cash', note: '' });
    setPayOpen(true);
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    const amount = round2(toNumber(payment.amount));
    if (amount <= 0) {
      toast.error('Enter an amount greater than zero');
      return;
    }
    if (amount > due) {
      toast.error(`Amount is more than the balance due (${formatMoney(due, currency)})`);
      return;
    }
    setSaving(true);
    try {
      await recordPayment({ saleId: sale.id, amount, method: payment.method, note: payment.note });
      toast.success('Payment recorded');
      setPayOpen(false);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link to="/sales" className="inline-flex items-center gap-1 text-sm text-gray-600 underline">
            <ArrowLeftIcon className="h-4 w-4" /> Sales register
          </Link>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{sale.doc_number}</h1>
            <DocTypeBadge docType={sale.doc_type} />
            <StatusBadge status={sale.status} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {due > 0 && (
            <button onClick={openPayment} className="btn-outline flex items-center gap-2">
              <BanknotesIcon className="h-5 w-5" />
              Record Payment
            </button>
          )}
          <Link to={`/sales/${sale.id}/print?download=1`} className="btn-secondary flex items-center gap-2">
            <ArrowDownTrayIcon className="h-5 w-5" />
            Download PDF
          </Link>
          <Link to={`/sales/${sale.id}/print?autoprint=1`} className="btn-primary flex items-center gap-2">
            <PrinterIcon className="h-5 w-5" />
            Print
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <SaleDocument sale={sale} items={items} profile={profile} />
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-2 text-sm">
            <h2 className="font-semibold text-gray-900">Summary</h2>
            <div className="flex justify-between">
              <span className="text-gray-600">Total</span>
              <span className="font-medium">{formatMoney(sale.grand_total, currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Paid</span>
              <span className="text-green-700">{formatMoney(sale.amount_paid, currency)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Balance due</span>
              <span className={due > 0 ? 'text-red-600' : ''}>{formatMoney(due, currency)}</span>
            </div>
            {sale.customer_id && (
              <Link to={`/sales?customer=${sale.customer_id}`} className="block pt-2 underline">
                All sales for this customer
              </Link>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-900 mb-2">Payments</h2>
            {payments.length === 0 ? (
              <p className="text-sm text-gray-500">No payments yet.</p>
            ) : (
              <ul className="divide-y divide-gray-100 text-sm">
                {payments.map((p) => (
                  <li key={p.id} className="py-2 flex justify-between gap-3">
                    <div>
                      <div>{new Date(p.paid_at).toLocaleString('en-IN')}</div>
                      <div className="text-xs text-gray-500">
                        {paymentMethodLabel(p.method)}
                        {p.note ? ` · ${p.note}` : ''}
                      </div>
                    </div>
                    <div className="font-medium whitespace-nowrap">{formatMoney(p.amount, currency)}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={payOpen} onClose={() => setPayOpen(false)} title={`Record payment — ${sale.doc_number}`}>
        <form onSubmit={handlePayment} className="space-y-4">
          <p className="text-sm text-gray-600">Balance due: {formatMoney(due, currency)}</p>
          <Field label={`Amount (${currency})`} required>
            <input
              type="number"
              value={payment.amount}
              onChange={(e) => setPayment((prev) => ({ ...prev, amount: e.target.value }))}
              min="0.01"
              max={due}
              step="0.01"
              className="input-field"
              required
              autoFocus
            />
          </Field>
          <Field label="Method">
            <select
              value={payment.method}
              onChange={(e) => setPayment((prev) => ({ ...prev, method: e.target.value }))}
              className="input-field"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Note">
            <input
              value={payment.note}
              onChange={(e) => setPayment((prev) => ({ ...prev, note: e.target.value }))}
              className="input-field"
              placeholder="Reference, cheque no..."
            />
          </Field>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setPayOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
              {saving ? 'Saving...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SaleDetail;
