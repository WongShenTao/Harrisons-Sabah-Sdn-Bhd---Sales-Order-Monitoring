import { formatInt } from '../format.js';

export default function Pager({ page, pageSize, total, totalPages, disabled, onPage, onPageSize }) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <nav className="pager" aria-label="Pagination">
      <span className="pager-info">
        {formatInt(from)} to {formatInt(to)} of {formatInt(total)} orders
      </span>
      <div className="pager-controls">
        <label className="field-inline">
          <span>Rows</span>
          <select value={pageSize} onChange={(e) => onPageSize(Number(e.target.value))}>
            {[25, 50, 100].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
        <button type="button" className="btn" disabled={disabled || page <= 1} onClick={() => onPage(page - 1)}>
          Previous
        </button>
        <span className="pager-page">Page {formatInt(page)} of {formatInt(totalPages)}</span>
        <button type="button" className="btn" disabled={disabled || page >= totalPages} onClick={() => onPage(page + 1)}>
          Next
        </button>
      </div>
    </nav>
  );
}
