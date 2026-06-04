

import React, { useEffect, useState, useCallback } from 'react';
import { getDeals, updateDeal } from '../services/api';

const useWidth = () => {
    const [w, setW] = useState(window.innerWidth);
    useEffect(() => {
        const fn = () => setW(window.innerWidth);
        window.addEventListener('resize', fn);
        return () => window.removeEventListener('resize', fn);
    }, []);
    return w;
};

const STAGES = [
    { key: 'new', label: 'New', color: '#2E86C1', bg: '#EBF5FB' },
    { key: 'contacted', label: 'Contacted', color: '#8E44AD', bg: '#F5EEF8'},
    { key: 'qualified', label: 'Qualified', color: '#E67E22', bg: '#FDEBD0' },
    { key: 'proposal', label: 'Proposal', color: '#16A085', bg: '#E8F8F5' },
    { key: 'won', label: 'Won', color: '#1E8449', bg: '#D5F5E3'},
    { key: 'lost', label: 'Lost', color: '#C0392B', bg: '#FDEDEC' },
];

//  Deal Card 
const DealCard = ({ deal, onMove, compact }) => {
    const [open, setOpen] = useState(false);
    const stage = STAGES.find(s => s.key === deal.stage);

    return (
        <div
            onClick={() => setOpen(o => !o)}
            style={{
                background: '#fff',
                borderRadius: 10,
                padding: compact ? '10px 12px' : '12px 14px',
                boxShadow: '0 1px 6px rgba(0,0,0,0.08)',
                marginBottom: 8,
                borderLeft: `3px solid ${stage?.color || '#ccc'}`,
                cursor: 'pointer',
                transition: 'box-shadow 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 3px 12px rgba(0,0,0,0.12)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 6px rgba(0,0,0,0.08)'}
        >
            {/* Title + Value */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                <div style={{ fontSize: compact ? 12 : 13, fontWeight: 700, color: '#1A3C5E', flex: 1 }}>
                    {deal.title}
                </div>
                <div style={{ fontSize: compact ? 12 : 13, fontWeight: 800, color: '#1E8449', whiteSpace: 'nowrap' }}>
                    ₹{(deal.value || 0).toLocaleString()}
                </div>
            </div>

            {/* Contact */}
            {deal.contactId && (
                <div style={{ fontSize: 11, color: '#7F8C8D', marginTop: 4 }}>
                    👤 {deal.contactId.firstName} {deal.contactId.lastName}
                </div>
            )}

            {/* Date */}
            <div style={{ fontSize: 10, color: '#BDC3C7', marginTop: 3 }}>
                {new Date(deal.createdAt).toLocaleDateString()}
            </div>

            {/* Move stage buttons */}
            {open && (
                <div style={{
                    marginTop: 10, borderTop: '1px solid #ECF0F1',
                    paddingTop: 10,
                }}>
                    <div style={{ fontSize: 11, color: '#7F8C8D', marginBottom: 6, fontWeight: 600 }}>
                        Move to:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {STAGES.filter(s => s.key !== deal.stage).map(s => (
                            <button key={s.key}
                                onClick={(e) => { e.stopPropagation(); onMove(deal._id, s.key); setOpen(false); }}
                                style={{
                                    padding: '4px 8px', fontSize: 10, borderRadius: 6,
                                    cursor: 'pointer', fontWeight: 700,
                                    background: s.bg, color: s.color,
                                    border: `1px solid ${s.color}`,
                                    transition: 'opacity 0.15s',
                                }}>
                                 {s.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

//  Mobile List View 
const MobileListView = ({ grouped, totals, onMove, activeStage, setActiveStage }) => (
    <div>
        {/* Stage tabs */}
        <div style={{
            display: 'flex', overflowX: 'auto', gap: 8,
            paddingBottom: 8, marginBottom: 16,
            scrollbarWidth: 'none',
        }}>
            {STAGES.map(s => {
                const count = (grouped[s.key] || []).length;
                const isActive = activeStage === s.key;
                return (
                    <button key={s.key}
                        onClick={() => setActiveStage(s.key)}
                        style={{
                            padding: '8px 14px', borderRadius: 20, fontSize: 12,
                            fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                            flexShrink: 0,
                            background: isActive ? s.color : s.bg,
                            color: isActive ? '#fff' : s.color,
                            border: `2px solid ${s.color}`,
                            transition: 'all 0.15s',
                        }}>
                       {s.label} ({count})
                    </button>
                );
            })}
        </div>

        {/* Active stage header */}
        {STAGES.filter(s => s.key === activeStage).map(stage => {
            const deals = grouped[stage.key] || [];
            return (
                <div key={stage.key}>
                    <div style={{
                        background: stage.bg, borderRadius: 10,
                        padding: '12px 16px', marginBottom: 12,
                        borderTop: `3px solid ${stage.color}`,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: stage.color }}>
                                 {stage.label}
                            </div>
                            <div style={{ fontSize: 12, color: '#7F8C8D', marginTop: 2 }}>
                                {deals.length} deals · ₹{(totals[stage.key] || 0).toLocaleString()}
                            </div>
                        </div>
                    </div>

                    {deals.length === 0 ? (
                        <div style={{
                            textAlign: 'center', padding: '30px 0',
                            color: '#BDC3C7', fontSize: 13,
                            border: '2px dashed #ECF0F1', borderRadius: 10,
                        }}>
                            No deals in this stage
                        </div>
                    ) : (
                        deals.map(deal => (
                            <DealCard key={deal._id} deal={deal} onMove={onMove} compact={false} />
                        ))
                    )}
                </div>
            );
        })}
    </div>
);

//  Main Pipeline 
export default function Pipeline() {
    const [grouped, setGrouped] = useState({ new: [], contacted: [], qualified: [], proposal: [], won: [], lost: [] });
    const [loading, setLoading] = useState(false);
    const [totals, setTotals] = useState({});
    const [activeStage, setActiveStage] = useState('new');
    const width = useWidth();

    const isMobile = width < 640;
    const isTablet = width >= 640 && width < 1200;
    const pad = isMobile ? 14 : 24;

    const load = useCallback(() => {
        setLoading(true);
        getDeals()
            .then(r => {
                setGrouped(r.data.grouped);
                const t = {};
                Object.entries(r.data.grouped).forEach(([stage, deals]) => {
                    t[stage] = deals.reduce((s, d) => s + (d.value || 0), 0);
                });
                setTotals(t);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleMove = async (dealId, newStage) => {
        await updateDeal(dealId, { stage: newStage });
        load();
    };

    const totalWon = totals['won'] || 0;
    const totalPipeline = Object.values(totals).reduce((s, v) => s + v, 0);
    const totalDeals = Object.values(grouped).reduce((s, arr) => s + arr.length, 0);

    return (
        <div style={{ padding: pad, background: '#F4F6F7', minHeight: '100vh' }}>

            {/*  Header  */}
            <div style={{ marginBottom: 18 }}>
                <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: '#1A3C5E', margin: 0 }}>
                    Sales Pipeline
                </h1>
                <p style={{ color: '#7F8C8D', fontSize: 13, marginTop: 4 }}>
                    {isMobile ? 'Tap stage tabs to switch views' : 'Click any deal card to move it to a different stage'}
                </p>
            </div>

            {/*  Summary Cards  */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
                gap: isMobile ? 10 : 14,
                marginBottom: 20,
            }}>
                {[
                    { label: 'Total Deals', value: totalDeals, color: '#2E86C1'},
                    { label: 'Won Value', value: `₹${totalWon.toLocaleString()}`, color: '#1E8449' },
                    { label: 'Pipeline Value', value: `₹${totalPipeline.toLocaleString()}`, color: '#8E44AD' },
                    { label: 'Lost Deals', value: (grouped.lost || []).length, color: '#C0392B' },
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

            {/*  Pipeline Board  */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: 60, color: '#7F8C8D' }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
                    Loading pipeline...
                </div>
            ) : isMobile ? (
                /* Mobile */
                <MobileListView
                    grouped={grouped}
                    totals={totals}
                    onMove={handleMove}
                    activeStage={activeStage}
                    setActiveStage={setActiveStage}
                />
            ) : isTablet ? (
                /* Tablet) */
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    {STAGES.map(stage => {
                        const deals = grouped[stage.key] || [];
                        return (
                            <div key={stage.key}>
                                <div style={{
                                    background: stage.bg, borderRadius: 10,
                                    padding: '10px 12px', marginBottom: 10,
                                    borderTop: `3px solid ${stage.color}`,
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                }}>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: stage.color }}>
                                           {stage.label}
                                        </div>
                                        <div style={{ fontSize: 11, color: '#7F8C8D', marginTop: 2 }}>
                                            {deals.length} · ₹{(totals[stage.key] || 0).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ minHeight: 80 }}>
                                    {deals.length === 0 ? (
                                        <div style={{
                                            textAlign: 'center', padding: '16px 8px',
                                            color: '#BDC3C7', fontSize: 11,
                                            border: '2px dashed #ECF0F1', borderRadius: 8,
                                        }}>
                                            Empty
                                        </div>
                                    ) : (
                                        deals.map(deal => (
                                            <DealCard key={deal._id} deal={deal} onMove={handleMove} compact={true} />
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* Desktop */
                <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(6, minmax(180px, 1fr))',
                        gap: 12,
                        minWidth: 900,
                    }}>
                        {STAGES.map(stage => {
                            const deals = grouped[stage.key] || [];
                            return (
                                <div key={stage.key}>
                                    {/* Column header */}
                                    <div style={{
                                        background: stage.bg, borderRadius: 10,
                                        padding: '10px 12px', marginBottom: 12,
                                        borderTop: `3px solid ${stage.color}`,
                                    }}>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: stage.color }}>
                                           {stage.label}
                                        </div>
                                        <div style={{ fontSize: 11, color: '#7F8C8D', marginTop: 3 }}>
                                            {deals.length} deals · ₹{(totals[stage.key] || 0).toLocaleString()}
                                        </div>
                                    </div>

                                    {/* Deal cards */}
                                    <div style={{ minHeight: 100 }}>
                                        {deals.length === 0 ? (
                                            <div style={{
                                                textAlign: 'center', padding: '20px 8px',
                                                color: '#BDC3C7', fontSize: 11,
                                                border: '2px dashed #ECF0F1', borderRadius: 8,
                                            }}>
                                                No deals
                                            </div>
                                        ) : (
                                            deals.map(deal => (
                                                <DealCard key={deal._id} deal={deal} onMove={handleMove} compact={false} />
                                            ))
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}