import { AnimatePresence, motion } from 'framer-motion';

function Modal({ open, onClose, title, children, maxWidth = 'max-w-3xl' }) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={`w-full ${maxWidth} rounded-2xl border border-slate-200 bg-white shadow-2xl`}
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ duration: 0.2 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
              <h2 className="text-lg font-bold text-slate-900">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-200 px-2.5 py-1 text-sm text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>
            </div>
            <div className="max-h-[78vh] overflow-y-auto p-5">{children}</div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default Modal;
