import { COLUMNS } from '../constants.js';
import { formatDate, formatMoney } from '../format.js';
import StatusBadge from './StatusBadge.jsx';

const SORTABLE = COLUMNS.filter((c) => c.sortable);

export default function OrdersTable({ orders, busy, sort, order, onSort, onPickSort, onSelect }) {
  return (
    <>
      {/* Phones hide the table header, so sorting gets its own control there. */}
      <div className="sort-mobile">
        <label className="field-inline">
          <span>Sort by</span>
          <select value={sort} onChange={(e) => onPickSort(e.target.value)}>
            {SORTABLE.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
        </label>
        <button type="button" className="btn" onClick={() => onSort(sort)}>
          {order === 'asc' ? 'Ascending' : 'Descending'}
        </button>
      </div>

      <div className={`table-wrap${busy ? ' is-busy' : ''}`} aria-busy={busy}>
        <table className="orders">
          <thead>
            <tr>
              {COLUMNS.map((c) => {
                const active = c.sortable && sort === c.key;
                return (
                  <th
                    key={c.key}
                    scope="col"
                    className={c.numeric ? 'num' : undefined}
                    aria-sort={active ? (order === 'asc' ? 'ascending' : 'descending') : undefined}
                  >
                    {c.sortable ? (
                      <button type="button" className={`th-sort${active ? ' is-active' : ''}`} onClick={() => onSort(c.key)}>
                        {c.label}
                        <span aria-hidden="true" className="th-arrow">
                          {active ? (order === 'asc' ? '▲' : '▼') : '↕'}
                        </span>
                      </button>
                    ) : (
                      c.label
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.SalesId}>
                <td data-label="Order no.">
                  <button type="button" className="link" onClick={() => onSelect(o.SalesId)}>
                    {o.SalesId}
                  </button>
                </td>
                <td data-label="Customer">{o.SalesName || '-'}</td>
                <td data-label="Branch">{o.InventSiteId || '-'}</td>
                <td data-label="Order date">{formatDate(o.CreatedDateTime1)}</td>
                <td data-label="Status"><StatusBadge status={o.SalesStatus} /></td>
                <td data-label="Amount" className="num">{formatMoney(o.HAR_TotalSOAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
