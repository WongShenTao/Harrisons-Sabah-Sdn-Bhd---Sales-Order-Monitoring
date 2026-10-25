import { useEffect, useRef, useState } from 'react';
import { fetchOrder } from '../api.js';
import { DETAIL_FIELDS } from '../constants.js';
import { formatDate, formatDateTime, formatMoney } from '../format.js';
import StatusBadge from './StatusBadge.jsx';

function show(value, type, key) {
  if (value === null || value === undefined || value === '') return <span className="muted">-</span>;
  if (key === 'SalesStatus') return <StatusBadge status={value} />;
  if (type === 'money') return formatMoney(value);
  if (type === 'date') return formatDate(value);
  if (type === 'datetime') return formatDateTime(value);
  return String(value);
}

export default function OrderDialog({ orderId, onClose }) {
  const ref = useRef(null);
  const [state, setState] = useState({ status: 'loading', order: null, error: '' });

  // Open the native <dialog> as a modal as soon as it is on the page.
  useEffect(() => {
    const dlg = ref.current;
    if (dlg && !dlg.open) dlg.showModal();
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    setState({ status: 'loading', order: null, error: '' });
    fetchOrder(orderId, ctrl.signal)
      .then((order) => setState({ status: 'ready', order, error: '' }))
      .catch((err) => {
        if (err.name !== 'AbortError') setState({ status: 'error', order: null, error: err.message });
      });
    return () => ctrl.abort();
  }, [orderId]);

  return (
    <dialog
      ref={ref}
      className="dialog"
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current.close()}
      aria-labelledby="order-dialog-title"
    >
      <header className="dialog-head">
        <h2 id="order-dialog-title">Order {orderId}</h2>
        <button type="button" className="btn btn-quiet" onClick={() => ref.current.close()}>Close</button>
      </header>
      <div className="dialog-body">
        {state.status === 'loading' && <p className="muted">Loading order details...</p>}
        {state.status === 'error' && <p className="inline-error" role="alert">{state.error}</p>}
        {state.status === 'ready' && (
          <dl className="detail">
            {DETAIL_FIELDS.map(([key, label, type]) => (
              <div key={key} className="detail-row">
                <dt>{label}</dt>
                <dd>{show(state.order[key], type, key)}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </dialog>
  );
}
