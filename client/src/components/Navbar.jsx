import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import logo from '../assets/logo.svg';
import { useAuth } from '../context/AuthContext';

function NavLink({ to, children }) {
  return (
    <Link to={to} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
      {children}
    </Link>
  );
}

function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Mini Wiki" className="h-9 w-9" />
          <span className="text-lg font-bold tracking-tight text-slate-900">Mini Wiki</span>
        </Link>

        <div className="flex items-center gap-1">
          <NavLink to="/discover">Discover</NavLink>
          <NavLink to="/categories">Categories</NavLink>
          <NavLink to="/lore">Lore</NavLink>
          <NavLink to="/graph">Graph</NavLink>

          {isAuthenticated ? (
            <>
              <NavLink to="/profile">@{user.username}</NavLink>
              <NavLink to="/pages/new">Create</NavLink>
              <motion.button
                whileHover={{ y: -1 }}
                type="button"
                onClick={logout}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Logout
              </motion.button>
            </>
          ) : (
            <>
              <NavLink to="/login">Login</NavLink>
              <Link
                to="/register"
                className="rounded-lg bg-[var(--accent-color)] px-3 py-2 text-sm font-semibold text-white transition hover:brightness-95"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
