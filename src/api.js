const BASE = '/api/sales-orders';
const ID_RE = /^[A-Za-z0-9_-]{1,40}$/;

export class ApiError extends Error {}

// Friendly, fixed messages. We never show text that came from the server's response body.
function messageFor(status) {
  if (status === 400) return 'The request was not accepted. Adjust your search and try again.';
  if (status === 404) return 'That order could not be found.';
  if (status === 429) return 'Too many requests. Please wait a moment and try again.';
  if (status === 504) return 'The service took too long to respond. Please try again.';
  return `The service is unavailable right now (error ${status}). Please try again.`;
}

async function request(path, params, signal) {
  const url = new URL(BASE + path, window.location.origin);
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
  });

  let res;
  try {
    res = await fetch(url, { signal, headers: { Accept: 'application/json' }, credentials: 'omit' });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError('Cannot reach the server. Check your connection and try again.');
  }

  if (!res.ok) throw new ApiError(messageFor(res.status));

  try {
    return await res.json();
  } catch {
    throw new ApiError('The server returned a response that could not be read.');
  }
}

// ---- tiny validators: never trust the shape of data from the network ----
const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

function parseSummary(s) {
  if (!isObject(s)) return null;
  return {
    total_orders: num(s.total_orders),
    filtered_orders: num(s.filtered_orders),
    open_orders: num(s.open_orders),
    invoiced_orders: num(s.invoiced_orders),
    delivered_orders: num(s.delivered_orders),
    cancelled_orders: num(s.cancelled_orders),
    total_order_value: num(s.total_order_value),
  };
}

// GET /sales-orders -> { summary, page, pageSize, total, totalPages, sort, order, data: [...] }
export async function fetchOrders(params, signal) {
  const json = await request('', params, signal);
  if (!isObject(json) || !Array.isArray(json.data)) {
    throw new ApiError('The server returned data in an unexpected format.');
  }
  return {
    orders: json.data.filter((o) => isObject(o) && typeof o.SalesId === 'string'),
    summary: parseSummary(json.summary),
    total: num(json.total),
    totalPages: Math.max(1, num(json.totalPages)),
  };
}

// GET /sales-orders/:id -> { data: { ...order } }
export async function fetchOrder(id, signal) {
  if (!ID_RE.test(id)) throw new ApiError('That is not a valid order number.');
  const json = await request(`/${encodeURIComponent(id)}`, null, signal);
  if (!isObject(json) || !isObject(json.data)) {
    throw new ApiError('The server returned data in an unexpected format.');
  }
  return json.data;
}

// GET /sales-orders/meta -> { facets: { statuses: [{value,count}], sites: [{value,count}] } }
export async function fetchFacets(signal) {
  const json = await request('/meta', null, signal);
  const values = (list) =>
    (Array.isArray(list) ? list : [])
      .map((f) => (isObject(f) ? f.value : null))
      .filter((v) => typeof v === 'string' && v.length > 0 && v.length <= 40);
  return { statuses: values(json?.facets?.statuses), sites: values(json?.facets?.sites) };
}
