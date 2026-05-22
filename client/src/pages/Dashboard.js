import React, { useEffect, useState } from 'react';
import { getDashboard } from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';

const useWidth = () => {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return w;
};

const StatCard = ({ label, value, color, icon, sub }) => (
  <div style={{
    background: '#fff',
    borderRadius: 12,
    padding: '14px 16px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
    borderTop: `3px solid ${color}`,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 11, color: '#7F8C8D', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </span>
      <span style={{ fontSize: 20 }}>{icon}</span>
    </div>
    <div style={{ fontSize: 26, fontWeight: 800, color: '#1A3C5E', lineHeight: 1 }}>
      {value}
    </div>
    {sub && (
      <div style={{ fontSize: 11, color: '#95A5A6' }}>{sub}</div>
    )}
  </div>
);

export default function Dashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const width = useWidth();

  const isMobile  = width < 640;
  const isTablet  = width >= 640 && width < 1024;
  const isDesktop = width >= 1024;

  useEffect(() => {
    getDashboard()
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{
      display: 'flex', justifyContent: 'center',
      alignItems: 'center', height: '60vh',
      flexDirection: 'column', gap: 12,
    }}>
      <div style={{ fontSize: 32 }}>⏳</div>
      <div style={{ fontSize: 15, color: '#7F8C8D' }}>Loading dashboard...</div>
    </div>
  );

  const { stats = {}, recentOrders = [], dealsByStage = [] } = data || {};

  const fmt = (n) => {
    if (typeof n !== 'number') return '₹0';
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    if (n >= 1000)   return `₹${(n / 1000).toFixed(1)}k`;
    return `₹${n.toFixed(0)}`;
  };

  const cards = [
    { label: 'Total Contacts',  value: stats.totalContacts || 0,         color: '#2E86C1', icon: '👥' },
    { label: 'Revenue',         value: fmt(stats.totalRevenue),           color: '#1E8449', icon: '💰', sub: 'From paid orders' },
    { label: 'Orders',          value: stats.totalOrders || 0,            color: '#8E44AD', icon: '📦' },
    { label: 'Abandoned Carts', value: stats.abandonedCartsOpen || 0,     color: '#E67E22', icon: '🛒', sub: 'Open / unrecovered' },
    { label: 'VIP Customers',   value: stats.vipContacts || 0,            color: '#F39C12', icon: '⭐', sub: 'LTV > ₹50,000' },
    { label: 'At-Risk',         value: stats.atRiskContacts || 0,         color: '#C0392B', icon: '⚠️', sub: 'Need attention' },
    { label: 'New This Month',  value: stats.newContactsThisMonth || 0,   color: '#16A085', icon: '✨' },
    { label: 'New This Month',  value: stats.newContactsThisMonth || 0,   color: '#16A085', icon: '✨' },
  ];

  // Remove duplicate last card
  const statCards = cards.slice(0, 7);

  const chartData = dealsByStage.map(d => ({
    stage: d._id.charAt(0).toUpperCase() + d._id.slice(1),
    Deals: d.count,
    '₹k':  Math.round((d.value || 0) / 1000),
  }));

  const pad = isMobile ? 14 : 24;

  return (
    <div style={{ padding: pad, background: '#F4F6F7', minHeight: '100vh' }}>

      {/*  Header  */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: isMobile ? 20 : 26, fontWeight: 800, color: '#1A3C5E', margin: 0 }}>
          Dashboard
        </h1>
        <p style={{ color: '#7F8C8D', fontSize: 13, marginTop: 4 }}>
          Shopify × HelloGrowthCRM — Live Overview
        </p>
      </div>

      {/*  Stat Cards  */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile
          ? 'repeat(2, 1fr)'
          : isTablet
          ? 'repeat(3, 1fr)'
          : 'repeat(4, 1fr)',
        gap: isMobile ? 10 : 14,
        marginBottom: isMobile ? 16 : 24,
      }}>
        {statCards.map((c, i) => <StatCard key={i} {...c} />)}
      </div>

      {/*  Charts + Table  */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr',
        gap: isMobile ? 14 : 20,
        marginBottom: 20,
      }}>

        {/* Pipeline Chart */}
        <div style={{
          background: '#fff', borderRadius: 12,
          padding: isMobile ? 14 : 20,
          boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 18 }}>📊</span>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1A3C5E', margin: 0 }}>
              Pipeline by Stage
            </h3>
          </div>
          {chartData.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#BDC3C7', padding: '40px 0', fontSize: 13 }}>
              No pipeline data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={isMobile ? 160 : 210}>
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                <XAxis dataKey="stage" tick={{ fontSize: isMobile ? 9 : 11 }} />
                <YAxis tick={{ fontSize: isMobile ? 9 : 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 12 }} />
                <Bar dataKey="Deals" fill="#2E86C1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="₹k"    fill="#1E8449" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent Orders */}
        <div style={{
          background: '#fff', borderRadius: 12,
          padding: isMobile ? 14 : 20,
          boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
          overflowX: 'auto',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 18 }}>📋</span>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1A3C5E', margin: 0 }}>
              Recent Orders
            </h3>
          </div>

          {recentOrders.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#BDC3C7', padding: '40px 0', fontSize: 13 }}>
              No orders yet
            </div>
          ) : isMobile ? (
            /* Mobile: Card list */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentOrders.map(order => (
                <div key={order._id} style={{
                  background: '#F8FBFF', borderRadius: 8,
                  padding: '10px 12px',
                  border: '1px solid #EBF5FB',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#2E86C1' }}>
                      #{order.shopifyOrderNumber}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#1A3C5E' }}>
                      ₹{(order.totalPrice || 0).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: '#7F8C8D' }}>
                      {order.contactId
                        ? `${order.contactId.firstName} ${order.contactId.lastName}`
                        : order.customerEmail || '—'}
                    </span>
                    <span style={{
                      background: order.financialStatus === 'paid' ? '#D5F5E3' : '#FDEDEC',
                      color:      order.financialStatus === 'paid' ? '#1E8449' : '#C0392B',
                      padding: '2px 8px', borderRadius: 20,
                      fontSize: 10, fontWeight: 700,
                    }}>
                      {order.financialStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Desktop/Tablet: Table */
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #EBF5FB' }}>
                  {['Customer', 'Order #', 'Amount', 'Status'].map(h => (
                    <th key={h} style={{
                      textAlign: h === 'Amount' ? 'right' : 'left',
                      padding: '7px 10px', color: '#7F8C8D',
                      fontWeight: 600, fontSize: 12,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order, i) => (
                  <tr key={order._id} style={{
                    background: i % 2 === 0 ? '#fff' : '#F8FBFF',
                    borderBottom: '1px solid #ECF0F1',
                  }}>
                    <td style={{ padding: '9px 10px' }}>
                      {order.contactId
                        ? `${order.contactId.firstName} ${order.contactId.lastName}`
                        : order.customerEmail || '—'}
                    </td>
                    <td style={{ padding: '9px 10px', color: '#2E86C1', fontWeight: 600 }}>
                      #{order.shopifyOrderNumber}
                    </td>
                    <td style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 700 }}>
                      ₹{(order.totalPrice || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '9px 10px' }}>
                      <span style={{
                        background: order.financialStatus === 'paid' ? '#D5F5E3' : '#FDEDEC',
                        color:      order.financialStatus === 'paid' ? '#1E8449' : '#C0392B',
                        padding: '3px 10px', borderRadius: 20,
                        fontSize: 11, fontWeight: 700,
                      }}>
                        {order.financialStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/*  Footer  */}
      <div style={{
        background: '#EBF5FB', borderRadius: 8,
        padding: '10px 16px', fontSize: 12,
        color: '#2E86C1', textAlign: 'center',
      }}>
        💡 Synced from: hellogrowthtest.myshopify.com
      </div>

    </div>
  );
}