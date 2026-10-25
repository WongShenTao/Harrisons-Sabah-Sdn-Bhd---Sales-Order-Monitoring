# Sales Order Monitor

React + Vite single-page app that monitors fictional sales orders across branches, deployed on Vercel.
Data comes only from the read-only mock REST API (`https://hiring.harrisons.my/api/mock/sales-orders`).

## Features
- Dashboard: total orders, open, completed (invoiced + delivered), cancelled, total order value, status share bar
- Order list: order number, customer, branch, order date, status, amount, with server-side pagination
- Server-side sorting (order no., branch, order date, status, amount) via the API's `sort` and `order` params
- Debounced search plus branch and status filters, all sent to the API as query params
- Click an order number to load its detail from `GET /sales-orders/:id`
- Loading, empty and error states (with retry); responsive layout (table becomes cards on phones)

## Run locally
```bash
npm install
cp .env.example .env     # then put the assessment API key in .env
npm run dev              # http://localhost:5173
```

## Deploy to Vercel
1. Push this repo to GitHub (public). Make sure `.env` is not committed.
2. Import it in Vercel (framework preset: Vite).
3. Add environment variable `ASSESSMENT_API_KEY` (the key from the assessment brief) for Production and Preview.
4. Deploy.

## Architecture / API integration notes
- **Proxy**: the browser calls same-origin `/api/sales-orders/...`. In production a Vercel function (`api/proxy.js`, wired by `vercel.json` rewrites) forwards GET requests to the mock API and adds the `x-assessment-key` header from an env var. In dev, `vite.config.js` proxies the same path.
- **Response mapping**: list response is `{ summary, page, pageSize, total, totalPages, sort, order, data[] }`. Columns, status colours and detail fields are defined in `src/constants.js`.
- **State**: one `params` object (search, branch, status, sort, order, page, pageSize) drives a single fetch effect. Changing anything except the page returns to page 1. Requests use `AbortController` so stale responses never overwrite newer ones.
- Currency is assumed to be MYR (`src/format.js`).

## Security notes
| Area | Measure |
|---|---|
| Secrets | API key only in a server-side env var; `.env*` git-ignored; `.env.example` has a placeholder; key never sent to the browser or logged |
| Proxy input | Path allowlist (list, `meta`, or one safe id segment); query-parameter allowlist with per-field validation (ints in range, `sort` from a fixed list, `order` asc/desc, length limits); unknown or repeated params get `400` |
| Proxy output | Method must be `GET`; upstream errors are mapped to generic messages; response must be valid JSON under 2 MB; redirects are refused; 8 s timeout |
| Abuse | Best-effort per-IP rate limit in the function (per instance only). For a real guarantee add a Vercel Firewall rate-limit rule on `/api/*` |
| Browser headers | CSP (`default-src 'self'`, no inline scripts, `frame-ancestors 'none'`), HSTS, `nosniff`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, COOP (see `vercel.json`) |
| XSS | React escapes all rendered values; no `dangerouslySetInnerHTML`; no `eval`; fonts self-hosted so no third-party scripts or styles |
| Client data handling | API responses are shape-checked and numbers coerced before use; order ids validated before building a URL; error messages are fixed strings, never raw server text; `credentials: 'omit'` |
| Build | Source maps disabled; assets never inlined as `data:` URIs |
| Dependencies | Few dependencies; commit `package-lock.json`; `npm run audit:prod`; Dependabot config in `.github/` |

Known limits: the app has no user login (the data is fictional and public by design), so anyone with the URL can read it through the proxy. The assessment key is a shared mock key, but it is still kept out of the repo and the bundle as good practice. The CSP applies to the deployed site, not the Vite dev server.

## Testing
Manual checks: initial load, pagination, page size, search, each filter and combinations, sort on each column in both directions, clear filters, empty result, error state (wrong key / offline), order detail dialog, responsive widths (360px, 768px, desktop).
Security checks: open DevTools and confirm the key is absent from the Network tab and JS bundle; `/api/sales-orders?sort=Evil`, `?page=-1`, `?foo=1` and `/api/sales-orders/a/b` return `400`; a `POST` returns `405`; response headers include the CSP; the console shows no CSP violations.

## AI-use disclosure
Scaffold, components and security hardening were generated with Claude, then reviewed and tested by the author.
