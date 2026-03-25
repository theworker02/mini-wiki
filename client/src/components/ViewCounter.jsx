function ViewCounter({ views }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700">
      👁️ {views}
    </span>
  );
}

export default ViewCounter;
