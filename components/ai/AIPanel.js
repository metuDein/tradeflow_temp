'use client'
import { useState } from 'react'

export default function AIPanel({ trade, workspaceId }) {
    const [summary, setSummary] = useState('')
    const [loading, setLoading] = useState(false)

    const getSummary = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/ai/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'summary', workspaceId }),
            })
            const data = await res.json()
            setSummary(data.analysis)
        } catch {
            setSummary('Failed to get AI summary. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            overflow: 'hidden',
        }}>
            <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                        width: '8px', height: '8px',
                        borderRadius: '50%',
                        background: '#4ade80',
                    }} />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#111' }}>
                        AI analysis
                    </span>
                </div>
                <button
                    onClick={getSummary}
                    disabled={loading}
                    style={{
                        fontSize: '12px',
                        background: '#111827',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '4px 10px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.6 : 1,
                    }}
                >
                    {loading ? 'Analysing...' : 'Get summary'}
                </button>
            </div>

            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {trade?.deviations?.length > 0 && (
                    <div style={{
                        background: '#fef9c3',
                        border: '1px solid #fde047',
                        borderRadius: '8px',
                        padding: '10px 12px',
                    }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#854d0e', marginBottom: '5px' }}>
                            Strategy deviations
                        </div>
                        {trade.deviations.map((d, i) => (
                            <div key={i} style={{ fontSize: '12px', color: '#92400e', marginBottom: '3px' }}>
                                • {d}
                            </div>
                        ))}
                    </div>
                )}

                {trade?.aiAnalysis && (
                    <div style={{
                        background: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: '8px',
                        padding: '10px 12px',
                    }}>
                        <div style={{ fontSize: '11px', color: '#15803d', fontWeight: 600, marginBottom: '5px' }}>
                            Last trade analysis
                        </div>
                        <div style={{ fontSize: '13px', color: '#166534', lineHeight: '1.6' }}>
                            {trade.aiAnalysis}
                        </div>
                    </div>
                )}

                {summary && (
                    <div style={{
                        background: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        borderRadius: '8px',
                        padding: '10px 12px',
                    }}>
                        <div style={{ fontSize: '11px', color: '#1d4ed8', fontWeight: 600, marginBottom: '5px' }}>
                            Session summary
                        </div>
                        <div style={{ fontSize: '13px', color: '#1e3a8a', lineHeight: '1.6' }}>
                            {summary}
                        </div>
                    </div>
                )}

                {!trade?.aiAnalysis && !summary && (
                    <div style={{
                        textAlign: 'center',
                        padding: '20px',
                        color: '#9ca3af',
                        fontSize: '13px',
                    }}>
                        Place and close a trade to get AI analysis
                    </div>
                )}
            </div>
        </div>
    )
}