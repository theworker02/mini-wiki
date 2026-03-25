import { motion } from 'framer-motion';

function LikeButton({ likes, onLike, disabled = false }) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.95 }}
      type="button"
      onClick={onLike}
      disabled={disabled}
      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
    >
      <span>👍</span>
      <span>{likes}</span>
    </motion.button>
  );
}

export default LikeButton;
