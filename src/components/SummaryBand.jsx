import { formatInt, formatMoney } from '../format.js';

export default function SummaryBand({ summary, filtered }) {
  if (!summary) {
    return (
      <section className="band" aria-busy="true" aria-label="Order summary loading">
        <div className="stats">
          {[0, 1, 2, 3, 4].map((i) => (
            <div className="stat" key={i}>
              <div className="skeleton skeleton-label" />
              <div className="skeleton skeleton-num" />
            </div>
          ))}
        </div>
        <div className="skeleton skeleton-bar" />
      </section>
    );
  }

  // API fields: total_orders, filtered_orders, open_orders, invoiced_orders,
  // delivered_orders, cancelled_orders, total_order_value
  const open = summary.open_orders;
  const completed = summary.invoiced_orders + summary.delivered_orders;
  const cancelled = summary.cancelled_orders;
  const barTotal = open + completed + cancelled || 1;

  const segments = [
    { cls: 'open', label: 'Open / pending', count: open },
    { cls: 'done', label: 'Completed / invoiced / delivered', count: completed },
    { cls: 'cancelled', label: 'Cancelled', count: cancelled },
  ];

  return (
    <section className="band" aria-label="Order summary">
      <p className="band-note">
        {filtered
          ? `${formatInt(summary.filtered_orders)} of ${formatInt(summary.total_orders)} orders match your search and filters`
          : 'All orders, all branches'}
      </p>
      <div className="stats">
        <div className="stat">
          <span className="stat-label">Total orders</span>
          <span className="stat-num">{formatInt(summary.total_orders)}</span>
        </div>
        {segments.map((s) => (
          <div className="stat" key={s.cls}>
            <span className="stat-label">
              <i className={`dot ${s.cls}`} aria-hidden="true" />
              {s.label}
            </span>
            <span className="stat-num">{formatInt(s.count)}</span>
            {s.cls === 'done' && (
              <span className="stat-sub">
                {formatInt(summary.invoiced_orders)} invoiced, {formatInt(summary.delivered_orders)} delivered
              </span>
            )}
          </div>
        ))}
        <div className="stat stat-value">
          <span className="stat-label">Total order value</span>
          <span className="stat-num">{formatMoney(summary.total_order_value)}</span>
        </div>
      </div>

      <div className="bar" role="img" aria-label="Share of orders by status group">
        {segments.map((s) => (
          <span
            key={s.cls}
            className={`bar-seg ${s.cls}`}
            style={{ width: `${(s.count / barTotal) * 100}%` }}
            title={`${s.label}: ${formatInt(s.count)}`}
          />
        ))}
      </div>
    </section>
  );
}
