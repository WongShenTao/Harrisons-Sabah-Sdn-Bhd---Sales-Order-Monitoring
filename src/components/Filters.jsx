export default function Filters({ search, site, status, sites, statuses, onSearch, onSite, onStatus, onClear }) {
  const active = search || site || status;
  return (
    <form className="filters" role="search" onSubmit={(e) => e.preventDefault()}>
      <label className="field field-search">
        <span>Search</span>
        <input
          type="search"
          placeholder="Order no., customer, account, reference or sales taker"
          value={search}
          maxLength={100}
          autoComplete="off"
          onChange={(e) => onSearch(e.target.value)}
        />
      </label>
      <label className="field">
        <span>Branch</span>
        <select value={site} onChange={(e) => onSite(e.target.value)}>
          <option value="">All branches</option>
          {sites.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Status</span>
        <select value={status} onChange={(e) => onStatus(e.target.value)}>
          <option value="">All statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </label>
      <button type="button" className="btn btn-quiet" onClick={onClear} disabled={!active}>
        Clear filters
      </button>
    </form>
  );
}
