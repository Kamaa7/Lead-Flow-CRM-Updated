/* global BigInt */

export const round2 = (value) => {
  const n = Number(value) || 0;
  return Math.sign(n) * Math.round((Math.abs(n) + Number.EPSILON) * 100) / 100;
};

export const toNumber = (value) => {
  if (value === '' || value === null || value === undefined) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

export const formatMoney = (value, currency = 'INR') => {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(toNumber(value));
  } catch {
    return `${currency || ''} ${toNumber(value).toFixed(2)}`.trim();
  }
};

export const formatQty = (value) => {
  const n = toNumber(value);
  return Number.isInteger(n) ? String(n) : String(Number(n.toFixed(3)));
};

const scaled = (value, decimals) => BigInt(Math.round(toNumber(value) * 10 ** decimals));

// Half-up division, the same rounding Postgres round() uses for positive numerics.
const divRound = (numerator, denominator) =>
  numerator < 0n ? -divRound(-numerator, denominator) : (2n * numerator + denominator) / (2n * denominator);

const fromPaise = (paise) => Number(paise) / 100;

// Values sent to the database are rounded here first so the preview and the stored sale agree.
export const roundTo = (value, decimals) => Number(scaled(value, decimals)) / 10 ** decimals;

// Mirrors public.create_sale in supabase/migrations/001_store_module.sql using exact
// integer paise, so the on-screen preview always equals what the database stores.
export const computeTotals = (items, discount) => {
  let subtotalPaise = 0n;
  let taxNumerator = 0n;
  const lines = items.map((item) => {
    const qtyMilli = scaled(item.qty, 3);
    const pricePaise = scaled(item.unit_price, 2);
    const rateBasisPoints = scaled(item.tax_rate, 2);
    const linePaise = divRound(qtyMilli * pricePaise, 1000n);
    subtotalPaise += linePaise;
    taxNumerator += linePaise * rateBasisPoints;
    return fromPaise(linePaise);
  });
  const discountPaise = scaled(discount, 2);
  const taxPaise =
    subtotalPaise > 0n ? divRound(taxNumerator * (subtotalPaise - discountPaise), subtotalPaise * 10000n) : 0n;
  return {
    lines,
    subtotal: fromPaise(subtotalPaise),
    discount: fromPaise(discountPaise),
    taxable: fromPaise(subtotalPaise - discountPaise),
    tax: fromPaise(taxPaise),
    grand: fromPaise(subtotalPaise - discountPaise + taxPaise),
  };
};

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

const belowHundred = (n) => (n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ''}`);

const belowThousand = (n) => {
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  return [hundreds ? `${ONES[hundreds]} Hundred` : '', rest ? belowHundred(rest) : ''].filter(Boolean).join(' ');
};

// Indian numbering: crore, lakh, thousand.
const integerToIndianWords = (num) => {
  if (num === 0) return 'Zero';
  const parts = [];
  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const rest = num % 1000;
  if (crore) parts.push(`${integerToIndianWords(crore)} Crore`);
  if (lakh) parts.push(`${belowHundred(lakh)} Lakh`);
  if (thousand) parts.push(`${belowHundred(thousand)} Thousand`);
  if (rest) parts.push(belowThousand(rest));
  return parts.join(' ');
};

export const amountInWords = (value, currency = 'INR') => {
  const total = round2(Math.abs(toNumber(value)));
  const whole = Math.floor(total);
  const fraction = Math.round((total - whole) * 100);
  if (currency !== 'INR') {
    return `${integerToIndianWords(whole)}${fraction ? ` and ${fraction}/100` : ''} Only`;
  }
  return `Rupees ${integerToIndianWords(whole)}${fraction ? ` and ${belowHundred(fraction)} Paise` : ''} Only`;
};

export const todayISO = () => {
  const d = new Date();
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 10);
};
