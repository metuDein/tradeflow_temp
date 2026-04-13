'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import dynamic from 'next/dynamic'
import useReplay from '@/hooks/useReplay'
import TradePanel from '@/components/chart/TradePanel'
import AIPanel from '@/components/ai/AIPanel'
import ForecastTool from '@/components/chart/ForecastTool'
import DrawingTools from '@/components/chart/DrawingTools'

const TradingChart = dynamic(
    () => import('@/components/chart/TradingChart'),
    { ssr: false }
)

const TIMEFRAMES = ['1min', '5min', '15min', '30min', '1h', '4h', '1day']

export default function BacktestPage() {
    const { data: session } = useSession()
    const [candles, setCandles] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [timeframe, setTimeframe] = useState('1h')
    const [startDate, setStartDate] = useState('2024-01-01')
    const [endDate, setEndDate] = useState('2024-03-31')
    const [fetched, setFetched] = useState(false)
    const [workspaceId, setWorkspaceId] = useState('')
    const [workspaces, setWorkspaces] = useState([])
    const [openTrade, setOpenTrade] = useState(null)
    const [lastClosedTrade, setLastClosedTrade] = useState(null)
    const [aiAnalysis, setAiAnalysis] = useState(null)
    const [showPanel, setShowPanel] = useState(true)

    const replay = useReplay(candles)

    useEffect(() => {
        fetch('/api/workspaces')
            .then(r => r.json())
            .then(d => {
                if (d.workspaces?.length > 0) {
                    setWorkspaces(d.workspaces)
                    setWorkspaceId(d.workspaces[0]._id)
                }
            })
    }, [])

    const fetchCandles = async () => {
        setLoading(true)
        setError('')
        try {
            const res = await fetch(
                `/api/market-data?symbol=XAU/USD&interval=${timeframe}&startDate=${startDate}&endDate=${endDate}`
            )
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setCandles(data.candles)
            setFetched(true)
            replay.reset()
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleTradePlaced = (trade) => {
        setOpenTrade(trade)
    }

    const handleTradeClose = (trade, analysis) => {
        setOpenTrade(null)
        if (trade) {
            setLastClosedTrade(trade)
            setAiAnalysis(analysis)
        }
    }

    const currentPrice = replay.currentCandle
        ? parseFloat(replay.currentCandle.close).toFixed(2)
        : candles.length > 0
            ? parseFloat(candles[candles.length - 1]?.close).toFixed(2)
            : ''

    const fmt = (ts) => ts ? new Date(ts * 1000).toLocaleString() : '--'
    const fmtPrice = (p) => p ? parseFloat(p).toFixed(2) : '--'

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            width: '100%',
            overflow: 'hidden',
            color: "black"
        }}>
            <div style={{
                background: '#fff',
                borderBottom: '1px solid #e5e7eb',
                padding: '10px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap',
                flexShrink: 0,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#111' }}>XAUUSD</span>
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>Gold / USD</span>
                </div>

                {workspaces.length > 0 && (
                    <select
                        value={workspaceId}
                        onChange={(e) => setWorkspaceId(e.target.value)}
                        style={{
                            fontSize: '12px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            padding: '5px 10px',
                            outline: 'none',
                        }}
                    >
                        {workspaces.map(ws => (
                            <option key={ws._id} value={ws._id}>{ws.name}</option>
                        ))}
                    </select>
                )}

                <div style={{
                    display: 'flex',
                    gap: '2px',
                    background: '#f3f4f6',
                    borderRadius: '8px',
                    padding: '3px',
                }}>
                    {TIMEFRAMES.map((tf) => (
                        <button
                            key={tf}
                            onClick={() => setTimeframe(tf)}
                            style={{
                                padding: '4px 10px',
                                fontSize: '12px',
                                borderRadius: '6px',
                                border: timeframe === tf ? '1px solid #e5e7eb' : 'none',
                                background: timeframe === tf ? '#fff' : 'transparent',
                                color: timeframe === tf ? '#111' : '#6b7280',
                                fontWeight: timeframe === tf ? 600 : 400,
                                cursor: 'pointer',
                            }}
                        >
                            {tf}
                        </button>
                    ))}
                </div>

                <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{
                        fontSize: '12px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '5px 10px',
                        outline: 'none',
                    }}
                />
                <span style={{ fontSize: '12px', color: '#9ca3af' }}>to</span>
                <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={{
                        fontSize: '12px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '5px 10px',
                        outline: 'none',
                    }}
                />

                <button
                    onClick={fetchCandles}
                    disabled={loading}
                    style={{
                        background: '#111827',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '6px 16px',
                        fontSize: '13px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.6 : 1,
                    }}
                >
                    {loading ? 'Loading...' : 'Load chart'}
                </button>

                {currentPrice && (
                    <div style={{
                        marginLeft: 'auto',
                        fontSize: '14px',
                        fontWeight: 700,
                        color: '#111',
                    }}>
                        {currentPrice}
                    </div>
                )}

                {error && (
                    <span style={{ fontSize: '12px', color: '#ef4444' }}>{error}</span>
                )}

                <button
                    onClick={() => setShowPanel(p => !p)}
                    style={{
                        fontSize: '12px',
                        background: showPanel ? '#111827' : '#f3f4f6',
                        color: showPanel ? '#fff' : '#6b7280',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        cursor: 'pointer',
                    }}
                >
                    {showPanel ? 'Hide panel' : 'Trade panel'}
                </button>
            </div>

            <div style={{
                flex: 1,
                display: 'flex',
                overflow: 'hidden',
                minHeight: 0,
            }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{
                        flex: 1,
                        position: 'relative',
                        overflow: 'hidden',
                        background: '#0d0d1a',
                    }}>
                        {!fetched ? (
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '12px',
                            }}>
                                <div style={{
                                    width: '56px', height: '56px',
                                    background: '#1a1a2e',
                                    borderRadius: '16px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                                        <path d="M4 20L10 12L16 16L24 6"
                                            stroke="#4ade80" strokeWidth="2"
                                            strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <p style={{ color: '#6b7280', fontSize: '14px' }}>
                                    Select a date range and click Load chart
                                </p>
                            </div>
                        ) : (
                            <>
                                <TradingChart
                                    candles={candles}
                                    replayIndex={replay.replayIndex}
                                />
                                <DrawingTools visible={true} />
                                <ForecastTool
                                    candles={candles}
                                    replayIndex={replay.replayIndex}
                                    onForecastSubmit={(f) => console.log('Forecast drawn:', f)}
                                />
                            </>
                        )}
                    </div>

                    {fetched && (
                        <div style={{
                            background: '#111827',
                            borderTop: '1px solid #1f2937',
                            padding: '10px 20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            flexShrink: 0,
                        }}>
                            <button onClick={replay.reset} title="Reset"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: '4px' }}>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M2 8a6 6 0 1 0 1-3.5" strokeLinecap="round" />
                                    <path d="M2 2v4h4" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>

                            <button onClick={replay.stepBack}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: '4px' }}>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M10 4L6 8l4 4" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>

                            <button
                                onClick={replay.isPlaying ? replay.pause : replay.play}
                                style={{
                                    width: '32px', height: '32px',
                                    background: '#4ade80',
                                    border: 'none', borderRadius: '8px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer',
                                }}>
                                {replay.isPlaying ? (
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="#111">
                                        <rect x="2" y="1" width="3" height="10" rx="1" />
                                        <rect x="7" y="1" width="3" height="10" rx="1" />
                                    </svg>
                                ) : (
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="#111">
                                        <path d="M2 1l9 5-9 5V1z" />
                                    </svg>
                                )}
                            </button>

                            <button onClick={replay.stepForward}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: '4px' }}>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>

                            <button onClick={replay.cycleSpeed}
                                style={{
                                    fontSize: '12px',
                                    background: '#1f2937',
                                    border: '1px solid #374151',
                                    borderRadius: '6px',
                                    padding: '3px 10px',
                                    color: '#d1d5db',
                                    cursor: 'pointer',
                                }}>
                                {replay.speed}×
                            </button>

                            <div
                                onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect()
                                    const pct = (e.clientX - rect.left) / rect.width
                                    replay.setReplayIndex(Math.floor(pct * candles.length))
                                }}
                                style={{
                                    flex: 1, height: '4px',
                                    background: '#374151',
                                    borderRadius: '2px',
                                    position: 'relative',
                                    cursor: 'pointer',
                                    margin: '0 8px',
                                }}>
                                <div style={{
                                    height: '100%',
                                    width: `${replay.progress.toFixed(1)}%`,
                                    background: '#4ade80',
                                    borderRadius: '2px',
                                }} />
                                <div style={{
                                    width: '12px', height: '12px',
                                    background: '#4ade80',
                                    border: '2px solid #111827',
                                    borderRadius: '50%',
                                    position: 'absolute',
                                    top: '50%',
                                    left: `${replay.progress.toFixed(1)}%`,
                                    transform: 'translate(-50%, -50%)',
                                }} />
                            </div>

                            <span style={{ fontSize: '12px', color: '#6b7280', whiteSpace: 'nowrap' }}>
                                {replay.replayIndex !== null
                                    ? `${replay.replayIndex + 1} / ${candles.length}`
                                    : `${candles.length} candles`}
                            </span>

                            {replay.currentCandle && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    fontSize: '12px',
                                    borderLeft: '1px solid #374151',
                                    paddingLeft: '12px',
                                }}>
                                    <span style={{ color: '#6b7280' }}>{fmt(replay.currentCandle.time)}</span>
                                    <span style={{ color: '#9ca3af' }}>O: <b style={{ color: '#fff' }}>{fmtPrice(replay.currentCandle.open)}</b></span>
                                    <span style={{ color: '#9ca3af' }}>H: <b style={{ color: '#4ade80' }}>{fmtPrice(replay.currentCandle.high)}</b></span>
                                    <span style={{ color: '#9ca3af' }}>L: <b style={{ color: '#ef4444' }}>{fmtPrice(replay.currentCandle.low)}</b></span>
                                    <span style={{ color: '#9ca3af' }}>C: <b style={{ color: '#fff' }}>{fmtPrice(replay.currentCandle.close)}</b></span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {showPanel && (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        width: '260px',
                        borderLeft: '1px solid #e5e7eb',
                        overflow: 'hidden',
                    }}>
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            <TradePanel
                                workspaceId={workspaceId}
                                currentPrice={currentPrice}
                                openTrade={openTrade}
                                onTradePlaced={handleTradePlaced}
                                onTradeClose={handleTradeClose}
                            />
                        </div>
                        <div style={{
                            padding: '12px',
                            borderTop: '1px solid #e5e7eb',
                            overflowY: 'auto',
                            maxHeight: '300px',
                        }}>
                            <AIPanel
                                trade={lastClosedTrade}
                                workspaceId={workspaceId}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}