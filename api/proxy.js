// Vercel serverless function: the only code that talks to the mock API.
//
// Security goals:
//  - the API key stays on the server (env var), never in the browser bundle
//  - the browser can only reach the three endpoints the app needs (list, meta, single order)
//  - every input is validated against an allowlist before it is forwarded
//  - upstream details (errors, headers, redirects) are never passed through to the browser

const UPSTREAM = 'https://hiring.harrisons.my/api/mock/sales-orders';
const TIMEOUT_MS = 8000;
const MAX_BYTES = 2_000_000;
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 120; // requests per IP per window, per server instance (best effort, see README)

const ID_RE = /^[A-Za-z0-9_-]{1,40}$/;
const SORTS = new Set(['SalesId', 'CreatedDateTime1', 'HAR_TotalSOAmount', 'SalesStatus', 'InventSiteId']);

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const bad = (name) => new HttpError(400, `Invalid ${name}`);

const intIn = (name, min, max) => (v) => {
  if (!/^\d{1,6}$/.test(v)) throw bad(name);
  const n = Number(v);
  if (n < min || n > max) throw bad(name);
  return String(n);
};

// One rule per allowed query parameter. Anything not listed here is rejected.
const RULES = {
  page: intIn('page', 1, 100000),
  pageSize: intIn('pageSize', 1, 100),
  status: (v) => {
    if (!/^[A-Za-z ]{1,30}$/.test(v)) throw bad('status');
    return v;
  },
  site: (v) => {
    if (!/^[A-Za-z0-9]{1,10}$/.test(v)) throw bad('site');
    return v;
  },
  q: (v) => {
    if (v.length > 100 || /[\u0000-\u001f\u007f]/.test(v)) throw bad('search text');
    return v;
  },
  sort: (v) => {
    if (!SORTS.has(v)) throw bad('sort');
    return v;
  },
  order: (v) => {
    if (v !== 'asc' && v !== 'desc') throw bad('order');
    return v;
  },
};

function buildUpstreamUrl(reqQuery) {
  const { path = '', ...query } = reqQuery;
  const sub = Array.isArray(path) ? path.join('/') : path;

  // /meta or /<salesId>: a single safe path segment, and no query string
  if (sub !== '') {
    if (!ID_RE.test(sub) || Object.keys(query).length > 0) throw bad('request');
    return new URL(`${UPSTREAM}/${encodeURIComponent(sub)}`);
  }

  // list endpoint: validated, allowlisted query parameters only
  const url = new URL(UPSTREAM);
  for (const [name, value] of Object.entries(query)) {
    const rule = RULES[name];
    if (!rule || typeof value !== 'string') throw bad(`parameter "${name}"`);
    if (value === '') continue;
    url.searchParams.set(name, rule(value));
  }
  return url;
}

// Simple fixed-window limiter. Serverless instances do not share memory, so this only slows
// down casual abuse; use a Vercel Firewall rate-limit rule for a real guarantee.
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (now - v.start > RATE_WINDOW_MS) hits.delete(k);
  }
  const rec = hits.get(ip);
  if (!rec || now - rec.start > RATE_WINDOW_MS) {
    hits.set(ip, { start: now, count: 1 });
    return false;
  }
  rec.count += 1;
  return rec.count > RATE_MAX;
}

const clientIp = (req) =>
  req.headers['x-real-ip'] || String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';

function upstreamError(status) {
  if (status === 404) return new HttpError(404, 'Order not found');
  if (status === 400) return new HttpError(400, 'Request rejected');
  if (status === 429) return new HttpError(429, 'Too many requests');
  if (status === 401 || status === 403) console.error('Upstream rejected the API credentials');
  return new HttpError(502, 'Sales order service error');
}

export default async function handler(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      throw new HttpError(405, 'Method not allowed');
    }
    if (rateLimited(clientIp(req))) {
      res.setHeader('Retry-After', '60');
      throw new HttpError(429, 'Too many requests');
    }

    const key = process.env.ASSESSMENT_API_KEY;
    if (!key) {
      console.error('ASSESSMENT_API_KEY is not set');
      throw new HttpError(500, 'Server configuration error');
    }

    const url = buildUpstreamUrl(req.query);
    const upstream = await fetch(url, {
      headers: { 'x-assessment-key': key, Accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      redirect: 'error', // never follow a redirect to another host with our key attached
    });

    const text = await upstream.text();
    if (!upstream.ok) throw upstreamError(upstream.status);
    if (text.length > MAX_BYTES) throw new HttpError(502, 'Sales order service error');
    try {
      JSON.parse(text);
    } catch {
      throw new HttpError(502, 'Sales order service error');
    }

    res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
    return res.status(200).send(text);
  } catch (err) {
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
    if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
      return res.status(504).json({ error: 'The sales order service timed out' });
    }
    console.error('Proxy failure:', err?.name || 'unknown');
    return res.status(502).json({ error: 'Could not reach the sales order service' });
  }
}
