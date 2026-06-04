import React, { useState } from 'react';

//  Responsive hook 
const useWidth = () => {
  const [w, setW] = useState(window.innerWidth);
  React.useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return w;
};

const CAMPAIGNS = [
  { id: 1, name: 'Abandoned Cart Recovery',  type: 'Automated', status: 'active',  trigger: 'Cart abandoned > 60 min',   sent: 1240, opened: 487,  clicked: 203, revenue: 48200  },
  { id: 2, name: 'Post-Purchase Thank You',   type: 'Automated', status: 'active',  trigger: 'Order paid',                sent: 3820, opened: 2134, clicked: 891, revenue: 124500 },
  { id: 3, name: 'Win-Back Campaign',         type: 'Automated', status: 'active',  trigger: 'No order in 90 days',       sent: 640,  opened: 198,  clicked: 67,  revenue: 18900  },
  { id: 4, name: 'VIP Customer Reward',       type: 'Manual',    status: 'draft',   trigger: 'LTV > ₹50,000',            sent: 0,    opened: 0,    clicked: 0,   revenue: 0      },
  { id: 5, name: 'Refund Recovery',           type: 'Automated', status: 'active',  trigger: 'Refund issued',             sent: 312,  opened: 140,  clicked: 48,  revenue: 9800   },
  { id: 6, name: 'First Purchase Welcome',    type: 'Automated', status: 'paused',  trigger: 'First order placed',        sent: 890,  opened: 634,  clicked: 312, revenue: 67400  },
  { id: 7, name: 'Seasonal Sale - Summer',    type: 'Manual',    status: 'sent',    trigger: 'Manual send',               sent: 5200, opened: 1820, clicked: 724, revenue: 198000 },
];

const statusCfg = {
  active: { color: '#1E8449', bg: '#D5F5E3' },
  draft:  { color: '#7F8C8D', bg: '#F2F3F4' },
  paused: { color: '#D35400', bg: '#FDEBD0'},
  sent:   { color: '#2E86C1', bg: '#EBF5FB' },
};

const typeCfg = {
  Automated: { color: '#8E44AD', bg: '#F5EEF8' },
  Manual:    { color: '#E67E22', bg: '#FDEBD0'},
};

const Badge = ({ label, color, bg }) => (
  <span style={{
    background: bg, color,
    padding: '3px 10px', borderRadius: 20,
    fontSize: 11, fontWeight: 700,
    whiteSpace: 'nowrap',
  }}>
  {label}
  </span>
);

const rate = (a, b) => b > 0 ? ((a / b) * 100).toFixed(1) + '%' : '—';

// Campaign Detail Panel 
const CampaignDetail = ({ campaign, onClose, isMobile }) => {
  const sc = statusCfg[campaign.status];
  const tc = typeCfg[campaign.type];
  const openRate  = rate(campaign.opened,  campaign.sent);
  const clickRate = rate(campaign.clicked, campaign.sent);
  const ctr       = rate(campaign.clicked, campaign.opened);

  const content = (
    <div style={{ padding: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div style={{ flex: 1, paddingRight: 10 }}>
          <h3 style={{ color: '#1A3C5E', fontSize: 15, fontWeight: 800, margin: 0, marginBottom: 6 }}>
            {campaign.name}
          </h3>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Badge label={campaign.status} {...sc} />
            <Badge label={campaign.type}   {...tc} />
          </div>
        </div>
        <button onClick={onClose} style={{
          background: '#F4F6F7', border: 'none',
          borderRadius: 20, width: 30, height: 30,
          fontSize: 16, cursor: 'pointer', color: '#7F8C8D',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>✕</button>
      </div>

      {/* Trigger */}
      <div style={{
        background: '#F8FBFF', borderRadius: 8,
        padding: '10px 12px', marginBottom: 16,
        border: '1px solid #EBF5FB', fontSize: 12,
      }}>
        <span style={{ color: '#7F8C8D', fontWeight: 600 }}>Trigger: </span>
        <span style={{ color: '#1A3C5E', fontWeight: 700 }}>{campaign.trigger}</span>
      </div>

      {/* Stats grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 10, marginBottom: 16,
      }}>
        {[
          { label: 'Sent',       value: campaign.sent.toLocaleString(),    color: '#2E86C1' },
          { label: 'Opened',     value: `${campaign.opened.toLocaleString()} (${openRate})`,  color: '#8E44AD' },
          { label: 'Clicked',    value: `${campaign.clicked.toLocaleString()} (${clickRate})`, color: '#E67E22' },
          { label: 'Revenue',    value: campaign.revenue > 0 ? `₹${campaign.revenue.toLocaleString()}` : '—', color: '#1E8449' },
        ].map(s => (
          <div key={s.label} style={{
            background: '#F8FBFF', borderRadius: 8,
            padding: '10px 12px', border: '1px solid #EBF5FB',
          }}>
            <div style={{ fontSize: 10, color: '#7F8C8D', fontWeight: 600, marginBottom: 4 }}>
              {s.label}
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: s.color }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Progress bars */}
      {campaign.sent > 0 && (
        <div style={{ marginBottom: 16 }}>
          {[
            { label: 'Open Rate',  value: parseFloat(openRate),  color: '#8E44AD', good: 30 },
            { label: 'Click Rate', value: parseFloat(clickRate), color: '#E67E22', good: 10 },
            { label: 'CTR',        value: parseFloat(ctr),       color: '#2E86C1', good: 20 },
          ].map(bar => (
            <div key={bar.label} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: '#7F8C8D', fontWeight: 600 }}>{bar.label}</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: bar.value >= bar.good ? '#1E8449' : '#E67E22' }}>
                  {bar.value.toFixed(1)}%
                </span>
              </div>
              <div style={{ background: '#ECF0F1', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                <div style={{
                  width: `${Math.min(bar.value, 100)}%`,
                  height: '100%', borderRadius: 4,
                  background: bar.value >= bar.good ? '#1E8449' : '#E67E22',
                  transition: 'width 0.5s ease',
                }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8 }}>
        {campaign.status === 'active' && (
          <button style={{
            flex: 1, padding: '10px', borderRadius: 8,
            background: '#FDEBD0', color: '#D35400',
            border: '1px solid #F0B27A', fontSize: 13,
            fontWeight: 700, cursor: 'pointer',
          }}> Pause</button>
        )}
        {campaign.status === 'paused' && (
          <button style={{
            flex: 1, padding: '10px', borderRadius: 8,
            background: '#D5F5E3', color: '#1E8449',
            border: '1px solid #82E0AA', fontSize: 13,
            fontWeight: 700, cursor: 'pointer',
          }}>Resume</button>
        )}
        {campaign.status === 'draft' && (
          <button style={{
            flex: 1, padding: '10px', borderRadius: 8,
            background: '#1A3C5E', color: '#fff',
            border: 'none', fontSize: 13,
            fontWeight: 700, cursor: 'pointer',
          }}> Launch</button>
        )}
        <button style={{
          flex: 1, padding: '10px', borderRadius: 8,
          background: '#EBF5FB', color: '#2E86C1',
          border: '1px solid #AED6F1', fontSize: 13,
          fontWeight: 700, cursor: 'pointer',
        }}> Edit</button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <div onClick={onClose} style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 300,
        }} />
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: '#fff', borderRadius: '16px 16px 0 0',
          zIndex: 400, maxHeight: '90vh', overflowY: 'auto',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
        }}>
          <div style={{
            width: 40, height: 4, background: '#BDC3C7',
            borderRadius: 2, margin: '12px auto 0',
          }} />
          {content}
        </div>
      </>
    );
  }

  return (
    <div style={{
      width: 320, background: '#fff', borderRadius: 12,
      boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
      alignSelf: 'flex-start', flexShrink: 0,
    }}>
      {content}
    </div>
  );
};

//  New Campaign Modal 
const NewCampaignModal = ({ onClose }) => (
  <>
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.5)', zIndex: 400,
    }} />
    <div style={{
      position: 'fixed', top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)',
      background: '#fff', borderRadius: 16,
      padding: 28, width: '90%', maxWidth: 480,
      zIndex: 500, maxHeight: '90vh', overflowY: 'auto',
      boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ color: '#1A3C5E', fontSize: 18, fontWeight: 800, margin: 0 }}>
          Create Campaign
        </h2>
        <button onClick={onClose} style={{
          background: '#F4F6F7', border: 'none',
          borderRadius: 20, width: 32, height: 32,
          fontSize: 18, cursor: 'pointer', color: '#7F8C8D',
        }}>✕</button>
      </div>

      {[
        { label: 'Campaign Name', placeholder: 'e.g. Summer Sale 2026',          type: 'text' },
        { label: 'Subject Line',  placeholder: 'e.g. Exclusive offer just for you!', type: 'text' },
      ].map(f => (
        <div key={f.label} style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#2C3E50', marginBottom: 6 }}>
            {f.label}
          </label>
          <input placeholder={f.placeholder} type={f.type} style={{
            width: '100%', padding: '10px 14px',
            borderRadius: 8, border: '1px solid #D5D8DC',
            fontSize: 14, boxSizing: 'border-box', outline: 'none',
          }} />
        </div>
      ))}

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#2C3E50', marginBottom: 6 }}>
          Audience Segment
        </label>
        <select style={{
          width: '100%', padding: '10px 14px',
          borderRadius: 8, border: '1px solid #D5D8DC',
          fontSize: 13, background: '#fff',
        }}>
          <option>All customers</option>
          <option>VIP customers (LTV &gt; ₹50,000)</option>
          <option>At-risk customers</option>
          <option>First-time buyers</option>
          <option>Abandoned cart (last 7 days)</option>
          <option>No purchase in 90 days</option>
          <option>Refund issued (last 30 days)</option>
        </select>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#2C3E50', marginBottom: 8 }}>
          Campaign Type
        </label>
        <div style={{ display: 'flex', gap: 10 }}>
          {['Manual', 'Automated'].map(t => (
            <label key={t} style={{
              flex: 1, display: 'flex', alignItems: 'center',
              gap: 8, cursor: 'pointer', padding: '10px 14px',
              border: '1px solid #D5D8DC', borderRadius: 8,
              fontSize: 13, fontWeight: 600,
            }}>
              <input type="radio" name="type" defaultChecked={t === 'Manual'} />
              {t === 'Manual' ? ' Manual' : ' Automated'}
            </label>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#2C3E50', marginBottom: 6 }}>
          Channel
        </label>
        <div style={{ display: 'flex', gap: 10 }}>
          {[' Email', 'SMS', ' Push'].map(ch => (
            <label key={ch} style={{
              flex: 1, display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 6,
              cursor: 'pointer', padding: '8px',
              border: '1px solid #D5D8DC', borderRadius: 8,
              fontSize: 12, fontWeight: 600,
            }}>
              <input type="checkbox" />
              {ch}
            </label>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onClose} style={{
          flex: 1, padding: '12px',
          background: '#F4F6F7', color: '#7F8C8D',
          border: '1px solid #D5D8DC', borderRadius: 8,
          cursor: 'pointer', fontSize: 14, fontWeight: 600,
        }}>
          Cancel
        </button>
        <button onClick={() => { alert('Campaign saved as draft!'); onClose(); }} style={{
          flex: 2, padding: '12px',
          background: '#1A3C5E', color: '#fff',
          border: 'none', borderRadius: 8,
          cursor: 'pointer', fontSize: 14, fontWeight: 700,
        }}>
           Save as Draft
        </button>
      </div>
    </div>
  </>
);

//  Mobile Campaign Card 
const CampaignCard = ({ campaign, onClick }) => {
  const sc = statusCfg[campaign.status];
  const tc = typeCfg[campaign.type];
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ flex: 1, paddingRight: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1A3C5E', marginBottom: 4 }}>
            {campaign.name}
          </div>
          <div style={{ fontSize: 11, color: '#7F8C8D' }}>{campaign.trigger}</div>
        </div>
        <Badge label={campaign.status} {...sc} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Badge label={campaign.type} {...tc} />
        {campaign.revenue > 0 && (
          <span style={{ fontSize: 13, fontWeight: 800, color: '#1E8449' }}>
            ₹{campaign.revenue.toLocaleString()}
          </span>
        )}
      </div>

      {campaign.sent > 0 && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 6, background: '#F8FBFF',
          borderRadius: 8, padding: '8px 10px',
        }}>
          {[
            { label: 'Sent',    value: campaign.sent.toLocaleString() },
            { label: 'Open',    value: rate(campaign.opened, campaign.sent) },
            { label: 'Click',   value: rate(campaign.clicked, campaign.sent) },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#1A3C5E' }}>{s.value}</div>
              <div style={{ fontSize: 10, color: '#7F8C8D' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

//  Main Campaigns Component 
export default function Campaigns() {
  const [selected, setSelected] = useState(null);
  const [showNew,  setShowNew]  = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const width = useWidth();

  const isMobile  = width < 640;
  const isTablet  = width >= 640 && width < 1024;
  const pad       = isMobile ? 14 : 24;

  const filtered = CAMPAIGNS.filter(c => {
    if (typeFilter   && c.type   !== typeFilter)   return false;
    if (statusFilter && c.status !== statusFilter) return false;
    return true;
  });

  const activeCampaigns = CAMPAIGNS.filter(c => c.status === 'active').length;
  const totalSent       = CAMPAIGNS.reduce((s, c) => s + c.sent, 0);
  const totalRevenue    = CAMPAIGNS.reduce((s, c) => s + c.revenue, 0);
  const avgOpenRate     = CAMPAIGNS
    .filter(c => c.sent > 0)
    .reduce((s, c) => s + (c.opened / c.sent * 100), 0)
    / CAMPAIGNS.filter(c => c.sent > 0).length;

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
            Campaigns
          </h1>
          <p style={{ color: '#7F8C8D', fontSize: 13, marginTop: 4 }}>
            Email & SMS campaigns powered by Shopify customer data
          </p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          style={{
            padding: isMobile ? '9px 16px' : '10px 20px',
            background: '#1A3C5E', color: '#fff',
            border: 'none', borderRadius: 10,
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}>
          + New Campaign
        </button>
      </div>

      {/*  Summary Cards  */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: isMobile ? 10 : 14,
        marginBottom: 18,
      }}>
        {[
          { label: 'Active',      value: activeCampaigns,                      color: '#1E8449'},
          { label: 'Total Sent',  value: totalSent.toLocaleString(),           color: '#2E86C1'},
          { label: 'Avg Open',    value: `${avgOpenRate.toFixed(1)}%`,         color: '#8E44AD' },
          { label: 'Revenue',     value: `₹${totalRevenue.toLocaleString()}`,  color: '#E67E22' },
        ].map(c => (
          <div key={c.label} style={{
            background: '#fff', borderRadius: 10,
            padding: isMobile ? '12px 14px' : '14px 18px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
            borderTop: `3px solid ${c.color}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 11, color: '#7F8C8D', fontWeight: 600, textTransform: 'uppercase' }}>
                {c.label}
              </div>
            </div>
            <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: '#1A3C5E', marginTop: 6 }}>
              {c.value}
            </div>
          </div>
        ))}
      </div>

      {/* Filters  */}
      <div style={{
        display: 'flex', gap: 8, marginBottom: 16,
        flexWrap: 'wrap',
      }}>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          style={{
            padding: '8px 12px', borderRadius: 8,
            border: '1px solid #D5D8DC', fontSize: 13,
            background: '#fff', cursor: 'pointer',
            flex: isMobile ? 1 : 'unset',
          }}>
          <option value="">All Types</option>
          <option value="Automated"> Automated</option>
          <option value="Manual">Manual</option>
        </select>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{
            padding: '8px 12px', borderRadius: 8,
            border: '1px solid #D5D8DC', fontSize: 13,
            background: '#fff', cursor: 'pointer',
            flex: isMobile ? 1 : 'unset',
          }}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="draft"> Draft</option>
          <option value="sent"> Sent</option>
        </select>

        {(typeFilter || statusFilter) && (
          <button
            onClick={() => { setTypeFilter(''); setStatusFilter(''); }}
            style={{
              padding: '8px 14px', borderRadius: 8,
              background: '#FDEDEC', color: '#C0392B',
              border: '1px solid #F5B7B1',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
            ✕ Clear
          </button>
        )}
      </div>

      {/*  Campaign List  */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>

          {filtered.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: 60,
              background: '#fff', borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
            }}>
              {/* <div style={{ fontSize: 40, marginBottom: 10 }}></div> */}
              <div style={{ fontSize: 14, color: '#7F8C8D' }}>No campaigns match your filters</div>
            </div>
          ) : isMobile ? (
            /* ── Mobile: Cards ── */
            <div>
              {filtered.map(c => (
                <CampaignCard
                  key={c.id}
                  campaign={c}
                  onClick={() => setSelected(selected?.id === c.id ? null : c)}
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
                      <th style={{ textAlign: 'left', padding: '11px 14px', fontWeight: 600 }}>Campaign</th>
                      <th style={{ textAlign: 'left', padding: '11px 14px', fontWeight: 600 }}>Type</th>
                      {!isTablet && <th style={{ textAlign: 'left', padding: '11px 14px', fontWeight: 600 }}>Trigger</th>}
                      <th style={{ textAlign: 'left', padding: '11px 14px', fontWeight: 600 }}>Status</th>
                      <th style={{ textAlign: 'right', padding: '11px 14px', fontWeight: 600 }}>Sent</th>
                      <th style={{ textAlign: 'right', padding: '11px 14px', fontWeight: 600 }}>Open %</th>
                      {!isTablet && <th style={{ textAlign: 'right', padding: '11px 14px', fontWeight: 600 }}>Click %</th>}
                      <th style={{ textAlign: 'right', padding: '11px 14px', fontWeight: 600 }}>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c, i) => {
                      const sc = statusCfg[c.status];
                      const tc = typeCfg[c.type];
                      const openR  = rate(c.opened,  c.sent);
                      const clickR = rate(c.clicked, c.sent);
                      const isSelected = selected?.id === c.id;
                      return (
                        <tr
                          key={c.id}
                          onClick={() => setSelected(isSelected ? null : c)}
                          style={{
                            background: isSelected ? '#EBF5FB' : i % 2 === 0 ? '#fff' : '#F8FBFF',
                            borderBottom: '1px solid #ECF0F1',
                            cursor: 'pointer', transition: 'background 0.1s',
                          }}
                          onMouseEnter={e => !isSelected && (e.currentTarget.style.background = '#F0F8FF')}
                          onMouseLeave={e => !isSelected && (e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#F8FBFF')}
                        >
                          <td style={{ padding: '11px 14px', fontWeight: 700, color: '#1A3C5E', maxWidth: 200 }}>
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {c.name}
                            </div>
                          </td>
                          <td style={{ padding: '11px 14px' }}>
                            <Badge label={c.type} {...tc} />
                          </td>
                          {!isTablet && (
                            <td style={{ padding: '11px 14px', color: '#7F8C8D', fontSize: 12, maxWidth: 160 }}>
                              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {c.trigger}
                              </div>
                            </td>
                          )}
                          <td style={{ padding: '11px 14px' }}>
                            <Badge label={c.status} {...sc} />
                          </td>
                          <td style={{ padding: '11px 14px', textAlign: 'right', color: '#7F8C8D' }}>
                            {c.sent.toLocaleString()}
                          </td>
                          <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                            <span style={{
                              fontWeight: 700,
                              color: parseFloat(openR) >= 30 ? '#1E8449' : '#E67E22',
                            }}>
                              {openR}
                            </span>
                          </td>
                          {!isTablet && (
                            <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                              <span style={{
                                fontWeight: 700,
                                color: parseFloat(clickR) >= 10 ? '#1E8449' : '#7F8C8D',
                              }}>
                                {clickR}
                              </span>
                            </td>
                          )}
                          <td style={{ padding: '11px 14px', textAlign: 'right', fontWeight: 800, color: '#1E8449' }}>
                            {c.revenue > 0 ? `₹${c.revenue.toLocaleString()}` : '—'}
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

        {/* Desktop side panel */}
        {selected && !isMobile && (
          <CampaignDetail campaign={selected} onClose={() => setSelected(null)} isMobile={false} />
        )}
      </div>

      {/* Mobile bottom sheet */}
      {selected && isMobile && (
        <CampaignDetail campaign={selected} onClose={() => setSelected(null)} isMobile={true} />
      )}

      {/* New Campaign Modal */}
      {showNew && <NewCampaignModal onClose={() => setShowNew(false)} />}
    </div>
  );
}