import React, { useEffect, useState, useCallback } from 'react';
import { getCarts } from '../services/api';

//  Responsive hook 
const useWidth = () => {
    const [w, setW] = useState(window.innerWidth);
    useEffect(() => {
        const fn = () => setW(window.innerWidth);
        window.addEventListener('resize', fn);
        return () => window.removeEventListener('resize', fn);
    }, []);
    return w;
};

const statusConfig = {
    open: { color: '#E67E22', bg: '#FDEBD0', icon: '🛒', label: 'Open' },
    email_sent: { color: '#2E86C1', bg: '#EBF5FB', icon: '📧', label: 'Email Sent' },
    recovered: { color: '#1E8449', bg: '#D5F5E3', icon: '✅', label: 'Recovered' },
    expired: { color: '#7F8C8D', bg: '#F2F3F4', icon: '⏰', label: 'Expired' },
};

const StatusBadge = ({ status }) => {
    const cfg = statusConfig[status] || statusConfig.open;
    return (
        <span style={{
            background: cfg.bg, color: cfg.color,
            padding: '3px 10px', borderRadius: 20,
            fontSize: 11, fontWeight: 700,
            whiteSpace: 'nowrap',
        }}>
            {cfg.icon} {cfg.label}
        </span>
    );
};

//  Cart Detail Modal (mobile bottom sheet / desktop modal) 
const CartDetail = ({ cart, onClose, isMobile }) => {
    const content = (
        <div style={{ padding: 20 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                    <h3 style={{ color: '#1A3C5E', fontSize: 16, fontWeight: 800, margin: 0 }}>
                        🛒 Abandoned Cart
                    </h3>
                    <div style={{ fontSize: 12, color: '#7F8C8D', marginTop: 4 }}>
                        {cart.email || 'Anonymous'}
                    </div>
                </div>
                <button onClick={onClose} style={{
                    background: '#F4F6F7', border: 'none', borderRadius: 20,
                    width: 30, height: 30, fontSize: 16, cursor: 'pointer',
                    color: '#7F8C8D', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>✕</button>
            </div>

            {/* Status + Date */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
                <StatusBadge status={cart.status} />
                <span style={{ fontSize: 12, color: '#95A5A6' }}>
                    {cart.shopifyUpdatedAt ? new Date(cart.shopifyUpdatedAt).toLocaleString() : '—'}
                </span>
            </div>

            {/* Cart Items */}
            <div style={{
                background: '#F8FBFF', borderRadius: 10,
                padding: '12px 14px', marginBottom: 16,
                border: '1px solid #EBF5FB',
            }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#7F8C8D', marginBottom: 10, letterSpacing: 0.5 }}>
                    CART ITEMS
                </div>
                {(cart.lineItems || []).map((li, i) => (
                    <div key={i} style={{
                        display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center', marginBottom: 8, gap: 8,
                    }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#1A3C5E' }}>{li.title}</div>
                            <div style={{ fontSize: 11, color: '#7F8C8D' }}>Qty: {li.quantity}</div>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#1E8449', whiteSpace: 'nowrap' }}>
                            ₹{((li.price || 0) * (li.quantity || 1)).toLocaleString()}
                        </div>
                    </div>
                ))}
                {/* Total */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    borderTop: '2px solid #EBF5FB', paddingTop: 10, marginTop: 6,
                }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#1A3C5E' }}>Cart Total</span>
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#1A3C5E' }}>
                        ₹{(cart.totalPrice || 0).toLocaleString()}
                    </span>
                </div>
            </div>

            {/* Stats */}
            <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr',
                gap: 10, marginBottom: 16,
            }}>
                <div style={{
                    background: '#F8FBFF', borderRadius: 8,
                    padding: '10px 12px', border: '1px solid #EBF5FB',
                    textAlign: 'center',
                }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#2E86C1' }}>
                        {cart.recoveryEmailsSent || 0}
                    </div>
                    <div style={{ fontSize: 11, color: '#7F8C8D' }}>Emails Sent</div>
                </div>
                <div style={{
                    background: '#F8FBFF', borderRadius: 8,
                    padding: '10px 12px', border: '1px solid #EBF5FB',
                    textAlign: 'center',
                }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: cart.status === 'recovered' ? '#1E8449' : '#E67E22' }}>
                        {cart.status === 'recovered' ? '✅' : '⏳'}
                    </div>
                    <div style={{ fontSize: 11, color: '#7F8C8D' }}>
                        {cart.status === 'recovered' ? 'Recovered' : 'Pending'}
                    </div>
                </div>
            </div>

            {/* Recovery URL */}
            {cart.abandonedCheckoutUrl && cart.status !== 'recovered' && (
                <a
                    href={cart.abandonedCheckoutUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                        display: 'block', textAlign: 'center',
                        padding: '12px', background: '#1A3C5E',
                        color: '#fff', borderRadius: 10,
                        fontSize: 14, fontWeight: 700,
                        textDecoration: 'none',
                        transition: 'opacity 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = 0.85}
                    onMouseLeave={e => e.currentTarget.style.opacity = 1}
                >
                    🔗 Open Recovery URL
                </a>
            )}
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
                    zIndex: 400, maxHeight: '85vh', overflowY: 'auto',
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

    // Desktop: side panel
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

//  Mobile Cart Card 
const CartCard = ({ cart, onClick }) => (
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
        {/* Row 1: Email + Value */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1A3C5E' }}>
                    {cart.email || 'Anonymous'}
                </div>
                <div style={{ fontSize: 11, color: '#7F8C8D', marginTop: 2 }}>
                    {(cart.lineItems || []).length} item(s)
                </div>
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#1A3C5E' }}>
                ₹{(cart.totalPrice || 0).toLocaleString()}
            </div>
        </div>

        {/* Row 2: Status + Date */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <StatusBadge status={cart.status} />
            <span style={{ fontSize: 11, color: '#95A5A6' }}>
                {cart.shopifyUpdatedAt ? new Date(cart.shopifyUpdatedAt).toLocaleDateString() : '—'}
            </span>
        </div>

        {/* Row 3: Items preview */}
        <div style={{
            background: '#F8FBFF', borderRadius: 8,
            padding: '6px 10px', fontSize: 11, color: '#7F8C8D',
        }}>
            {(cart.lineItems || []).slice(0, 2).map((li, i) => (
                <span key={i}>
                    {i > 0 && ' · '}
                    {li.title} ×{li.quantity}
                </span>
            ))}
            {(cart.lineItems || []).length > 2 && (
                <span> +{cart.lineItems.length - 2} more</span>
            )}
        </div>

        {/* Row 4: Emails sent */}
        <div style={{ marginTop: 8, fontSize: 11, color: '#7F8C8D' }}>
            📧 {cart.recoveryEmailsSent || 0} recovery email(s) sent
        </div>
    </div>
);

//  Main AbandonedCarts Component 
export default function AbandonedCarts() {
    const [carts, setCarts] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('open');
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState(null);
    const width = useWidth();

    const isMobile = width < 640;
    const isTablet = width >= 640 && width < 1024;
    const pad = isMobile ? 14 : 24;

    const fetchCarts = useCallback(() => {
        setLoading(true);
        getCarts({ page, limit: 20, status: statusFilter })
            .then(r => { setCarts(r.data.carts); setTotal(r.data.total); })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [page, statusFilter]);

    useEffect(() => { fetchCarts(); }, [fetchCarts]);

    const totalValue = carts.reduce((s, c) => s + (c.totalPrice || 0), 0);
    const avgValue = carts.length > 0 ? totalValue / carts.length : 0;
    const totalPages = Math.ceil(total / 20);

    return (
        <div style={{ padding: pad, background: '#F4F6F7', minHeight: '100vh' }}>

            {/*  Header  */}
            <div style={{ marginBottom: 18 }}>
                <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: '#1A3C5E', margin: 0 }}>
                    Abandoned Carts
                </h1>
                <p style={{ color: '#7F8C8D', fontSize: 13, marginTop: 4 }}>
                    Track and recover abandoned Shopify checkouts
                </p>
            </div>

            {/*  Summary Cards  */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
                gap: isMobile ? 10 : 14,
                marginBottom: 18,
            }}>
                {[
                    { label: 'Total Carts', value: total, color: '#E67E22', icon: '🛒' },
                    { label: 'Cart Value', value: `₹${totalValue.toLocaleString()}`, color: '#2E86C1', icon: '💰' },
                    { label: 'Avg Value', value: `₹${Math.round(avgValue).toLocaleString()}`, color: '#8E44AD', icon: '📊' },
                    { label: 'Recovery Rate', value: statusFilter === 'recovered' ? `${total}` : '—', color: '#1E8449', icon: '✅' },
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
                            <span style={{ fontSize: 18 }}>{c.icon}</span>
                        </div>
                        <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: '#1A3C5E', marginTop: 6 }}>
                            {c.value}
                        </div>
                    </div>
                ))}
            </div>

            {/*  Status Filter Tabs  */}
            <div style={{
                display: 'flex', gap: 8, marginBottom: 16,
                flexWrap: isMobile ? 'wrap' : 'nowrap',
            }}>
                {Object.entries(statusConfig).map(([key, cfg]) => (
                    <button
                        key={key}
                        onClick={() => { setStatusFilter(key); setPage(1); setSelected(null); }}
                        style={{
                            padding: isMobile ? '7px 12px' : '8px 16px',
                            borderRadius: 8, fontSize: isMobile ? 12 : 13,
                            cursor: 'pointer', fontWeight: 700,
                            border: statusFilter === key ? `2px solid ${cfg.color}` : '1px solid #D5D8DC',
                            background: statusFilter === key ? cfg.bg : '#fff',
                            color: statusFilter === key ? cfg.color : '#7F8C8D',
                            transition: 'all 0.15s',
                            flex: isMobile ? '1 1 calc(50% - 4px)' : 'unset',
                        }}>
                        {cfg.icon} {cfg.label}
                    </button>
                ))}
            </div>

            {/*  Content Area  */}
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 60, color: '#7F8C8D' }}>
                            <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
                            Loading carts...
                        </div>
                    ) : carts.length === 0 ? (
                        <div style={{
                            textAlign: 'center', padding: 60,
                            background: '#fff', borderRadius: 12,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                        }}>
                            <div style={{ fontSize: 40, marginBottom: 10 }}>🛒</div>
                            <div style={{ fontSize: 14, color: '#7F8C8D' }}>
                                No {statusConfig[statusFilter]?.label.toLowerCase()} carts found
                            </div>
                        </div>
                    ) : isMobile ? (
                        /*  Mobile: Card list  */
                        <div>
                            {carts.map(cart => (
                                <CartCard
                                    key={cart._id}
                                    cart={cart}
                                    onClick={() => setSelected(selected?._id === cart._id ? null : cart)}
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
                                            <th style={{ textAlign: 'left', padding: '11px 14px', fontWeight: 600 }}>Customer</th>
                                            <th style={{ textAlign: 'left', padding: '11px 14px', fontWeight: 600 }}>Items</th>
                                            <th style={{ textAlign: 'right', padding: '11px 14px', fontWeight: 600 }}>Value</th>
                                            <th style={{ textAlign: 'left', padding: '11px 14px', fontWeight: 600 }}>Status</th>
                                            {!isTablet && <th style={{ textAlign: 'left', padding: '11px 14px', fontWeight: 600 }}>Last Seen</th>}
                                            <th style={{ textAlign: 'center', padding: '11px 14px', fontWeight: 600 }}>Emails</th>
                                            {!isTablet && <th style={{ textAlign: 'left', padding: '11px 14px', fontWeight: 600 }}>Action</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {carts.map((cart, i) => {
                                            const isSelected = selected?._id === cart._id;
                                            return (
                                                <React.Fragment key={cart._id}>
                                                    <tr
                                                        onClick={() => setSelected(isSelected ? null : cart)}
                                                        style={{
                                                            background: isSelected ? '#EBF5FB' : i % 2 === 0 ? '#fff' : '#F8FBFF',
                                                            borderBottom: '1px solid #ECF0F1',
                                                            cursor: 'pointer', transition: 'background 0.1s',
                                                        }}
                                                        onMouseEnter={e => !isSelected && (e.currentTarget.style.background = '#F0F8FF')}
                                                        onMouseLeave={e => !isSelected && (e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#F8FBFF')}
                                                    >
                                                        <td style={{ padding: '11px 14px' }}>
                                                            <div style={{ fontWeight: 600, color: '#1A3C5E' }}>
                                                                {cart.contactId
                                                                    ? `${cart.contactId.firstName || ''} ${cart.contactId.lastName || ''}`.trim() || cart.email
                                                                    : cart.email || 'Anonymous'}
                                                            </div>
                                                            <div style={{ fontSize: 11, color: '#7F8C8D' }}>{cart.email}</div>
                                                        </td>
                                                        <td style={{ padding: '11px 14px', color: '#7F8C8D' }}>
                                                            {(cart.lineItems || []).length} item(s)
                                                        </td>
                                                        <td style={{ padding: '11px 14px', textAlign: 'right', fontWeight: 800, color: '#1A3C5E' }}>
                                                            ₹{(cart.totalPrice || 0).toLocaleString()}
                                                        </td>
                                                        <td style={{ padding: '11px 14px' }}>
                                                            <StatusBadge status={cart.status} />
                                                        </td>
                                                        {!isTablet && (
                                                            <td style={{ padding: '11px 14px', color: '#7F8C8D', fontSize: 12 }}>
                                                                {cart.shopifyUpdatedAt ? new Date(cart.shopifyUpdatedAt).toLocaleDateString() : '—'}
                                                            </td>
                                                        )}
                                                        <td style={{ padding: '11px 14px', textAlign: 'center', color: '#7F8C8D' }}>
                                                            {cart.recoveryEmailsSent || 0}
                                                        </td>
                                                        {!isTablet && (
                                                            <td style={{ padding: '11px 14px' }}>
                                                                {cart.abandonedCheckoutUrl && cart.status !== 'recovered' ? (
                                                                    <a
                                                                        href={cart.abandonedCheckoutUrl}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        onClick={e => e.stopPropagation()}
                                                                        style={{
                                                                            fontSize: 12, color: '#2E86C1',
                                                                            fontWeight: 700, textDecoration: 'none',
                                                                            background: '#EBF5FB', padding: '4px 10px',
                                                                            borderRadius: 6, whiteSpace: 'nowrap',
                                                                        }}>
                                                                        🔗 Recover
                                                                    </a>
                                                                ) : (
                                                                    <span style={{ fontSize: 12, color: '#BDC3C7' }}>—</span>
                                                                )}
                                                            </td>
                                                        )}
                                                    </tr>

                                                    {/* Expanded line items row */}
                                                    {isSelected && !isMobile && (
                                                        <tr>
                                                            <td colSpan={isTablet ? 5 : 7} style={{
                                                                padding: '0 14px 14px 14px',
                                                                background: '#EBF5FB',
                                                            }}>
                                                                <div style={{ fontSize: 11, fontWeight: 700, color: '#7F8C8D', marginBottom: 8, letterSpacing: 0.5 }}>
                                                                    CART ITEMS
                                                                </div>
                                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                                                    {(cart.lineItems || []).map((li, idx) => (
                                                                        <div key={idx} style={{
                                                                            background: '#fff', borderRadius: 8,
                                                                            padding: '8px 12px', fontSize: 12,
                                                                            border: '1px solid #D6EAF8',
                                                                        }}>
                                                                            <span style={{ fontWeight: 700, color: '#1A3C5E' }}>{li.title}</span>
                                                                            <span style={{ color: '#7F8C8D' }}> × {li.quantity} </span>
                                                                            <span style={{ color: '#1E8449', fontWeight: 700 }}>
                                                                                ₹{((li.price || 0) * (li.quantity || 1)).toLocaleString()}
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
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
                    <CartDetail cart={selected} onClose={() => setSelected(null)} isMobile={false} />
                )}
            </div>

            {/* Mobile bottom sheet */}
            {selected && isMobile && (
                <CartDetail cart={selected} onClose={() => setSelected(null)} isMobile={true} />
            )}

            {/*  Pagination  */}
            {total > 20 && (
                <div style={{
                    display: 'flex', justifyContent: 'center',
                    alignItems: 'center', gap: 8, marginTop: 20,
                }}>
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        style={{
                            padding: '8px 16px', borderRadius: 8,
                            border: '1px solid #D5D8DC',
                            cursor: page === 1 ? 'not-allowed' : 'pointer',
                            background: page === 1 ? '#F4F6F7' : '#fff',
                            color: page === 1 ? '#BDC3C7' : '#1A3C5E',
                            fontSize: 13, fontWeight: 600,
                        }}>
                        ← Prev
                    </button>
                    <span style={{ color: '#7F8C8D', fontSize: 13, padding: '0 8px' }}>
                        {page} / {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                        style={{
                            padding: '8px 16px', borderRadius: 8,
                            border: '1px solid #D5D8DC',
                            cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                            background: '#fff', color: '#1A3C5E',
                            fontSize: 13, fontWeight: 600,
                        }}>
                        Next →
                    </button>
                </div>
            )}
        </div>
    );
}