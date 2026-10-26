import { useCallback, useEffect, useState } from 'react';
import { fetchFacets, fetchFilteredSummary, fetchOrders } from './api.js';
import { COLUMNS } from './constants.js';
import SummaryBand from './components/SummaryBand.jsx';
import Filters from './components/Filters.jsx';
import OrdersTable from './components/OrdersTable.jsx';
import Pager from './components/Pager.jsx';
import OrderDialog from './components/OrderDialog.jsx';

const INITIAL_PARAMS = {
  q: '',
  site: '',
  status: '',
  sort: 'SalesId',
  order: 'asc',
  page: 1,
  pageSize: 25,
};

export default function App() {
  // `search` is what is typed in the box; `params.q` is the debounced value sent to the API.
  const [search, setSearch] = useState('');
  const [params, setParams] = useState(INITIAL_PARAMS);
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedId, setSelectedId] = useState(null);

  const [list, setList] = useState({ status: 'loading', orders: [], summary: null, total: 0, totalPages: 1, error: '' });
  const [facets, setFacets] = useState({ statuses: [], sites: [] });
  // Dashboard totals for the current filters (only used while a search/filter is active).
  const [stats, setStats] = useState({ status: 'ready', summary: null });
  const [overallTotal, setOverallTotal] = useState(0);

  const hasFilters = Boolean(params.q || params.site || params.status);

  // Change some params. Any change except the page number itself goes back to page 1.
  const update = useCallback((patch) => setParams((p) => ({ ...p, page: 1, ...patch })), []);

  // Wait 350 ms after typing stops before searching, so we don't call the API on every keystroke.
  useEffect(() => {
    const next = search.trim();
    const t = setTimeout(() => {
      setParams((p) => (p.q === next ? p : { ...p, q: next, page: 1 }));
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  // Branch and status dropdown options (best effort: the app still works if this fails).
  useEffect(() => {
    const ctrl = new AbortController();
    fetchFacets(ctrl.signal)
      .then(setFacets)
      .catch(() => {});
    return () => ctrl.abort();
  }, []);

  // Load the current page of orders whenever any parameter changes (or "Try again" is pressed).
  useEffect(() => {
    const ctrl = new AbortController();
    setList((s) => ({ ...s, status: 'loading', error: '' }));
    fetchOrders(params, ctrl.signal)
      .then((result) => {
        setList({ status: 'ready', ...result, error: '' });
        // With no filters, the API summary describes the whole dataset: remember its size.
        if (!params.q && !params.site && !params.status && result.summary) {
          setOverallTotal(result.summary.total_orders);
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setList((s) => ({ ...s, status: 'error', error: err.message }));
      });
    return () => ctrl.abort();
  }, [params, reloadKey]);

  // Dashboard totals that follow the search and filters. Paging and sorting do not affect them,
  // so this effect only depends on q, site and status.
  useEffect(() => {
    if (!hasFilters) {
      setStats({ status: 'ready', summary: null });
      return undefined;
    }
    const ctrl = new AbortController();
    setStats((s) => ({ ...s, status: 'loading' }));
    fetchFilteredSummary({ q: params.q, site: params.site, status: params.status }, ctrl.signal)
      .then((summary) => setStats({ status: 'ready', summary }))
      .catch((err) => {
        if (err.name !== 'AbortError') setStats({ status: 'error', summary: null });
      });
    return () => ctrl.abort();
  }, [hasFilters, params.q, params.site, params.status, reloadKey]);

  // Header click: same column flips direction, a new column uses its default direction.
  const toggleSort = (key) => {
    const col = COLUMNS.find((c) => c.key === key);
    if (params.sort === key) update({ order: params.order === 'asc' ? 'desc' : 'asc' });
    else update({ sort: key, order: col?.defaultOrder ?? 'asc' });
  };
  // Mobile dropdown: pick a column, use its default direction.
  const pickSort = (key) => {
    const col = COLUMNS.find((c) => c.key === key);
    update({ sort: key, order: col?.defaultOrder ?? 'asc' });
  };

  const clearFilters = () => {
    setSearch('');
    setParams((p) => ({ ...p, q: '', site: '', status: '', page: 1 }));
  };

  const filtered = Boolean(search || params.site || params.status);
  const loading = list.status === 'loading';
  const firstLoad = loading && list.summary === null && list.orders.length === 0;

  // No filters: the API's own summary. Filters on: totals computed for the matching orders.
  const bandSummary = hasFilters ? stats.summary : list.summary;

  return (
    <div className="app">
      <header className="masthead">
        <h1>Sales orders</h1>
        <p>Monitor orders across branches. Data is fictional and read-only.</p>
      </header>

      <main>
        <SummaryBand
          summary={bandSummary}
          overallTotal={overallTotal}
          filtered={hasFilters}
          busy={hasFilters && stats.status === 'loading'}
          error={hasFilters && stats.status === 'error'}
          onRetry={() => setReloadKey((k) => k + 1)}
        />

        <Filters
          search={search}
          site={params.site}
          status={params.status}
          sites={facets.sites}
          statuses={facets.statuses}
          onSearch={setSearch}
          onSite={(site) => update({ site })}
          onStatus={(status) => update({ status })}
          onClear={clearFilters}
        />

        {list.status === 'error' && (
          <div className="state state-error" role="alert">
            <h2>Orders could not be loaded</h2>
            <p>{list.error}</p>
            <button type="button" className="btn btn-primary" onClick={() => setReloadKey((k) => k + 1)}>
              Try again
            </button>
          </div>
        )}

        {firstLoad && (
          <div className="state" role="status">
            <p>Loading orders...</p>
            <div className="skeleton-rows" aria-hidden="true">
              {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton skeleton-row" />)}
            </div>
          </div>
        )}

        {list.status === 'ready' && list.orders.length === 0 && (
          <div className="state">
            <h2>No orders match</h2>
            <p>{filtered ? 'Try a different search, or clear the filters to see every order.' : 'There are no orders to show yet.'}</p>
            {filtered && <button type="button" className="btn" onClick={clearFilters}>Clear filters</button>}
          </div>
        )}

        {list.orders.length > 0 && list.status !== 'error' && (
          <>
            <OrdersTable
              orders={list.orders}
              busy={loading}
              sort={params.sort}
              order={params.order}
              onSort={toggleSort}
              onPickSort={pickSort}
              onSelect={setSelectedId}
            />
            <Pager
              page={params.page}
              pageSize={params.pageSize}
              total={list.total}
              totalPages={list.totalPages}
              disabled={loading}
              onPage={(page) => update({ page })}
              onPageSize={(pageSize) => update({ pageSize })}
            />
          </>
        )}
      </main>

      {selectedId && <OrderDialog orderId={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  );
}
