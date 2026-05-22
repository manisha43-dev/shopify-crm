import React, {  useEffect, useState } from 'react';
import { getStores, getSyncStatus, resync, disconnectStore, getWebhookLog } from '../services/api';

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

// Status dot 
const statusCfg = {
  done: { color: '#1E8449', bg: '#D5F5E3', icon: '✅', label: 'Synced' },
  running: { color: '#F39C12', bg: '#FDEBD0', icon: '⏳', label: 'Syncing...' },
  error: { color: '#C0392B', bg: '#FDEDEC', icon: '❌', label: 'Error' },
  idle: { color: '#7F8C8D', bg: '#F2F3F4', icon: '⚪', label: 'Idle' },
};

const StatusDot = ({ status }) => {
  const cfg = statusCfg[status] || statusCfg.idle;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 12, color: cfg.color, fontWeight: 600,
    }}>
      <span style={{
        width: 8, height: 8, borderRadius: '50%',
        background: cfg.color, display: 'inline-block',
        boxShadow: status === 'running' ? `0 0 6px ${cfg.color}` : 'none',
      }} />
      {cfg.label}
    </span>
  );
};

//  Entity sync card 
const entityIcons = {
  customers: '👥',
  orders: '📦',
  products: '🏷️',
  carts: '🛒',
};

const SyncCard = ({ entity, status, onResync, isMobile }) => {
  const cfg = statusCfg[status] || statusCfg.idle;
  return (
    <div style={{
      background: cfg.bg, borderRadius: 10,
      padding: isMobile ? '12px 14px' : '14px 16px',
      border: `1px solid ${cfg.color}22`,
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 18 }}>{entityIcons[entity]}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#1A3C5E', textTransform: 'capitalize' }}>
            {entity}
          </span>
        </div>
        <StatusDot status={status} />
      </div>
      <button
        onClick={onResync}
        style={{
          fontSize: 11, padding: '6px 10px',
          background: '#fff', color: '#2E86C1',
          border: '1px solid #AED6F1', borderRadius: 6,
          cursor: 'pointer', fontWeight: 700,
          width: '100%', transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#EBF5FB'}
        onMouseLeave={e => e.currentTarget.style.background = '#fff'}
      >
        🔄 Force Re-sync
      </button>
    </div>
  );
};

//  Webhook event row / card 
const topicColors = {
  'orders/create': '#1E8449',
  'orders/paid': '#1E8449',
  'customers/create': '#2E86C1',
  'customers/update': '#2E86C1',
  'refunds/create': '#C0392B',
  'checkouts/create': '#E67E22',
  'checkouts/update': '#E67E22',
  'app/uninstalled': '#C0392B',
};

const WebhookCard = ({ event, isMobile }) => {
  const topicColor = topicColors[event.topic] || '#7F8C8D';


  if (isMobile) {
    return (
      <div style={{
        background: '#fff', borderRadius: 10,
        padding: '12px 14px', marginBottom: 8,
        border: '1px solid #ECF0F1',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{
            fontFamily: 'monospace', fontSize: 12,
            fontWeight: 700, color: topicColor,
            background: `${topicColor}15`,
            padding: '2px 8px', borderRadius: 6,
          }}>
            {event.topic}
          </span>
          <StatusDot status={event.status === 'processed' ? 'done' : event.status === 'failed' ? 'error' : 'running'} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#7F8C8D' }}>
          <span>{event.shopDomain}</span>
          <span>{new Date(event.createdAt).toLocaleDateString()}</span>
        </div>
        {event.attempts > 1 && (
          <div style={{ fontSize: 10, color: '#E67E22', marginTop: 4 }}>
            ⚠️ {event.attempts} attempt(s)
          </div>
        )}
      </div>
    );
  }

  return null;
};

//  Main ShopifySettings 
export default function ShopifySettings() {
  const [stores, setStores] = useState([]);
  const [syncStatuses, setSyncStatuses] = useState({});
  const [webhookLog, setWebhookLog] = useState([]);
  const [shopInput, setShopInput] = useState('');
  const [activeTab, setActiveTab] = useState('stores');
  const [connecting, setConnecting] = useState(false);
  const [loading, setLoading] = useState(true);
  const width = useWidth();

  const isMobile = width < 640;
  const isTablet = width >= 640 && width < 1024;
  const pad = isMobile ? 14 : 24;


 useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const status = params.get('status');
  const connectedShop = params.get('shop');

  if (status === 'connected' && connectedShop) {
    window.history.replaceState({}, '', window.location.pathname);
  }

  if (status === 'error') {
    window.history.replaceState({}, '', window.location.pathname);
    alert('Shopify connection failed. Please try again.');
  }

  loadStores();
  getWebhookLog().then(r => setWebhookLog(r.data.events)).catch(() => {});
}, []);

  const loadStores = async () => {
    setLoading(true);
    const res = await getStores().catch(() => ({ data: { stores: [] } }));
    setStores(res.data.stores);
    for (const store of res.data.stores) {
      const s = await getSyncStatus(store.shopDomain).catch(() => null);
      if (s) setSyncStatuses(p => ({ ...p, [store.shopDomain]: s.data.syncStatus }));
    }
    setLoading(false);
  };

const handleConnect = () => {
  if (!shopInput.trim()) return alert('Enter your Shopify store domain');
  const shop = shopInput.includes('.myshopify.com')
    ? shopInput.trim()
    : `${shopInput.trim()}.myshopify.com`;
  
  setConnecting(true);
  // Small delay so React renders "Connecting..." before navigation
  setTimeout(() => {
    window.location.href = `${process.env.REACT_APP_API_URL}/api/shopify/install?shop=${shop}`;
  }, 100);
};


  const handleResync = async (shop, entity) => {
    await resync(shop, entity);
    setSyncStatuses(p => ({ ...p, [shop]: { ...p[shop], [entity]: 'running' } }));
    setTimeout(() => loadStores(), 3000);
  };

  const handleDisconnect = async (shop) => {
    if (!window.confirm(`Disconnect ${shop}?\n\nSynced data will be preserved in CRM.`)) return;
    await disconnectStore(shop);
    loadStores();
  };

  const Tab = ({ id, label, icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      style={{
        padding: isMobile ? '9px 14px' : '10px 20px',
        border: 'none', cursor: 'pointer',
        fontSize: isMobile ? 13 : 14, fontWeight: 700,
        background: activeTab === id ? '#1A3C5E' : '#fff',
        color: activeTab === id ? '#fff' : '#7F8C8D',
        borderRadius: 8,
        transition: 'all 0.15s',
        flex: isMobile ? 1 : 'unset',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      }}>
      {icon} {label}
    </button>
  );

  return (
    <div style={{ padding: pad, background: '#F4F6F7', minHeight: '100vh' }}>

      {/*  Header  */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: '#1A3C5E', margin: 0 }}>
          Shopify Integration
        </h1>
        <p style={{ color: '#7F8C8D', fontSize: 13, marginTop: 4 }}>
          Connect your Shopify store to sync customers, orders, and more.
        </p>
      </div>

      {/*  Connect Form  */}
      <div style={{
        background: '#fff', borderRadius: 12,
        padding: isMobile ? 16 : 24,
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        marginBottom: 20,
        border: '1px solid #EBF5FB',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: 24 }}>🔗</span>
          <h3 style={{ color: '#1A3C5E', fontSize: 15, fontWeight: 800, margin: 0 }}>
            Connect a Shopify Store
          </h3>
        </div>

        <div style={{
          display: 'flex', gap: 10,
          flexDirection: isMobile ? 'column' : 'row',
        }}>
          <input
            value={shopInput}
            onChange={e => setShopInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleConnect()}
            placeholder="yourstore.myshopify.com"
            style={{
              flex: 1, padding: '11px 14px',
              borderRadius: 8, border: '1px solid #D5D8DC',
              fontSize: 14, outline: 'none',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => e.target.style.borderColor = '#2E86C1'}
            onBlur={e => e.target.style.borderColor = '#D5D8DC'}
          />
          <button
            onClick={handleConnect}
            disabled={connecting}
            style={{
              padding: '11px 24px',
              background: connecting ? '#7F8C8D' : '#1A3C5E',
              color: '#fff', border: 'none',
              borderRadius: 8, cursor: connecting ? 'not-allowed' : 'pointer',
              fontSize: 14, fontWeight: 700,
              whiteSpace: 'nowrap',
              transition: 'background 0.15s',
            }}>
            {connecting ? '⏳ Connecting...' : '🔗 Connect Store'}
          </button>
        </div>

        <p style={{ fontSize: 12, color: '#95A5A6', marginTop: 10, lineHeight: 1.5 }}>
          You'll be redirected to Shopify to authorize. Required scopes: read_customers, read_orders, read_products, read_checkouts.
        </p>
      </div>

      {/*  Tabs  */}
      <div style={{
        display: 'flex', gap: isMobile ? 6 : 8,
        marginBottom: 16,
        background: '#fff', padding: 6,
        borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <Tab id="stores" label="Connected Stores" icon="🏪" />
        <Tab id="webhooks" label="Webhook Event Log" icon="📡" />
      </div>

      {/*  Connected Stores Tab  */}
      {activeTab === 'stores' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#7F8C8D' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div>
              Loading stores...
            </div>
          ) : stores.length === 0 ? (
            <div style={{
              background: '#fff', borderRadius: 12,
              padding: 50, textAlign: 'center',
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🏪</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1A3C5E', marginBottom: 6 }}>
                No stores connected yet
              </div>
              <div style={{ fontSize: 13, color: '#7F8C8D' }}>
                Enter your store domain above and click Connect Store
              </div>
            </div>
          ) : (
            stores.map(store => {
              const ss = syncStatuses[store.shopDomain] || {};
              const isConnected = store.isActive;
              return (
                <div key={store._id} style={{
                  background: '#fff', borderRadius: 12,
                  padding: isMobile ? 16 : 24,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                  border: `1px solid ${isConnected ? '#D5F5E3' : '#FDEDEC'}`,
                }}>
                  {/* Store header */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'flex-start', marginBottom: 16,
                    flexWrap: 'wrap', gap: 10,
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 20 }}>🏪</span>
                        <h3 style={{ fontSize: isMobile ? 14 : 16, fontWeight: 800, color: '#1A3C5E', margin: 0 }}>
                          {store.shopDomain}
                        </h3>
                        <span style={{
                          background: isConnected ? '#D5F5E3' : '#FDEDEC',
                          color: isConnected ? '#1E8449' : '#C0392B',
                          padding: '3px 10px', borderRadius: 20,
                          fontSize: 11, fontWeight: 700,
                        }}>
                          {isConnected ? '● Connected' : '● Disconnected'}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: '#7F8C8D', marginTop: 6 }}>
                        Connected: {store.createdAt ? new Date(store.createdAt).toLocaleDateString() : '—'}
                        {store.lastSyncAt && (
                          <span> · Last sync: {new Date(store.lastSyncAt).toLocaleString()}</span>
                        )}
                      </div>
                      {store.errorCount > 0 && (
                        <div style={{ fontSize: 12, color: '#C0392B', marginTop: 4 }}>
                          {store.errorCount} sync error(s) — check logs
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleDisconnect(store.shopDomain)}
                      style={{
                        padding: '8px 16px',
                        background: '#FDEDEC', color: '#C0392B',
                        border: '1px solid #F5B7B1', borderRadius: 8,
                        cursor: 'pointer', fontSize: 12, fontWeight: 700,
                        whiteSpace: 'nowrap',
                      }}>
                      🔌 Disconnect
                    </button>
                  </div>

                  {/* Scopes */}
                  {store.scopes?.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#7F8C8D', marginBottom: 6 }}>
                        APPROVED SCOPES
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {store.scopes.map(scope => (
                          <span key={scope} style={{
                            background: '#EBF5FB', color: '#2E86C1',
                            padding: '2px 8px', borderRadius: 6,
                            fontSize: 11, fontWeight: 600,
                            fontFamily: 'monospace',
                          }}>
                            {scope}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sync status grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
                    gap: isMobile ? 8 : 12,
                  }}>
                    {['customers', 'orders', 'products', 'carts'].map(entity => (
                      <SyncCard
                        key={entity}
                        entity={entity}
                        status={ss[entity] || 'idle'}
                        onResync={() => handleResync(store.shopDomain, entity)}
                        isMobile={isMobile}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/*  Webhook Log Tab  */}
      {activeTab === 'webhooks' && (
        <div>
          {webhookLog.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: 60,
              background: '#fff', borderRadius: 12,
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>📡</div>
              <div style={{ fontSize: 14, color: '#7F8C8D' }}>No webhook events yet</div>
            </div>
          ) : isMobile ? (
            /* Mobile: webhook cards */
            <div>
              {webhookLog.map(ev => (
                <WebhookCard key={ev._id} event={ev} isMobile={true} />
              ))}
            </div>
          ) : (
            /* Desktop/Tablet: table */
            <div style={{
              background: '#fff', borderRadius: 12,
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
              overflow: 'hidden',
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#1A3C5E', color: '#fff' }}>
                      <th style={{ textAlign: 'left', padding: '11px 14px', fontWeight: 600 }}>Topic</th>
                      {!isTablet && <th style={{ textAlign: 'left', padding: '11px 14px', fontWeight: 600 }}>Store</th>}
                      <th style={{ textAlign: 'left', padding: '11px 14px', fontWeight: 600 }}>Status</th>
                      <th style={{ textAlign: 'center', padding: '11px 14px', fontWeight: 600 }}>Attempts</th>
                      <th style={{ textAlign: 'left', padding: '11px 14px', fontWeight: 600 }}>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {webhookLog.map((ev, i) => {
                      const topicColor = topicColors[ev.topic] || '#7F8C8D';
                      return (
                        <tr key={ev._id} style={{
                          background: i % 2 === 0 ? '#fff' : '#F8FBFF',
                          borderBottom: '1px solid #ECF0F1',
                        }}>
                          <td style={{ padding: '11px 14px' }}>
                            <span style={{
                              fontFamily: 'monospace', fontSize: 12,
                              fontWeight: 700, color: topicColor,
                              background: `${topicColor}15`,
                              padding: '3px 8px', borderRadius: 6,
                            }}>
                              {ev.topic}
                            </span>
                          </td>
                          {!isTablet && (
                            <td style={{ padding: '11px 14px', color: '#7F8C8D', fontSize: 12 }}>
                              {ev.shopDomain}
                            </td>
                          )}
                          <td style={{ padding: '11px 14px' }}>
                            <StatusDot status={
                              ev.status === 'processed' ? 'done'
                                : ev.status === 'failed' ? 'error'
                                  : 'running'
                            } />
                          </td>
                          <td style={{ padding: '11px 14px', textAlign: 'center', color: '#7F8C8D' }}>
                            {ev.attempts}
                          </td>
                          <td style={{ padding: '11px 14px', color: '#7F8C8D', fontSize: 12 }}>
                            {new Date(ev.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}