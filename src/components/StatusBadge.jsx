import { STATUS_CLASS } from '../constants.js';

export default function StatusBadge({ status }) {
  if (!status) return <span className="muted">-</span>;
  return <span className={`badge ${STATUS_CLASS[status] ?? 'other'}`}>{status}</span>;
}
