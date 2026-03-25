import { motion } from 'framer-motion';

function AuthForm({ type, onSubmit, submitting, error }) {
  const isLogin = type === 'login';

  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    onSubmit({
      username: String(formData.get('username') || ''),
      password: String(formData.get('password') || '')
    });
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <h2 className="text-2xl font-bold text-slate-900">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
      <p className="mt-1 text-sm text-slate-500">
        {isLogin
          ? 'Log in to access your private workspace, likes, and profile settings.'
          : 'Join the platform to create pages and build your knowledge graph.'}
      </p>

      <div className="mt-4 space-y-3">
        <div>
          <label htmlFor="username" className="mb-1 block text-sm font-semibold text-slate-700">
            Username
          </label>
          <input
            id="username"
            name="username"
            minLength={3}
            required
            className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-[var(--accent-color)] focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-semibold text-slate-700">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            minLength={6}
            required
            className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-[var(--accent-color)] focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <motion.button
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
        type="submit"
        disabled={submitting}
        className="mt-4 w-full rounded-lg bg-[var(--accent-color)] px-4 py-2 font-semibold text-white transition disabled:opacity-60"
      >
        {submitting ? 'Please wait...' : isLogin ? 'Login' : 'Register'}
      </motion.button>
    </motion.form>
  );
}

export default AuthForm;
