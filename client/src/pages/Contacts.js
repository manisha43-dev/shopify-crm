import React, { useEffect, useState, useCallback } from 'react';
import { getContacts } from '../services/api';
import { useNavigate } from 'react-router-dom';

// Responsive hook 
const useWidth = () => {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return w;
};

const Badge = ({ label, color = '#2E86C1', bg = '#EBF5FB' }) => (
  <span style={{
    background: bg, color,
    padding: '2px 8px', borderRadius: 20,
    fontSize: 10, fontWeight: 700, marginRight: 4,
    whiteSpace: 'nowrap',
  }}>
    {label}
  </span>
);

const statusStyle = (s) => {
  const map = {
    customer: { color: '#1E8449', bg: '#D5F5E3' },
    lead: { color: '#D35400', bg: '#FDEBD0' },
    contact: { color: '#2E86C1', bg: '#EBF5FB' },
    churned: { color: '#7F8C8D', bg: '#F2F3F4' },
  };
  return map[s] || map.contact;
};

//  Contact Card (mobile) 
const ContactCard = ({ contact, onClick }) => {
  const ss = statusStyle(contact.status);
  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff', borderRadius: 12,
        padding: '14px 16px', marginBottom: 10,
        boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
        cursor: 'pointer', border: '1px solid #ECF0F1',
        transition: 'box-shadow 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.12)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.07)'}
    >
      {/* Row 1: Avatar + Name + Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        {/* Avatar */}
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: '#1A3C5E', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 15, fontWeight: 800, flexShrink: 0,
        }}>
          {(contact.firstName?.[0] || '?').toUpperCase()}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#1A3C5E' }}>
              {contact.firstName} {contact.lastName}
            </span>
            {contact.isVip && <span>⭐</span>}
            {contact.isAtRisk && <span>⚠️</span>}
          </div>
          <div style={{ fontSize: 12, color: '#2E86C1', marginTop: 2 }}>
            {contact.email}
          </div>
        </div>

        <Badge label={contact.status} {...ss} />
      </div>

      {/* Row 2: Stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 8, background: '#F8FBFF',
        borderRadius: 8, padding: '8px 10px',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#1A3C5E' }}>
            ₹{(contact.totalSpent || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: 10, color: '#7F8C8D' }}>LTV</div>
        </div>
        <div style={{ textAlign: 'center', borderLeft: '1px solid #ECF0F1', borderRight: '1px solid #ECF0F1' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#1A3C5E' }}>
            {contact.ordersCount || 0}
          </div>
          <div style={{ fontSize: 10, color: '#7F8C8D' }}>Orders</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#7F8C8D' }}>
            {contact.lastOrderDate
              ? new Date(contact.lastOrderDate).toLocaleDateString()
              : '—'}
          </div>
          <div style={{ fontSize: 10, color: '#7F8C8D' }}>Last Order</div>
        </div>
      </div>

      {/* Row 3: Tags */}
      {(contact.tags || []).length > 0 && (
        <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {contact.tags.slice(0, 3).map(t => <Badge key={t} label={t} />)}
        </div>
      )}
    </div>
  );
};

// Main Contacts Component
export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();
  const width = useWidth();

  const isMobile = width < 640;
  const isTablet = width >= 640 && width < 1024;
  const pad = isMobile ? 14 : 24;

  const fetchContacts = useCallback(() => {
    setLoading(true);
    getContacts({ page, limit: 20, search, status: filterStatus, tag: filterTag })
      .then(res => { setContacts(res.data.contacts); setTotal(res.data.total); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, search, filterStatus, filterTag]);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchContacts();
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div style={{ padding: pad, background: '#F4F6F7', minHeight: '100vh' }}>

      {/*  Header  */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: 18,
        flexWrap: 'wrap', gap: 10,
      }}>
        <div>
          <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: '#1A3C5E', margin: 0 }}>
            Contacts
          </h1>
          <p style={{ color: '#7F8C8D', fontSize: 13, marginTop: 4 }}>
            {total.toLocaleString()} total contacts synced from Shopify
          </p>
        </div>

        {/* Mobile filter toggle */}
        {isMobile && (
          <button
            onClick={() => setShowFilters(f => !f)}
            style={{
              padding: '8px 14px', borderRadius: 8,
              background: showFilters ? '#1A3C5E' : '#fff',
              color: showFilters ? '#fff' : '#1A3C5E',
              border: '1px solid #1A3C5E',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
            🔍 {showFilters ? 'Hide' : 'Filter'}
          </button>
        )}
      </div>

      {/*  Search & Filters  */}
      {(!isMobile || showFilters) && (
        <div style={{
          background: '#fff', borderRadius: 12,
          padding: '14px 16px', marginBottom: 16,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          display: 'flex', flexDirection: isMobile ? 'column' : 'row',
          gap: 10, flexWrap: 'wrap',
        }}>
          {/* Search */}
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, flex: isMobile ? 'unset' : 1 }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name or email..."
              style={{
                flex: 1, padding: '9px 14px',
                borderRadius: 8, border: '1px solid #D5D8DC',
                fontSize: 13, outline: 'none',
                minWidth: isMobile ? 0 : 200,
              }}
            />
            <button type="submit" style={{
              padding: '9px 16px', background: '#2E86C1',
              color: '#fff', border: 'none',
              borderRadius: 8, cursor: 'pointer',
              fontSize: 13, fontWeight: 600,
              whiteSpace: 'nowrap',
            }}>
              Search
            </button>
          </form>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
            style={{
              padding: '9px 12px', borderRadius: 8,
              border: '1px solid #D5D8DC', fontSize: 13,
              background: '#fff', cursor: 'pointer',
              minWidth: isMobile ? '100%' : 140,
            }}>
            <option value="">All Statuses</option>
            <option value="lead">Lead</option>
            <option value="contact">Contact</option>
            <option value="customer">Customer</option>
            <option value="churned">Churned</option>
          </select>

          {/* Tag filter */}
          <select
            value={filterTag}
            onChange={e => { setFilterTag(e.target.value); setPage(1); }}
            style={{
              padding: '9px 12px', borderRadius: 8,
              border: '1px solid #D5D8DC', fontSize: 13,
              background: '#fff', cursor: 'pointer',
              minWidth: isMobile ? '100%' : 140,
            }}>
            <option value="">All Tags</option>
            <option value="vip">VIP</option>
            <option value="at-risk">At Risk</option>
            <option value="repeat-buyer">Repeat Buyer</option>
            <option value="first-time-buyer">First Time Buyer</option>
            <option value="loyal">Loyal</option>
          </select>

          {/* Clear filters */}
          {(filterStatus || filterTag || search) && (
            <button
              onClick={() => { setFilterStatus(''); setFilterTag(''); setSearch(''); setPage(1); }}
              style={{
                padding: '9px 14px', borderRadius: 8,
                background: '#FDEDEC', color: '#C0392B',
                border: '1px solid #F5B7B1',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}>
              ✕ Clear
            </button>
          )}
        </div>
      )}

      {/*  Stats row  */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: isMobile ? 8 : 12, marginBottom: 16,
      }}>
        {[
          { label: 'Total', value: total, color: '#2E86C1' },
          { label: 'Customers', value: contacts.filter(c => c.status === 'customer').length, color: '#1E8449' },
          { label: 'VIP', value: contacts.filter(c => c.isVip).length, color: '#F39C12' },
          { label: 'At-Risk', value: contacts.filter(c => c.isAtRisk).length, color: '#C0392B' },
        ].map(s => (
          <div key={s.label} style={{
            background: '#fff', borderRadius: 10,
            padding: '10px 14px',
            boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
            borderLeft: `3px solid ${s.color}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: 11, color: '#7F8C8D', fontWeight: 600 }}>{s.label}</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/*  Contact List  */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#7F8C8D' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
          Loading contacts...
        </div>
      ) : contacts.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: 60,
          background: '#fff', borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
        }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>👥</div>
          <div style={{ fontSize: 15, color: '#7F8C8D' }}>No contacts found</div>
          {(filterStatus || filterTag || search) && (
            <button
              onClick={() => { setFilterStatus(''); setFilterTag(''); setSearch(''); }}
              style={{
                marginTop: 12, padding: '8px 16px',
                background: '#2E86C1', color: '#fff',
                border: 'none', borderRadius: 8,
                cursor: 'pointer', fontSize: 13,
              }}>
              Clear filters
            </button>
          )}
        </div>
      ) : isMobile ? (
        /*  Mobile: Card list  */
        <div>
          {contacts.map(c => (
            <ContactCard
              key={c._id}
              contact={c}
              onClick={() => navigate(`/contacts/${c._id}`)}
            />
          ))}
        </div>
      ) : (
        /*  Tablet/Desktop: Table  */
        <div style={{
          background: '#fff', borderRadius: 12,
          boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
          overflow: 'hidden',
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#1A3C5E', color: '#fff' }}>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600 }}>Name</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600 }}>Email</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600 }}>Status</th>
                  <th style={{ textAlign: 'right', padding: '12px 16px', fontWeight: 600 }}>LTV</th>
                  <th style={{ textAlign: 'right', padding: '12px 16px', fontWeight: 600 }}>Orders</th>
                  {!isTablet && <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600 }}>Tags</th>}
                  {!isTablet && <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600 }}>Last Order</th>}
                </tr>
              </thead>
              <tbody>
                {contacts.map((c, i) => {
                  const ss = statusStyle(c.status);
                  return (
                    <tr
                      key={c._id}
                      onClick={() => navigate(`/contacts/${c._id}`)}
                      style={{
                        background: i % 2 === 0 ? '#fff' : '#F8FBFF',
                        borderBottom: '1px solid #ECF0F1',
                        cursor: 'pointer', transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#EBF5FB'}
                      onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#F8FBFF'}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {/* Avatar */}
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: '#1A3C5E', color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 12, fontWeight: 800, flexShrink: 0,
                          }}>
                            {(c.firstName?.[0] || '?').toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#1A3C5E' }}>
                              {c.firstName} {c.lastName}
                              {c.isVip && <span style={{ marginLeft: 4 }}>⭐</span>}
                              {c.isAtRisk && <span style={{ marginLeft: 4 }}>⚠️</span>}
                            </div>
                            {isTablet && (
                              <div style={{ fontSize: 11, color: '#7F8C8D' }}>{c.phone || ''}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#2E86C1' }}>{c.email}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <Badge label={c.status} {...ss} />
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#1A3C5E' }}>
                        ₹{(c.totalSpent || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: '#7F8C8D' }}>
                        {c.ordersCount || 0}
                      </td>
                      {!isTablet && (
                        <td style={{ padding: '12px 16px' }}>
                          {(c.tags || []).slice(0, 2).map(t => <Badge key={t} label={t} />)}
                        </td>
                      )}
                      {!isTablet && (
                        <td style={{ padding: '12px 16px', color: '#7F8C8D', fontSize: 12 }}>
                          {c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString() : '—'}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/*  Pagination  */}
      {total > 20 && (
        <div style={{
          display: 'flex', justifyContent: 'center',
          alignItems: 'center', gap: 8, marginTop: 20,
          flexWrap: 'wrap',
        }}>
          <button
            onClick={() => setPage(1)}
            disabled={page === 1}
            style={{
              padding: '7px 12px', borderRadius: 8,
              border: '1px solid #D5D8DC',
              cursor: page === 1 ? 'not-allowed' : 'pointer',
              background: page === 1 ? '#F4F6F7' : '#fff',
              color: page === 1 ? '#BDC3C7' : '#1A3C5E',
              fontSize: 13, fontWeight: 600,
              display: isMobile ? 'none' : 'block',
            }}>
            « First
          </button>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: '7px 14px', borderRadius: 8,
              border: '1px solid #D5D8DC',
              cursor: page === 1 ? 'not-allowed' : 'pointer',
              background: page === 1 ? '#F4F6F7' : '#fff',
              color: page === 1 ? '#BDC3C7' : '#1A3C5E',
              fontSize: 13, fontWeight: 600,
            }}>
            ← Prev
          </button>

          {/* Page numbers */}
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
            return (
              <button key={p} onClick={() => setPage(p)}
                style={{
                  padding: '7px 12px', borderRadius: 8, fontSize: 13,
                  fontWeight: page === p ? 800 : 500,
                  border: page === p ? '2px solid #2E86C1' : '1px solid #D5D8DC',
                  background: page === p ? '#EBF5FB' : '#fff',
                  color: page === p ? '#2E86C1' : '#7F8C8D',
                  cursor: 'pointer', minWidth: 36,
                }}>
                {p}
              </button>
            );
          })}

          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            style={{
              padding: '7px 14px', borderRadius: 8,
              border: '1px solid #D5D8DC',
              cursor: page >= totalPages ? 'not-allowed' : 'pointer',
              background: page >= totalPages ? '#F4F6F7' : '#fff',
              color: page >= totalPages ? '#BDC3C7' : '#1A3C5E',
              fontSize: 13, fontWeight: 600,
            }}>
            Next →
          </button>
          <button
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages}
            style={{
              padding: '7px 12px', borderRadius: 8,
              border: '1px solid #D5D8DC',
              cursor: page === totalPages ? 'not-allowed' : 'pointer',
              background: page === totalPages ? '#F4F6F7' : '#fff',
              color: page === totalPages ? '#BDC3C7' : '#1A3C5E',
              fontSize: 13, fontWeight: 600,
              display: isMobile ? 'none' : 'block',
            }}>
            Last »
          </button>
        </div>
      )}
    </div>
  );
}