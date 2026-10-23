import React from 'react';
import { amountInWords, formatMoney, formatQty, round2, toNumber } from '../../utils/money';
import { paymentMethodLabel } from '../../services/storeApi';

const SaleDocument = ({ sale, items, profile }) => {
  const currency = profile?.currency || 'INR';
  const isBill = sale.doc_type === 'bill';
  const title = isBill ? (profile?.gstin && toNumber(sale.tax_total) > 0 ? 'TAX INVOICE' : 'BILL') : 'CASH MEMO';
  const due = round2(toNumber(sale.grand_total) - toNumber(sale.amount_paid));
  const hasTax = items.some((i) => toNumber(i.tax_rate) > 0);

  return (
    <div className="sale-document bg-white text-gray-900 text-sm">
      <div className="text-center border-b-2 border-gray-900 pb-3">
        <h1 className="text-2xl font-bold uppercase tracking-wide">{profile?.business_name || 'Your Store Name'}</h1>
        {profile?.address && <p className="whitespace-pre-line">{profile.address}</p>}
        <p>
          {[profile?.phone && `Ph: ${profile.phone}`, profile?.email].filter(Boolean).join(' · ')}
        </p>
        {profile?.gstin && <p className="font-medium">GSTIN: {profile.gstin}</p>}
      </div>

      <div className="text-center my-3">
        <span className="inline-block border border-gray-900 px-4 py-1 font-bold tracking-widest">{title}</span>
      </div>

      <div className="flex justify-between gap-6 mb-4">
        <div>
          <div className="text-xs uppercase text-gray-500">{isBill ? 'Billed to' : 'Customer'}</div>
          <div className="font-semibold">{sale.customer_name || 'Walk-in customer'}</div>
          {sale.customer_phone && <div>{sale.customer_phone}</div>}
          {sale.customer_address && <div className="whitespace-pre-line">{sale.customer_address}</div>}
          {sale.customer_gstin && <div>GSTIN: {sale.customer_gstin}</div>}
        </div>
        <div className="text-right">
          <div>
            <span className="text-gray-500">No: </span>
            <span className="font-semibold">{sale.doc_number}</span>
          </div>
          <div>
            <span className="text-gray-500">Date: </span>
            {new Date(`${sale.sale_date}T00:00:00`).toLocaleDateString('en-IN')}
          </div>
        </div>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-y border-gray-900 text-left">
            <th className="py-1 pr-2 w-8">#</th>
            <th className="py-1 pr-2">Particulars</th>
            <th className="py-1 px-2 text-right">Qty</th>
            <th className="py-1 px-2 text-right">Rate</th>
            {hasTax && <th className="py-1 px-2 text-right">Tax %</th>}
            <th className="py-1 pl-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-gray-200 align-top">
              <td className="py-1 pr-2">{item.position}</td>
              <td className="py-1 pr-2">{item.description}</td>
              <td className="py-1 px-2 text-right whitespace-nowrap">
                {formatQty(item.qty)} {item.unit}
              </td>
              <td className="py-1 px-2 text-right whitespace-nowrap">{formatMoney(item.unit_price, currency)}</td>
              {hasTax && <td className="py-1 px-2 text-right">{formatQty(item.tax_rate)}</td>}
              <td className="py-1 pl-2 text-right whitespace-nowrap">{formatMoney(item.line_amount, currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end mt-3">
        <dl className="w-full max-w-xs space-y-1">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{formatMoney(sale.subtotal, currency)}</dd>
          </div>
          {toNumber(sale.discount) > 0 && (
            <div className="flex justify-between">
              <dt>Less: Discount</dt>
              <dd>- {formatMoney(sale.discount, currency)}</dd>
            </div>
          )}
          {toNumber(sale.tax_total) > 0 && (
            <>
              <div className="flex justify-between text-gray-600">
                <dt>Taxable value</dt>
                <dd>{formatMoney(round2(toNumber(sale.subtotal) - toNumber(sale.discount)), currency)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Tax</dt>
                <dd>{formatMoney(sale.tax_total, currency)}</dd>
              </div>
            </>
          )}
          <div className="flex justify-between border-t-2 border-gray-900 pt-1 text-base font-bold">
            <dt>Grand Total</dt>
            <dd>{formatMoney(sale.grand_total, currency)}</dd>
          </div>
          {isBill && (
            <>
              <div className="flex justify-between">
                <dt>Paid</dt>
                <dd>{formatMoney(sale.amount_paid, currency)}</dd>
              </div>
              <div className="flex justify-between font-semibold">
                <dt>Balance due</dt>
                <dd>{formatMoney(due, currency)}</dd>
              </div>
            </>
          )}
        </dl>
      </div>

      <p className="mt-3 italic">{amountInWords(sale.grand_total, currency)}</p>
      <p className="mt-1 text-gray-600">
        {isBill
          ? due > 0
            ? `Payment status: ${sale.status === 'partial' ? 'Partly paid' : 'Unpaid'}`
            : 'Payment status: Paid in full'
          : `Paid by ${paymentMethodLabel(sale.payment_method)}`}
      </p>
      {sale.notes && <p className="mt-1">Note: {sale.notes}</p>}

      <div className="flex justify-between items-end mt-12">
        <p className="text-gray-600 max-w-sm whitespace-pre-line">{profile?.memo_footer || 'Thank you for your business!'}</p>
        <div className="text-center">
          <div className="border-t border-gray-900 w-40 pt-1">Authorised Signatory</div>
          {profile?.business_name && <div className="text-xs text-gray-600">for {profile.business_name}</div>}
        </div>
      </div>
    </div>
  );
};

export default SaleDocument;
