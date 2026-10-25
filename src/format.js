const money = new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' });
const int = new Intl.NumberFormat('en-MY');

export const formatMoney = (n) => money.format(Number(n) || 0);
export const formatInt = (n) => int.format(Number(n) || 0);

export function formatDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('en-MY', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
