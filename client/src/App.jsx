import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import AdvancedSearch from './components/AdvancedSearch';
import Sidebar from './components/Sidebar';
import LoreSidebar from './components/LoreSidebar';
import Home from './pages/Home';
import Edit from './pages/Edit';
import View from './pages/View';
import Login from './pages/Login';
import Register from './pages/Register';
import LorePage from './pages/LorePage';
import Profile from './pages/Profile';
import GraphPage from './pages/GraphPage';
import DiscoverPage from './pages/discover';
import CategoriesPage from './pages/categories';
import PublicProfilePage from './pages/profile/[username]';
import { getPages } from './utils/api';
import { useAuth } from './context/AuthContext';

function ProtectedRoute({ children }) {
  const { isAuthenticated, initializing } = useAuth();

  if (initializing) {
    return <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">Loading session...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { initializing, user } = useAuth();
  const hideSidebar = location.pathname === '/login' || location.pathname === '/register';

  const [allPages, setAllPages] = useState([]);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const loadAllPages = async () => {
    try {
      const data = await getPages('');
      setAllPages(data);
    } catch {
      setAllPages([]);
    }
  };

  const loadPages = async (searchTerm = '') => {
    setLoading(true);
    try {
      const data = await getPages(searchTerm);
      setPages(data);
    } catch {
      setPages([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async (searchTerm = search) => {
    await Promise.all([loadPages(searchTerm), loadAllPages()]);
  };

  useEffect(() => {
    if (!initializing) {
      loadAllPages();
    }
  }, [initializing, user?.id]);

  useEffect(() => {
    if (!initializing) {
      loadPages(search);
    }
  }, [initializing, search, user?.id]);

  return (
    <div className="min-h-screen text-slate-900">
      <Navbar />

      <main className={`mx-auto flex max-w-7xl flex-col gap-4 p-4 md:p-6 ${hideSidebar ? '' : 'lg:flex-row'}`}>
        {!hideSidebar ? (
          <aside className="w-full lg:w-80">
            <AdvancedSearch
              value={search}
              onChange={setSearch}
              articles={allPages}
              onSelect={(article) => navigate(`/pages/${article.id}`)}
            />
            <Sidebar pages={pages} loading={loading} />
            <LoreSidebar />
          </aside>
        ) : null}

        <section className={`w-full ${hideSidebar ? 'mx-auto max-w-md' : 'flex-1'}`}>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Home pages={pages} />} />
              <Route path="/pages/:id" element={<View onUpdated={() => refreshData(search)} />} />
              <Route
                path="/pages/new"
                element={
                  <ProtectedRoute>
                    <Edit isNew onSaved={() => refreshData(search)} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pages/:id/edit"
                element={
                  <ProtectedRoute>
                    <Edit onSaved={() => refreshData(search)} />
                  </ProtectedRoute>
                }
              />
              <Route path="/lore" element={<LorePage />} />
              <Route path="/graph" element={<GraphPage />} />
              <Route path="/discover" element={<DiscoverPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route path="/profile/:username" element={<PublicProfilePage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </section>
      </main>
    </div>
  );
}

export default App;
