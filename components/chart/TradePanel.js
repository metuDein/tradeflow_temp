'use client'
import { useState } from 'react'
import { captureChart } from '@/lib/screenshot'

const EXEC_TYPES = ['Market', 'Limit', 'Stop']
const TIMEFRAMES = ['1min', '5min', '15min', '30min', '1h', '4h', '1day']

export default function TradePanel({
    workspaceId,
    currentPrice,
    onTradePlaced,
    onTradeClose,
    openTrade,
}) {
    const [direction, setDirection] = useState('BUY')
    const [execType, setExecType] = useState('Market')
    const [entryPrice, setEntryPrice] = useState('')
    const [stopLoss, setStopLoss] = useState('')
    const [takeProfit, setTakeProfit] = useState('')
    const [tp2, setTp2] = useState('')
    const [tp3, setTp3] = useState('')
    const [showMultiTP, setShowMultiTP] = useState(false)
    const [lotSize, setLotSize] = useState('0.1')
    const [riskPercent, setRiskPercent] = useState('')
    const [riskMode, setRiskMode] = useState('lot')
    const [timeframe, setTimeframe] = useState('1h')
    const [notes, setNotes] = useState('')
    const [loading, setLoading] = useState(false)
    const [closing, setClosing] = useState(false)
    const [exitPrice, setExitPrice] = useState('')
    const [partialPercent, setPartialPercent] = useState(50)
    const [deviations, setDeviations] = useState([])
    const [error, setError] = useState('')
    const [activeSection, setActiveSection] = useState('entry')

    const price = parseFloat(entryPrice) || parseFloat(currentPrice) || 0
    const sl = parseFloat(stopLoss) || 0
    const tp = parseFloat(takeProfit) || 0

    const slDistance = price && sl ? Math.abs(price - sl) : 0
    const tpDistance = price && tp ? Math.abs(tp - price) : 0
    const rr = slDistance > 0 ? parseFloat((tpDistance / slDistance).toFixed(2)) : 0

    const pipValue = parseFloat(lotSize) * 100
    const potentialLoss = slDistance > 0 ? parseFloat((slDistance * pipValue).toFixed(2)) : 0
    const potentialGain = tpDistance > 0 ? parseFloat((tpDistance * pipValue).toFixed(2)) : 0

    const rrColor = rr >= 2 ? '#16a34a' : rr >= 1 ? '#f59e0b' : '#dc2626'

    const useCurrentPrice = () => {
        setEntryPrice(currentPrice || '')
    }

    const autoSL = (pips) => {
        if (!price) return
        const val = direction === 'BUY'
            ? (price - pips).toFixed(2)
            : (price + pips).toFixed(2)
        setStopLoss(val)
    }

    const autoTP = (ratio) => {
        if (!price || !sl) return
        const dist = Math.abs(price - sl) * ratio
        const val = direction === 'BUY'
            ? (price + dist).toFixed(2)
            : (price - dist).toFixed(2)
        setTakeProfit(val)
    }

    const placeTrade = async () => {
        setLoading(true)
        setError('')
        setDeviations([])
        try {
            const screenshot = await captureChart('chart-container')
            const res = await fetch('/api/trades', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    workspaceId,
                    direction,
                    execType,
                    entryPrice: price,
                    stopLoss: sl,
                    takeProfit: tp,
                    tp2: tp2 ? parseFloat(tp2) : null,
                    tp3: tp3 ? parseFloat(tp3) : null,
                    lotSize: parseFloat(lotSize),
                    timeframe,
                    notes,
                    screenshot,
                }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            if (data.deviations?.length > 0) setDeviations(data.deviations)
            onTradePlaced?.(data.trade)
            setNotes('')
            setTp2('')
            setTp3('')
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const closeTrade = async (partial = false) => {
        if (!exitPrice || !openTrade) return
        setClosing(true)
        setError('')
        try {
            const screenshot = await captureChart('chart-container')
            const res = await fetch(`/api/trades/${openTrade._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    exitPrice: parseFloat(exitPrice),
                    partial,
                    partialPercent: partial ? partialPercent : 100,
                    screenshot,
                }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            onTradeClose?.(data.trade, data.aiAnalysis)
            if (!partial) setExitPrice('')
        } catch (err) {
            setError(err.message)
        } finally {
            setClosing(false)
        }
    }

    const s = {
        input: {
            width: '100%',
            padding: '7px 10px',
            fontSize: '13px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            outline: 'none',
            background: '#fff',
            color: '#111',
        },
        label: {
            fontSize: '11px',
            color: '#6b7280',
            marginBottom: '4px',
            display: 'block',
        },
        section: {
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
        },
        pill: (active) => ({
            padding: '3px 10px',
            fontSize: '11px',
            borderRadius: '20px',
            border: active ? '1px solid #111827' : '1px solid #e5e7eb',
            background: active ? '#111827' : '#fff',
            color: active ? '#fff' : '#6b7280',
            cursor: 'pointer',
        }),
        quickBtn: {
            padding: '3px 8px',
            fontSize: '11px',
            borderRadius: '6px',
            border: '1px solid #e5e7eb',
            background: '#f9fafb',
            color: '#6b7280',
            cursor: 'pointer',
        },
    }

    if (openTrade) {
        return (
            <div style={{
                width: '260px',
                background: '#fff',
                borderLeft: '1px solid #e5e7eb',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                overflowY: 'auto',
                flexShrink: 0,
            }}>
                <div style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #e5e7eb',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#111',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                }}>
                    <div style={{
                        width: '8px', height: '8px',
                        borderRadius: '50%',
                        background: '#f59e0b',
                        animation: 'pulse 1.5s infinite',
                    }} />
                    Open trade
                </div>

                <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>

                <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{
                        background: '#f9fafb',
                        border: '1px solid #e5e7eb',
                        borderRadius: '10px',
                        padding: '12px',
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '10px',
                        }}>
                            <span style={{
                                fontWeight: 700, fontSize: '14px',
                                color: openTrade.direction === 'BUY' ? '#16a34a' : '#dc2626',
                            }}>
                                {openTrade.direction}
                            </span>
                            <span style={{
                                fontSize: '11px', padding: '2px 8px',
                                borderRadius: '4px',
                                background: '#eff6ff', color: '#1d4ed8',
                            }}>
                                {openTrade.execType || 'Market'}
                            </span>
                        </div>

                        {[
                            ['Entry', openTrade.entryPrice, '#111'],
                            ['Stop loss', openTrade.stopLoss, '#dc2626'],
                            ['Take profit', openTrade.takeProfit, '#16a34a'],
                            ['Lot size', openTrade.lotSize, '#111'],
                            ['R:R', `1:${openTrade.riskRewardRatio}`, '#111'],
                        ].map(([label, val, color]) => (
                            <div key={label} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '12px',
                                marginBottom: '5px',
                            }}>
                                <span style={{ color: '#6b7280' }}>{label}</span>
                                <span style={{ fontWeight: 500, color }}>{val}</span>
                            </div>
                        ))}
                    </div>

                    <div>
                        <label style={s.label}>Exit price</label>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            <input
                                type="number"
                                value={exitPrice}
                                onChange={e => setExitPrice(e.target.value)}
                                placeholder={currentPrice || 'e.g. 2065.00'}
                                style={{ ...s.input, flex: 1 }}
                            />
                            <button
                                onClick={() => setExitPrice(currentPrice)}
                                style={{
                                    padding: '7px 10px',
                                    fontSize: '11px',
                                    borderRadius: '8px',
                                    border: '1px solid #e5e7eb',
                                    background: '#f9fafb',
                                    color: '#6b7280',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    flexShrink: 0,
                                }}
                            >
                                Use live
                            </button>
                        </div>
                    </div>

                    <div>
                        <label style={s.label}>Partial close — {partialPercent}%</label>
                        <input
                            type="range"
                            min="10"
                            max="90"
                            step="10"
                            value={partialPercent}
                            onChange={e => setPartialPercent(parseInt(e.target.value))}
                            style={{ width: '100%' }}
                        />
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '11px',
                            color: '#9ca3af',
                            marginTop: '2px',
                        }}>
                            <span>10%</span>
                            <span>50%</span>
                            <span>90%</span>
                        </div>
                    </div>

                    {error && (
                        <div style={{
                            background: '#fef2f2', border: '1px solid #fca5a5',
                            borderRadius: '8px', padding: '8px 12px',
                            fontSize: '12px', color: '#b91c1c',
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        onClick={() => closeTrade(true)}
                        disabled={closing || !exitPrice}
                        style={{
                            width: '100%', padding: '10px',
                            background: '#f9fafb',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '13px', fontWeight: 500,
                            color: '#374151',
                            cursor: closing || !exitPrice ? 'not-allowed' : 'pointer',
                            opacity: closing || !exitPrice ? 0.5 : 1,
                        }}
                    >
                        Close {partialPercent}% partial
                    </button>

                    <button
                        onClick={() => closeTrade(false)}
                        disabled={closing || !exitPrice}
                        style={{
                            width: '100%', padding: '10px',
                            background: '#111827', color: '#fff',
                            border: 'none', borderRadius: '8px',
                            fontSize: '13px', fontWeight: 500,
                            cursor: closing || !exitPrice ? 'not-allowed' : 'pointer',
                            opacity: closing || !exitPrice ? 0.5 : 1,
                        }}
                    >
                        {closing ? 'Closing...' : 'Close full position'}
                    </button>

                    <button
                        onClick={() => onTradeClose?.(null)}
                        style={{
                            width: '100%', padding: '9px',
                            fontSize: '13px',
                            borderRadius: '8px',
                            border: '1px solid #e5e7eb',
                            cursor: 'pointer',
                            background: '#fff', color: '#6b7280',
                        }}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div style={{
            width: '260px',
            background: '#fff',
            borderLeft: '1px solid #e5e7eb',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflowY: 'auto',
            flexShrink: 0,
        }}>
            <div style={{
                padding: '10px 12px',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                gap: '4px',
                flexShrink: 0,
            }}>
                {['entry', 'manage'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveSection(tab)}
                        style={{
                            flex: 1,
                            padding: '6px',
                            fontSize: '12px',
                            borderRadius: '7px',
                            border: 'none',
                            background: activeSection === tab ? '#111827' : 'transparent',
                            color: activeSection === tab ? '#fff' : '#6b7280',
                            cursor: 'pointer',
                            fontWeight: activeSection === tab ? 500 : 400,
                            textTransform: 'capitalize',
                        }}
                    >
                        {tab === 'entry' ? 'New trade' : 'Risk calc'}
                    </button>
                ))}
            </div>

            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

                {activeSection === 'entry' && (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                            {['BUY', 'SELL'].map(d => (
                                <button
                                    key={d}
                                    onClick={() => setDirection(d)}
                                    style={{
                                        padding: '10px',
                                        fontSize: '13px',
                                        fontWeight: 700,
                                        borderRadius: '8px',
                                        border: direction === d
                                            ? 'none'
                                            : '1px solid #e5e7eb',
                                        cursor: 'pointer',
                                        background: direction === d
                                            ? d === 'BUY' ? '#16a34a' : '#dc2626'
                                            : '#f9fafb',
                                        color: direction === d ? '#fff' : '#9ca3af',
                                    }}
                                >
                                    {d === 'BUY' ? '▲ BUY' : '▼ SELL'}
                                </button>
                            ))}
                        </div>

                        <div>
                            <label style={s.label}>Execution type</label>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                {EXEC_TYPES.map(t => (
                                    <button
                                        key={t}
                                        onClick={() => {
                                            setExecType(t)
                                            if (t === 'Market') setEntryPrice(currentPrice || '')
                                        }}
                                        style={{
                                            flex: 1,
                                            padding: '5px 4px',
                                            fontSize: '11px',
                                            borderRadius: '6px',
                                            border: execType === t ? 'none' : '1px solid #e5e7eb',
                                            background: execType === t ? '#111827' : '#f9fafb',
                                            color: execType === t ? '#fff' : '#6b7280',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                            <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '4px' }}>
                                {execType === 'Market' && 'Fills immediately at current price'}
                                {execType === 'Limit' && 'Buys below / sells above current price'}
                                {execType === 'Stop' && 'Buys above / sells below current price'}
                            </div>
                        </div>

                        <div>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '4px',
                            }}>
                                <label style={{ ...s.label, margin: 0 }}>Entry price</label>
                                <button onClick={useCurrentPrice} style={s.quickBtn}>
                                    Use {currentPrice || 'live'}
                                </button>
                            </div>
                            <input
                                type="number"
                                value={entryPrice}
                                onChange={e => setEntryPrice(e.target.value)}
                                placeholder={execType === 'Market' ? currentPrice || 'Auto' : 'Set price'}
                                style={{
                                    ...s.input,
                                    background: execType === 'Market' ? '#f9fafb' : '#fff',
                                }}
                            />
                        </div>

                        <div>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '4px',
                            }}>
                                <label style={{ ...s.label, margin: 0 }}>Stop loss</label>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    {[10, 20, 30].map(p => (
                                        <button key={p} onClick={() => autoSL(p)} style={s.quickBtn}>
                                            -{p}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <input
                                type="number"
                                value={stopLoss}
                                onChange={e => setStopLoss(e.target.value)}
                                placeholder="e.g. 2030.00"
                                style={s.input}
                            />
                        </div>

                        <div>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '4px',
                            }}>
                                <label style={{ ...s.label, margin: 0 }}>Take profit</label>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    {[1, 2, 3].map(r => (
                                        <button key={r} onClick={() => autoTP(r)} style={s.quickBtn}>
                                            {r}R
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <input
                                type="number"
                                value={takeProfit}
                                onChange={e => setTakeProfit(e.target.value)}
                                placeholder="e.g. 2065.00"
                                style={s.input}
                            />
                        </div>

                        <div>
                            <button
                                onClick={() => setShowMultiTP(p => !p)}
                                style={{
                                    fontSize: '12px',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#6b7280',
                                    padding: 0,
                                    textDecoration: 'underline',
                                }}
                            >
                                {showMultiTP ? '− Remove TP2/TP3' : '+ Add TP2 / TP3'}
                            </button>

                            {showMultiTP && (
                                <div style={{
                                    marginTop: '8px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '8px',
                                }}>
                                    <input
                                        type="number"
                                        value={tp2}
                                        onChange={e => setTp2(e.target.value)}
                                        placeholder="TP2 price"
                                        style={s.input}
                                    />
                                    <input
                                        type="number"
                                        value={tp3}
                                        onChange={e => setTp3(e.target.value)}
                                        placeholder="TP3 price"
                                        style={s.input}
                                    />
                                </div>
                            )}
                        </div>

                        <div style={{
                            background: rr >= 2 ? '#f0fdf4' : rr >= 1 ? '#fef9c3' : rr > 0 ? '#fef2f2' : '#f9fafb',
                            border: `1px solid ${rr >= 2 ? '#bbf7d0' : rr >= 1 ? '#fde047' : rr > 0 ? '#fca5a5' : '#e5e7eb'}`,
                            borderRadius: '10px',
                            padding: '10px 12px',
                        }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '6px',
                            }}>
                                <span style={{ fontSize: '12px', color: '#6b7280' }}>Risk : Reward</span>
                                <span style={{ fontSize: '16px', fontWeight: 700, color: rrColor }}>
                                    {rr > 0 ? `1 : ${rr}` : '--'}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                                <span style={{ color: '#dc2626' }}>
                                    Risk: {potentialLoss > 0 ? `-$${potentialLoss}` : '--'}
                                </span>
                                <span style={{ color: '#16a34a' }}>
                                    Reward: {potentialGain > 0 ? `+$${potentialGain}` : '--'}
                                </span>
                            </div>
                            {rr > 0 && rr < 1.5 && (
                                <div style={{
                                    marginTop: '6px',
                                    fontSize: '11px',
                                    color: '#b91c1c',
                                }}>
                                    ⚠ Below recommended 1:2 minimum
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <div>
                                <label style={s.label}>Lot size</label>
                                <input
                                    type="number"
                                    value={lotSize}
                                    onChange={e => setLotSize(e.target.value)}
                                    step="0.01"
                                    style={s.input}
                                />
                            </div>
                            <div>
                                <label style={s.label}>Timeframe</label>
                                <select
                                    value={timeframe}
                                    onChange={e => setTimeframe(e.target.value)}
                                    style={s.input}
                                >
                                    {TIMEFRAMES.map(tf => (
                                        <option key={tf} value={tf}>{tf}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label style={s.label}>Notes</label>
                            <textarea
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                placeholder="Why this trade?"
                                rows={2}
                                style={{ ...s.input, resize: 'none', fontFamily: 'inherit' }}
                            />
                        </div>

                        {deviations.length > 0 && (
                            <div style={{
                                background: '#fef9c3',
                                border: '1px solid #fde047',
                                borderRadius: '8px',
                                padding: '10px 12px',
                            }}>
                                <div style={{ fontSize: '12px', fontWeight: 600, color: '#854d0e', marginBottom: '5px' }}>
                                    Strategy deviations
                                </div>
                                {deviations.map((d, i) => (
                                    <div key={i} style={{ fontSize: '12px', color: '#92400e', marginBottom: '3px' }}>
                                        • {d}
                                    </div>
                                ))}
                            </div>
                        )}

                        {error && (
                            <div style={{
                                background: '#fef2f2', border: '1px solid #fca5a5',
                                borderRadius: '8px', padding: '8px 12px',
                                fontSize: '12px', color: '#b91c1c',
                            }}>
                                {error}
                            </div>
                        )}

                        <button
                            onClick={placeTrade}
                            disabled={loading || !stopLoss || !takeProfit}
                            style={{
                                width: '100%', padding: '11px',
                                fontSize: '13px', fontWeight: 700,
                                borderRadius: '8px', border: 'none',
                                cursor: loading || !stopLoss || !takeProfit
                                    ? 'not-allowed' : 'pointer',
                                background: direction === 'BUY' ? '#16a34a' : '#dc2626',
                                color: '#fff',
                                opacity: loading || !stopLoss || !takeProfit ? 0.6 : 1,
                            }}
                        >
                            {loading
                                ? 'Placing...'
                                : `${execType} ${direction} ${execType !== 'Market' ? `@ ${entryPrice || '--'}` : ''}`}
                        </button>
                    </>
                )}

                {activeSection === 'manage' && (
                    <>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#111', marginBottom: '4px' }}>
                            Risk calculator
                        </div>

                        <div>
                            <label style={s.label}>Risk mode</label>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                {['lot', 'percent'].map(m => (
                                    <button
                                        key={m}
                                        onClick={() => setRiskMode(m)}
                                        style={{
                                            flex: 1, padding: '6px',
                                            fontSize: '12px', borderRadius: '7px',
                                            border: riskMode === m ? 'none' : '1px solid #e5e7eb',
                                            background: riskMode === m ? '#111827' : '#f9fafb',
                                            color: riskMode === m ? '#fff' : '#6b7280',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        {m === 'lot' ? 'Fixed lot' : '% of balance'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {riskMode === 'percent' && (
                            <>
                                <div>
                                    <label style={s.label}>Account balance ($)</label>
                                    <input type="number" placeholder="10000" style={s.input}
                                        id="calc-balance" />
                                </div>
                                <div>
                                    <label style={s.label}>Risk percent (%)</label>
                                    <input
                                        type="number"
                                        value={riskPercent}
                                        onChange={e => setRiskPercent(e.target.value)}
                                        placeholder="1"
                                        style={s.input}
                                    />
                                </div>
                                <div>
                                    <label style={s.label}>Stop loss distance (pips)</label>
                                    <input
                                        type="number"
                                        placeholder="e.g. 20"
                                        style={s.input}
                                        id="calc-sl-pips"
                                        onChange={e => {
                                            const bal = parseFloat(document.getElementById('calc-balance')?.value) || 10000
                                            const risk = parseFloat(riskPercent) || 1
                                            const slPips = parseFloat(e.target.value) || 1
                                            const riskAmt = (bal * risk) / 100
                                            const lot = (riskAmt / (slPips * 100)).toFixed(2)
                                            document.getElementById('calc-lot-result').textContent = lot
                                        }}
                                    />
                                </div>
                                <div style={{
                                    background: '#f0fdf4',
                                    border: '1px solid #bbf7d0',
                                    borderRadius: '10px',
                                    padding: '12px',
                                    textAlign: 'center',
                                }}>
                                    <div style={{ fontSize: '12px', color: '#15803d', marginBottom: '4px' }}>
                                        Recommended lot size
                                    </div>
                                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#16a34a' }}
                                        id="calc-lot-result">
                                        --
                                    </div>
                                </div>
                            </>
                        )}

                        {riskMode === 'lot' && (
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                            }}>
                                {[0.01, 0.05, 0.1, 0.25, 0.5, 1.0].map(l => (
                                    <button
                                        key={l}
                                        onClick={() => {
                                            setLotSize(String(l))
                                            setActiveSection('entry')
                                        }}
                                        style={{
                                            padding: '10px',
                                            fontSize: '13px',
                                            borderRadius: '8px',
                                            border: lotSize === String(l)
                                                ? '2px solid #111827'
                                                : '1px solid #e5e7eb',
                                            background: lotSize === String(l) ? '#111827' : '#f9fafb',
                                            color: lotSize === String(l) ? '#fff' : '#374151',
                                            cursor: 'pointer',
                                            fontWeight: 500,
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                        }}
                                    >
                                        <span>{l} lot</span>
                                        <span style={{
                                            fontSize: '11px',
                                            opacity: 0.7,
                                        }}>
                                            {l < 0.1 ? 'Micro' : l < 0.5 ? 'Mini' : 'Standard'}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}