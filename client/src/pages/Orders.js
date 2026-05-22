import React, { useEffect, useState } from 'react';
import { getOrders } from '../services/api';

const useWidth = () => {
    const [w, setW] = useState(window.innerWidth);
    useEffect(() => {
        const fn = () => setW(window.innerWidth);
        window.addEventListener('resize', fn);
        return () => window.removeEventListener('resize', fn);
    }, []);
    return w;
};

const Badge = ({ label, color, bg }) => (
    <span style={{
        background: bg, color,
        padding: '3px 10px', borderRadius: 20,
        fontSize: 11, fontWeight: 600,
        whiteSpace: 'nowrap',
    }}>{label}</span>
);

const statusColor = (s) => {
    const map = {
        paid: { color: '#1E8449', bg: '#D5F5E3' },
        pending: { color: '#D35400', bg: '#FDEBD0' },
        refunded: { color: '#C0392B', bg: '#FDEDEC' },
        voided: { color: '#7F8C8D', bg: '#F2F3F4' },
        authorized: { color: '#2E86C1', bg: '#EBF5FB' },
    };
    return map[s] || { color: '#7F8C8D', bg: '#F2F3F4' };
};

const fulfillColor = (s) => {
    const map = {
        fulfilled: { color: '#1E8449', bg: '#D5F5E3' },
        partial: { color: '#D35400', bg: '#FDEBD0' },
    };
    return map[s] || { color: '#7F8C8D', bg: '#F2F3F4' };
};

//  Order Detail Panel 
const OrderDetail = ({ order, onClose, isMobile }) => {
    const ps = statusColor(order.financialStatus);
    const fs = fulfillColor(order.fulfillmentStatus);

    const content = (
        <div style={{ padding: 20 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ color: '#1A3C5E', fontSize: 16, fontWeight: 700, margin: 0 }}>
                    Order #{order.shopifyOrderNumber}
                </h3>
                <button onClick={onClose} style={{
                    background: '#F4F6F7', border: 'none',
                    borderRadius: 20, width: 30, height: 30,
                    fontSize: 16, cursor: 'pointer', color: '#7F8C8D',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>✕</button>
            </div>

            {/* Date */}
            <div style={{ fontSize: 12, color: '#7F8C8D', marginBottom: 12 }}>
                {order.shopifyCreatedAt ? new Date(order.shopifyCreatedAt).toLocaleString() : '—'}
            </div>

            {/* Badges */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
                <Badge label={order.financialStatus || 'unknown'} {...ps} />
                <Badge label={order.fulfillmentStatus || 'unfulfilled'} {...fs} />
            </div>

            {/* Line items */}
            <div style={{ borderTop: '1px solid #ECF0F1', paddingTop: 14, marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#7F8C8D', marginBottom: 10, letterSpacing: 0.5 }}>
                    LINE ITEMS
                </div>
                {(order.lineItems || []).map((li, i) => (
                    <div key={i} style={{
                        display: 'flex', justifyContent: 'space-between',
                        fontSize: 13, marginBottom: 8, gap: 8,
                    }}>
                        <span style={{ color: '#2C3E50' }}>{li.title} × {li.quantity}</span>
                        <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                            ₹{((li.price || 0) * (li.quantity || 1)).toLocaleString()}
                        </span>
                    </div>
                ))}
            </div>

            {/* Totals */}
            <div style={{ borderTop: '1px solid #ECF0F1', paddingTop: 12 }}>
                {[
                    ['Subtotal', `₹${(order.subtotalPrice || 0).toLocaleString()}`],
                    ['Discount', `-₹${(order.totalDiscounts || 0).toLocaleString()}`],
                    ['Tax', `₹${(order.totalTax || 0).toLocaleString()}`],
                    ['Refunded', `-₹${(order.totalRefunded || 0).toLocaleString()}`],
                ].map(([k, v]) => (
                    <div key={k} style={{
                        display: 'flex', justifyContent: 'space-between',
                        fontSize: 13, marginBottom: 6, color: '#7F8C8D',
                    }}>
                        <span>{k}</span><span>{v}</span>
                    </div>
                ))}
                <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: 16, fontWeight: 800, color: '#1A3C5E',
                    marginTop: 10, paddingTop: 10,
                    borderTop: '2px solid #EBF5FB',
                }}>
                    <span>Total</span>
                    <span>₹{(order.totalPrice || 0).toLocaleString()}</span>
                </div>
            </div>

            {/* Gateway */}
            {order.gateway && (
                <div style={{
                    marginTop: 14, fontSize: 12, color: '#7F8C8D',
                    background: '#F8FBFF', padding: '8px 12px', borderRadius: 8,
                }}>
                    Payment via: <span style={{ color: '#2C3E50', fontWeight: 600 }}>{order.gateway}</span>
                </div>
            )}
        </div>
    );

    // Mobile: bottom sheet modal
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
                    zIndex: 400, maxHeight: '80vh', overflowY: 'auto',
                    boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
                }}>
                    {/* drag handle */}
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
            width: 300, background: '#fff', borderRadius: 12,
            boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
            alignSelf: 'flex-start', flexShrink: 0,
        }}>
            {content}
        </div>
    );
};

//  Main Orders Component 
export default function Orders() {
    const [orders, setOrders] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [filter, setFilter] = useState('');
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState(null);
    const width = useWidth();

    const isMobile = width < 640;
    const isTablet = width >= 640 && width < 1024;
    const isDesktop = width >= 1024;

    useEffect(() => {
        setLoading(true);
        getOrders({ page, limit: 20, financialStatus: filter })
            .then(r => { setOrders(r.data.orders); setTotal(r.data.total); })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [page, filter]);

    const totalRevenue = orders.reduce((s, o) => s + (o.totalPrice || 0), 0);
    const paidCount = orders.filter(o => o.financialStatus === 'paid').length;
    const pad = isMobile ? 14 : 24;

    const filters = ['', 'paid', 'pending', 'refunded', 'voided'];

    return (
        <div style={{ padding: pad, background: '#F4F6F7', minHeight: '100vh' }}>

            {/*  Header  */}
            <div style={{ marginBottom: 18 }}>
                <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: '#1A3C5E', margin: 0 }}>
                    Orders
                </h1>
                <p style={{ color: '#7F8C8D', fontSize: 13, marginTop: 4 }}>
                    {total.toLocaleString()} total orders synced from Shopify
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
                    { label: 'Total Orders', value: total, color: '#2E86C1', icon: '📦' },
                    { label: 'Paid', value: paidCount, color: '#1E8449', icon: '✅' },
                    { label: 'Revenue', value: `₹${totalRevenue.toLocaleString()}`, color: '#8E44AD', icon: '💰' },
                    { label: 'Current Page', value: `Page ${page}`, color: '#E67E22', icon: '📄' },
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
                        <div style={{ fontSize: isMobile ? 20 : 22, fontWeight: 800, color: '#1A3C5E', marginTop: 6 }}>
                            {c.value}
                        </div>
                    </div>
                ))}
            </div>

            {/*  Filter Buttons  */}
            <div style={{
                display: 'flex', gap: 8, marginBottom: 16,
                flexWrap: 'wrap',
            }}>
                {filters.map(s => (
                    <button key={s} onClick={() => { setFilter(s); setPage(1); }}
                        style={{
                            padding: isMobile ? '6px 12px' : '7px 16px',
                            borderRadius: 8, fontSize: isMobile ? 12 : 13,
                            cursor: 'pointer', fontWeight: 600,
                            border: filter === s ? '2px solid #2E86C1' : '1px solid #D5D8DC',
                            background: filter === s ? '#EBF5FB' : '#fff',
                            color: filter === s ? '#2E86C1' : '#7F8C8D',
                            transition: 'all 0.15s',
                        }}>
                        {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                ))}
            </div>

            {/*  Orders List  */}
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{
                    flex: 1, background: '#fff', borderRadius: 12,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
                    overflow: 'hidden', minWidth: 0,
                }}>
                    {loading ? (
                        <div style={{ padding: 60, textAlign: 'center', color: '#7F8C8D' }}>
                            <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
                            Loading orders...
                        </div>
                    ) : orders.length === 0 ? (
                        <div style={{ padding: 60, textAlign: 'center', color: '#BDC3C7' }}>
                            <div style={{ fontSize: 40, marginBottom: 8 }}>📦</div>
                            <div style={{ fontSize: 14 }}>No orders found</div>
                        </div>
                    ) : isMobile ? (
                        /*  Mobile: Card list  */
                        <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {orders.map(o => {
                                const ps = statusColor(o.financialStatus);
                                const isSelected = selected?._id === o._id;
                                return (
                                    <div key={o._id}
                                        onClick={() => setSelected(isSelected ? null : o)}
                                        style={{
                                            background: isSelected ? '#EBF5FB' : '#F8FBFF',
                                            borderRadius: 10, padding: '12px 14px',
                                            border: `1px solid ${isSelected ? '#2E86C1' : '#ECF0F1'}`,
                                            cursor: 'pointer',
                                        }}>
                                        {/* Row 1 */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                            <span style={{ fontSize: 14, fontWeight: 700, color: '#2E86C1' }}>
                                                #{o.shopifyOrderNumber}
                                            </span>
                                            <span style={{ fontSize: 14, fontWeight: 800, color: '#1A3C5E' }}>
                                                ₹{(o.totalPrice || 0).toLocaleString()}
                                            </span>
                                        </div>
                                        {/* Row 2 */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                            <span style={{ fontSize: 12, color: '#7F8C8D' }}>
                                                {o.contactId
                                                    ? `${o.contactId.firstName || ''} ${o.contactId.lastName || ''}`.trim()
                                                    : o.customerEmail || '—'}
                                            </span>
                                            <span style={{ fontSize: 11, color: '#95A5A6' }}>
                                                {o.shopifyCreatedAt ? new Date(o.shopifyCreatedAt).toLocaleDateString() : '—'}
                                            </span>
                                        </div>
                                        {/* Row 3 */}
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <Badge label={o.financialStatus || 'unknown'} {...ps} />
                                            <Badge label={o.fulfillmentStatus || 'unfulfilled'} {...fulfillColor(o.fulfillmentStatus)} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        /*  Tablet/Desktop: Table  */
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                <thead>
                                    <tr style={{ background: '#1A3C5E', color: '#fff' }}>
                                        {(isTablet
                                            ? ['Order #', 'Customer', 'Amount', 'Payment']
                                            : ['Order #', 'Customer', 'Date', 'Amount', 'Payment', 'Fulfillment']
                                        ).map(h => (
                                            <th key={h} style={{ textAlign: 'left', padding: '11px 14px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map((o, i) => {
                                        const ps = statusColor(o.financialStatus);
                                        const fs = fulfillColor(o.fulfillmentStatus);
                                        const isSelected = selected?._id === o._id;
                                        return (
                                            <tr key={o._id}
                                                onClick={() => setSelected(isSelected ? null : o)}
                                                style={{
                                                    background: isSelected ? '#EBF5FB' : i % 2 === 0 ? '#fff' : '#F8FBFF',
                                                    borderBottom: '1px solid #ECF0F1', cursor: 'pointer',
                                                    transition: 'background 0.1s',
                                                }}
                                                onMouseEnter={e => !isSelected && (e.currentTarget.style.background = '#F0F8FF')}
                                                onMouseLeave={e => !isSelected && (e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#F8FBFF')}
                                            >
                                                <td style={{ padding: '11px 14px', color: '#2E86C1', fontWeight: 700 }}>
                                                    #{o.shopifyOrderNumber}
                                                </td>
                                                <td style={{ padding: '11px 14px' }}>
                                                    {o.contactId
                                                        ? `${o.contactId.firstName || ''} ${o.contactId.lastName || ''}`.trim()
                                                        : o.customerEmail || '—'}
                                                </td>
                                                {isDesktop && (
                                                    <td style={{ padding: '11px 14px', color: '#7F8C8D' }}>
                                                        {o.shopifyCreatedAt ? new Date(o.shopifyCreatedAt).toLocaleDateString() : '—'}
                                                    </td>
                                                )}
                                                <td style={{ padding: '11px 14px', fontWeight: 700 }}>
                                                    ₹{(o.totalPrice || 0).toLocaleString()}
                                                </td>
                                                <td style={{ padding: '11px 14px' }}>
                                                    <Badge label={o.financialStatus || 'unknown'} {...ps} />
                                                </td>
                                                {isDesktop && (
                                                    <td style={{ padding: '11px 14px' }}>
                                                        <Badge label={o.fulfillmentStatus || 'unfulfilled'} {...fs} />
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Desktop side panel */}
                {selected && !isMobile && (
                    <OrderDetail order={selected} onClose={() => setSelected(null)} isMobile={false} />
                )}
            </div>

            {/* Mobile bottom sheet */}
            {selected && isMobile && (
                <OrderDetail order={selected} onClose={() => setSelected(null)} isMobile={true} />
            )}

            {/*  Pagination  */}
            {total > 20 && (
                <div style={{
                    display: 'flex', justifyContent: 'center',
                    alignItems: 'center', gap: 10, marginTop: 20,
                }}>
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        style={{
                            padding: isMobile ? '8px 14px' : '8px 20px',
                            borderRadius: 8, border: '1px solid #BDC3C7',
                            cursor: page === 1 ? 'not-allowed' : 'pointer',
                            background: page === 1 ? '#F4F6F7' : '#fff',
                            color: page === 1 ? '#BDC3C7' : '#1A3C5E',
                            fontWeight: 600, fontSize: 13,
                        }}>
                        ← Prev
                    </button>
                    <span style={{ color: '#7F8C8D', fontSize: 13 }}>
                        {page} / {Math.ceil(total / 20)}
                    </span>
                    <button
                        onClick={() => setPage(p => p + 1)}
                        disabled={page >= Math.ceil(total / 20)}
                        style={{
                            padding: isMobile ? '8px 14px' : '8px 20px',
                            borderRadius: 8, border: '1px solid #BDC3C7',
                            cursor: page >= Math.ceil(total / 20) ? 'not-allowed' : 'pointer',
                            background: '#fff', color: '#1A3C5E',
                            fontWeight: 600, fontSize: 13,
                        }}>
                        Next →
                    </button>
                </div>
            )}
        </div>
    );
}