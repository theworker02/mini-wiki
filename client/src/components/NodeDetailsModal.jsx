import { Link } from 'react-router-dom';
import Modal from './Modal';

function NodeDetailsModal({ node, open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="Node Details" maxWidth="max-w-xl">
      {node ? (
        <div className="space-y-3">
          <h3 className="text-xl font-bold text-slate-900">{node.title}</h3>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{node.category || 'General'}</p>
          <p className="text-sm text-slate-600">{node.summary}</p>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
            <p>Views: {node.views}</p>
            <p>Likes: {node.likes}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={`/pages/${node.id}`}
              className="inline-block rounded-lg bg-[var(--accent-color)] px-3 py-1.5 text-sm font-semibold text-white"
            >
              Open Article
            </Link>
            <Link
              to={`/pages/${node.id}/edit`}
              className="inline-block rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700"
            >
              Edit Link Network
            </Link>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

export default NodeDetailsModal;
