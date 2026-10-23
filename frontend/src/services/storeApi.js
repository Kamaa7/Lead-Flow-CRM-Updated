import { supabase } from '../supabaseClient';
import { roundTo } from '../utils/money';

const MISSING_TABLE_CODES = ['PGRST205', '42P01', 'PGRST202'];

const unwrap = ({ data, error }) => {
  if (error) {
    if (MISSING_TABLE_CODES.includes(error.code)) {
      throw new Error(
        'Store tables are not set up in Supabase yet. Run supabase/migrations/001_store_module.sql in the Supabase SQL Editor.'
      );
    }
    if (error.code === '23503' && /sale_items/.test(error.message || '')) {
      throw new Error('This product appears on saved sales and cannot be deleted. Mark it inactive instead.');
    }
    if (error.code === '23505' && /sku/i.test(error.message || '')) {
      throw new Error('Another product already uses this SKU.');
    }
    throw new Error(error.message || 'Request failed');
  }
  return data;
};

const blankToNull = (value) => {
  if (typeof value !== 'string') return value ?? null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
};

// Store profile

export const getStoreProfile = async () =>
  unwrap(await supabase.from('store_profiles').select('*').maybeSingle());

export const saveStoreProfile = async (userId, profile) =>
  unwrap(
    await supabase
      .from('store_profiles')
      .upsert(
        {
          user_id: userId,
          business_name: (profile.business_name || '').trim(),
          address: blankToNull(profile.address),
          phone: blankToNull(profile.phone),
          email: blankToNull(profile.email),
          gstin: blankToNull(profile.gstin),
          memo_footer: blankToNull(profile.memo_footer),
          currency: (profile.currency || 'INR').trim().toUpperCase(),
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single()
  );

// Products

const productFields = (p) => ({
  sku: blankToNull(p.sku),
  name: (p.name || '').trim(),
  unit: (p.unit || 'pcs').trim() || 'pcs',
  sale_price: Number(p.sale_price) || 0,
  tax_rate: Number(p.tax_rate) || 0,
  low_stock_alert: Number(p.low_stock_alert) || 0,
  is_active: p.is_active !== false,
});

export const listProducts = async () =>
  unwrap(await supabase.from('products').select('*').order('name', { ascending: true }));

export const createProduct = async (product) =>
  unwrap(
    await supabase
      .from('products')
      .insert({ ...productFields(product), stock_qty: Number(product.stock_qty) || 0 })
      .select()
      .single()
  );

export const updateProduct = async (id, product) =>
  unwrap(await supabase.from('products').update(productFields(product)).eq('id', id).select().single());

export const setProductActive = async (id, isActive) =>
  unwrap(await supabase.from('products').update({ is_active: isActive }).eq('id', id).select().single());

export const deleteProduct = async (id) => unwrap(await supabase.from('products').delete().eq('id', id));

export const adjustStock = async ({ productId, changeQty, reason, note }) =>
  unwrap(
    await supabase.rpc('adjust_stock', {
      p_product_id: productId,
      p_change_qty: roundTo(changeQty, 3),
      p_reason: reason,
      p_note: blankToNull(note),
    })
  );

export const listStockMovements = async (productId) =>
  unwrap(
    await supabase
      .from('stock_movements')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .limit(100)
  );

// Customers

const customerFields = (c) => ({
  name: (c.name || '').trim(),
  phone: blankToNull(c.phone),
  email: blankToNull(c.email),
  address: blankToNull(c.address),
  gstin: blankToNull(c.gstin),
  notes: blankToNull(c.notes),
  lead_id: c.lead_id || null,
});

export const listCustomers = async () =>
  unwrap(await supabase.from('customers').select('*').order('name', { ascending: true }));

export const createCustomer = async (customer) =>
  unwrap(await supabase.from('customers').insert(customerFields(customer)).select().single());

export const updateCustomer = async (id, customer) =>
  unwrap(await supabase.from('customers').update(customerFields(customer)).eq('id', id).select().single());

export const deleteCustomer = async (id) => unwrap(await supabase.from('customers').delete().eq('id', id));

export const listLeadsForImport = async () =>
  unwrap(
    await supabase
      .from('leads')
      .select('id, name, email, phone, company')
      .order('created_at', { ascending: false })
      .limit(500)
  );

// Sales

export const createSale = async (sale) =>
  unwrap(
    await supabase.rpc('create_sale', {
      p_doc_type: sale.docType,
      p_items: sale.items.map((item) => ({
        product_id: item.product_id || null,
        description: item.description,
        unit: item.unit,
        qty: roundTo(item.qty, 3),
        unit_price: roundTo(item.unit_price, 2),
        tax_rate: roundTo(item.tax_rate, 2),
      })),
      p_customer_id: sale.customerId || null,
      p_customer_name: blankToNull(sale.customerName),
      p_customer_phone: blankToNull(sale.customerPhone),
      p_customer_address: blankToNull(sale.customerAddress),
      p_discount: roundTo(sale.discount, 2),
      p_amount_paid: sale.docType === 'bill' ? roundTo(sale.amountPaid, 2) : null,
      p_payment_method: sale.paymentMethod || 'cash',
      p_sale_date: sale.saleDate || null,
      p_notes: blankToNull(sale.notes),
    })
  );

export const listSales = async ({ from, to, docType, status, customerId } = {}) => {
  let query = supabase
    .from('sales')
    .select('*')
    .order('sale_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1000);
  if (from) query = query.gte('sale_date', from);
  if (to) query = query.lte('sale_date', to);
  if (docType) query = query.eq('doc_type', docType);
  if (status) query = query.eq('status', status);
  if (customerId) query = query.eq('customer_id', customerId);
  return unwrap(await query);
};

export const listOutstandingByCustomer = async () => {
  const rows = unwrap(
    await supabase.from('sales').select('customer_id, grand_total, amount_paid').neq('status', 'paid')
  );
  return rows.reduce((acc, row) => {
    if (!row.customer_id) return acc;
    acc[row.customer_id] = (acc[row.customer_id] || 0) + Number(row.grand_total) - Number(row.amount_paid);
    return acc;
  }, {});
};

export const getSale = async (id) => {
  const [sale, items, payments] = await Promise.all([
    supabase.from('sales').select('*').eq('id', id).maybeSingle().then(unwrap),
    supabase.from('sale_items').select('*').eq('sale_id', id).order('position', { ascending: true }).then(unwrap),
    supabase.from('sale_payments').select('*').eq('sale_id', id).order('paid_at', { ascending: true }).then(unwrap),
  ]);
  if (!sale) throw new Error('Sale not found');
  return { sale, items, payments };
};

export const recordPayment = async ({ saleId, amount, method, note }) =>
  unwrap(
    await supabase.rpc('record_sale_payment', {
      p_sale_id: saleId,
      p_amount: roundTo(amount, 2),
      p_method: method || 'cash',
      p_note: blankToNull(note),
    })
  );

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'card', label: 'Card' },
  { value: 'bank', label: 'Bank transfer' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'other', label: 'Other' },
];

export const paymentMethodLabel = (value) =>
  PAYMENT_METHODS.find((m) => m.value === value)?.label || value || '-';

export const DOC_TYPE_LABELS = { cash_memo: 'Cash Memo', bill: 'Bill' };
