import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import Contacts from './pages/Contacts';
import Orders from './pages/Orders';
import Pipeline from './pages/Pipeline';
import AbandonedCarts from './pages/AbandonedCarts';
import Campaigns from './pages/Campaigns';
import ShopifySettings from './pages/ShopifySettings';

const navItems = [
  { path: '/',                      label: 'Dashboard',           icon: '\uD83D\uDCCA' },
  { path: '/contacts',              label: 'Contacts',            icon: '\uD83D\uDC65' },
  { path: '/orders',                label: 'Orders',              icon: '\uD83D\uDCE6' },
  { path: '/pipeline',              label: 'Pipeline',            icon: '\uD83C\uDFC6' },
  { path: '/carts',                 label: 'Abandoned Carts',     icon: '\uD83D\uDED2' },
  { path: '/campaigns',             label: 'Campaigns',           icon: '\uD83D\uDCE3' },
  { path: '/settings/integrations', label: 'Shopify Integration', icon: '\uD83D\uDD17' },
];

const Sidebar = ({ open, onClose }) => {
  const { user, logout } = useAuth();
  return (
    <>
      {open && (
        <div onClick={onClose} style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.45)', zIndex: 100,
          display: window.innerWidth >= 768 ? 'none' : 'block',
        }} />
      )}
      <div style={{
        width: 220, minHeight: '100vh', background: '#1A3C5E',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        position: window.innerWidth < 768 ? 'fixed' : 'relative',
        top: 0, left: 0, zIndex: 200,
        transform: window.innerWidth < 768
          ? (open ? 'translateX(0)' : 'translateX(-100%)')
          : 'translateX(0)',
        transition: 'transform 0.25s ease',
        boxShadow: window.innerWidth < 768 && open ? '4px 0 20px rgba(0,0,0,0.3)' : 'none',
      }}>
        <div style={{
          padding: '20px 16px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#fff' }}>HelloGrowth</div>
            <div style={{ fontSize: 11, color: '#AED6F1', marginTop: 2 }}>CRM x Shopify</div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 6,
            color: '#fff', fontSize: 18, width: 30, height: 30, cursor: 'pointer',
            display: window.innerWidth >= 768 ? 'none' : 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>X</button>
        </div>

        <nav style={{ flex: 1, padding: '10px 0', overflowY: 'auto' }}>
          {navItems.map(item => (
            <NavLink key={item.path} to={item.path} end={item.path === '/'}
              onClick={() => window.innerWidth < 768 && onClose()}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 16px', textDecoration: 'none',
                fontSize: 13, fontWeight: 500,
                color: isActive ? '#fff' : '#AED6F1',
                background: isActive ? 'rgba(46,134,193,0.35)' : 'transparent',
                borderLeft: isActive ? '3px solid #2E86C1' : '3px solid transparent',
                transition: 'all 0.15s',
              })}>
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: 13, color: '#AED6F1', marginBottom: 8 }}>
            <div style={{ fontWeight: 600 }}>{user?.name}</div>
            <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>{user?.role}</div>
          </div>
          <button onClick={logout} style={{
            fontSize: 12, color: '#AED6F1',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 6, padding: '7px 12px',
            cursor: 'pointer', width: '100%',
          }}>
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
};

const Login = () => {
  const { login } = useAuth();
  const [email, setEmail]       = useState('admin@hellogrowthcrm.com');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
    } catch {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#1A3C5E',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: 36,
        width: '100%', maxWidth: 380,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1A3C5E', marginBottom: 4 }}>
          HelloGrowthCRM
        </h1>
        <p style={{ color: '#7F8C8D', marginBottom: 28, fontSize: 14 }}>
          Shopify Integration Dashboard
        </p>
        {error && (
          <div style={{
            background: '#FDEDEC', color: '#C0392B',
            padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 14,
          }}>{error}</div>
        )}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#2C3E50', marginBottom: 6 }}>
              Email
            </label>
            <input value={email} onChange={e => setEmail(e.target.value)}
              type="email" required style={{
                width: '100%', padding: '11px 14px', borderRadius: 8,
                border: '1px solid #BDC3C7', fontSize: 14, boxSizing: 'border-box',
              }} />
          </div>
          <div style={{ marginBottom: 22 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#2C3E50', marginBottom: 6 }}>
              Password
            </label>
            <input value={password} onChange={e => setPassword(e.target.value)}
              type="password" required style={{
                width: '100%', padding: '11px 14px', borderRadius: 8,
                border: '1px solid #BDC3C7', fontSize: 14, boxSizing: 'border-box',
              }} />
          </div>
          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '13px',
            background: loading ? '#7F8C8D' : '#1A3C5E',
            color: '#fff', border: 'none', borderRadius: 8,
            fontSize: 15, fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

const ProtectedLayout = () => {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [winWidth, setWinWidth] = useState(window.innerWidth);

  React.useEffect(() => {
    const fn = () => setWinWidth(window.innerWidth);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#7F8C8D' }}>
      Loading...
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;

  const isMobile = winWidth < 768;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F4F6F7' }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {isMobile && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: '#1A3C5E', padding: '11px 16px',
            position: 'sticky', top: 0, zIndex: 99,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}>
            <button onClick={() => setSidebarOpen(true)} style={{
              background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 8,
              color: '#fff', fontSize: 20, width: 38, height: 38, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              &#9776;
            </button>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>HelloGrowthCRM</div>
            <div style={{ width: 38 }} />
          </div>
        )}
        <main style={{ flex: 1, overflow: 'auto' }}>
          <Routes>
            <Route path="/"                       element={<Dashboard />} />
            <Route path="/contacts"               element={<Contacts />} />
            <Route path="/orders"                 element={<Orders />} />
            <Route path="/pipeline"               element={<Pipeline />} />
            <Route path="/carts"                  element={<AbandonedCarts />} />
            <Route path="/campaigns"              element={<Campaigns />} />
            <Route path="/settings/integrations"  element={<ShopifySettings />} />
            <Route path="*" element={
              <div style={{ padding: 40, textAlign: 'center', color: '#7F8C8D' }}>
                <h2 style={{ color: '#1A3C5E' }}>Coming Soon</h2>
                <p>This section is under development.</p>
              </div>
            } />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginGuard />} />
          <Route path="/*"     element={<ProtectedLayout />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

const LoginGuard = () => {
  const { user } = useAuth();
  if (user) return <Navigate to="/" replace />;
  return <Login />;
};