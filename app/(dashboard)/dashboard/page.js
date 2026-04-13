'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import dynamic from 'next/dynamic'

const PnLChart = dynamic(() => import('@/components/dashboard/PnLChart'), { ssr: false })

export default function DashboardPage() {
    const { data: session } = useSession()
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [workspaceId, setWorkspaceId] = useState('')
    const [workspaces, setWorkspaces] = useState([])

    useEffect(() => {
        fetch('/api/workspaces')
            .then(r => r.json())
            .then(d => {
                if (d.workspaces?.length > 0) {
                    setWorkspaces(d.workspaces)
                    setWorkspaceId(d.workspaces[0]._id)
                } else {
                    setLoading(false)
                }
            })
    }, [])

    useEffect(() => {
        if (!workspaceId) return
        setLoading(true)
        fetch(`/api/stats?workspaceId=${workspaceId}`)
            .then(r => r.json())
            .then(d => { setData(d); setLoading(false) })
            .catch(() => setLoading(false))
    }, [workspaceId])

    const card = (label, value, sub, subColor) => (
        <div style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '16px',
        }}>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '6px' }}>{label}</div>
            <div style={{ fontSize: '22px', fontWeight: 600, color: '#111', lineHeight: 1 }}>{value}</div>
            {sub && (
                <div style={{ fontSize: '12px', marginTop: '5px', color: subColor || '#9ca3af' }}>{sub}</div>
            )}
        </div>
    )

    if (loading) {
        return (
            <div style={{
                flex: 1, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
            }}>
                <span style={{ fontSize: '14px', color: '#9ca3af' }}>Loading stats...</span>
            </div>
        )
    }

    if (!data && !loading) {
        return (
            <div style={{ padding: '32px' }}>
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#111', marginBottom: '8px' }}>
                    Welcome, {session?.user?.name?.split(' ')[0]}
                </div>
                <p style={{ fontSize: '14px', color: '#6b7280' }}>
                    Go to Backtest, load a chart and place your first trade to see stats here.
                </p>
            </div>
        )
    }

    const { workspace, stats, strategyBreakdown, recentTrades, pnlOverTime } = data

    return (
        <div style={{
            height: '100%',
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
            }}>
                <div>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: '#111' }}>
                        Dashboard
                    </div>
                    <div style={{ fontSize: '13px', color: '#9ca3af', marginTop: '2px' }}>
                        {workspace.name} · {workspace.strategy}
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {workspaces.length > 1 && (
                        <select
                            value={workspaceId}
                            onChange={e => setWorkspaceId(e.target.value)}
                            style={{
                                fontSize: '13px',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                padding: '6px 10px',
                                outline: 'none',
                            }}
                        >
                            {workspaces.map(ws => (
                                <option key={ws._id} value={ws._id}>{ws.name}</option>
                            ))}
                        </select>
                    )}

                    {workspace.periodCovered > 0 && (
                        <div style={{
                            background: '#f0fdf4',
                            border: '1px solid #bbf7d0',
                            borderRadius: '20px',
                            padding: '4px 12px',
                            fontSize: '12px',
                            color: '#15803d',
                            fontWeight: 500,
                        }}>
                            {workspace.periodCovered}% period covered
                        </div>
                    )}
                </div>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '12px',
            }}>
                {card(
                    'Portfolio balance',
                    `$${workspace.currentBalance.toLocaleString()}`,
                    `Started at $${workspace.startingBalance.toLocaleString()}`,
                    stats.totalPnl >= 0 ? '#16a34a' : '#dc2626'
                )}
                {card(
                    'Total P&L',
                    `${stats.totalPnl >= 0 ? '+' : ''}$${stats.totalPnl}`,
                    `${stats.totalTrades} closed trades`,
                    stats.totalPnl >= 0 ? '#16a34a' : '#dc2626'
                )}
                {card(
                    'Win rate',
                    `${stats.winRate}%`,
                    `${stats.wins}W · ${stats.losses}L · ${stats.breakevens}BE`
                )}
                {card(
                    'Profit factor',
                    stats.profitFactor || '--',
                    stats.profitFactor >= 1.5 ? 'Strong edge' : 'Needs improvement',
                    stats.profitFactor >= 1.5 ? '#16a34a' : '#dc2626'
                )}
                {card(
                    'Avg risk:reward',
                    stats.avgRR ? `1:${stats.avgRR}` : '--',
                    `Avg win $${stats.avgWin} · Avg loss $${Math.abs(stats.avgLoss)}`
                )}
                {card(
                    'Open trades',
                    stats.openTrades,
                    stats.openTrades > 0 ? 'Active positions' : 'No open trades'
                )}
            </div>

            <div style={{
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                overflow: 'hidden',
            }}>
                <div style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid #e5e7eb',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#111',
                }}>
                    Balance curve
                </div>
                <div style={{ padding: '12px 16px 16px' }}>
                    <PnLChart data={pnlOverTime} />
                </div>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '16px',
            }}>
                <div style={{
                    background: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    overflow: 'hidden',
                }}>
                    <div style={{
                        padding: '14px 16px',
                        borderBottom: '1px solid #e5e7eb',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#111',
                    }}>
                        Strategy breakdown
                    </div>
                    <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {Object.keys(strategyBreakdown).length === 0 ? (
                            <div style={{ fontSize: '13px', color: '#9ca3af', padding: '8px 0' }}>
                                No strategy data yet
                            </div>
                        ) : (
                            Object.entries(strategyBreakdown).map(([name, s]) => (
                                <div key={name}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: '6px',
                                    }}>
                                        <span style={{ fontSize: '13px', fontWeight: 500, color: '#111' }}>{name}</span>
                                        <span style={{
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            color: s.winRate >= 50 ? '#16a34a' : '#dc2626',
                                        }}>
                                            {s.winRate}%
                                        </span>
                                    </div>
                                    <div style={{
                                        height: '6px',
                                        background: '#f3f4f6',
                                        borderRadius: '3px',
                                        overflow: 'hidden',
                                        marginBottom: '5px',
                                    }}>
                                        <div style={{
                                            height: '100%',
                                            width: `${s.winRate}%`,
                                            background: s.winRate >= 50 ? '#4ade80' : '#f87171',
                                            borderRadius: '3px',
                                            transition: 'width 0.5s ease',
                                        }} />
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        fontSize: '11px',
                                        color: '#9ca3af',
                                    }}>
                                        <span>{s.trades} trades · {s.wins}W {s.losses}L</span>
                                        <span style={{ color: s.pnl >= 0 ? '#16a34a' : '#dc2626', fontWeight: 500 }}>
                                            {s.pnl >= 0 ? '+' : ''}${s.pnl}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div style={{
                    background: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    overflow: 'hidden',
                }}>
                    <div style={{
                        padding: '14px 16px',
                        borderBottom: '1px solid #e5e7eb',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#111' }}>Recent trades</span>
                        <a href="/journal" style={{ fontSize: '12px', color: '#6b7280', textDecoration: 'none' }}>
                            View all →
                        </a>
                    </div>
                    <div>
                        {recentTrades.length === 0 ? (
                            <div style={{ padding: '16px', fontSize: '13px', color: '#9ca3af' }}>
                                No trades yet
                            </div>
                        ) : (
                            recentTrades.map((trade, i) => (
                                <div
                                    key={trade._id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '10px 16px',
                                        borderBottom: i < recentTrades.length - 1 ? '1px solid #f3f4f6' : 'none',
                                        gap: '10px',
                                    }}
                                >
                                    <div style={{
                                        width: '42px', height: '22px',
                                        borderRadius: '4px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '11px', fontWeight: 600,
                                        background: trade.direction === 'BUY' ? '#dcfce7' : '#fee2e2',
                                        color: trade.direction === 'BUY' ? '#15803d' : '#b91c1c',
                                        flexShrink: 0,
                                    }}>
                                        {trade.direction}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '13px', fontWeight: 500, color: '#111' }}>
                                            XAUUSD
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                                            {trade.strategy || 'No strategy'} · {trade.timeframe || '--'}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                        {trade.status === 'closed' ? (
                                            <>
                                                <div style={{
                                                    fontSize: '13px', fontWeight: 600,
                                                    color: (trade.pnl || 0) >= 0 ? '#16a34a' : '#dc2626',
                                                }}>
                                                    {(trade.pnl || 0) >= 0 ? '+' : ''}${trade.pnl}
                                                </div>
                                                <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                                                    1:{trade.riskRewardRatio}
                                                </div>
                                            </>
                                        ) : (
                                            <div style={{
                                                fontSize: '12px', fontWeight: 500,
                                                color: '#f59e0b',
                                                background: '#fef9c3',
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                            }}>
                                                Open
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}