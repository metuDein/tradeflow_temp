'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

const MOODS = ['confident', 'uncertain', 'neutral', 'anxious']

const moodColor = (mood) => ({
    confident: { bg: '#dcfce7', text: '#15803d' },
    uncertain: { bg: '#fef9c3', text: '#854d0e' },
    neutral: { bg: '#f3f4f6', text: '#374151' },
    anxious: { bg: '#fee2e2', text: '#b91c1c' },
}[mood] || { bg: '#f3f4f6', text: '#374151' })

const outcomeColor = (outcome) => ({
    win: { bg: '#dcfce7', text: '#15803d' },
    loss: { bg: '#fee2e2', text: '#b91c1c' },
    breakeven: { bg: '#f3f4f6', text: '#374151' },
}[outcome] || { bg: '#f3f4f6', text: '#374151' })

export default function JournalPage() {
    const { data: session } = useSession()
    const [entries, setEntries] = useState([])
    const [loading, setLoading] = useState(true)
    const [workspaceId, setWorkspaceId] = useState('')
    const [workspaces, setWorkspaces] = useState([])
    const [selected, setSelected] = useState(null)
    const [showNew, setShowNew] = useState(false)
    const [form, setForm] = useState({ title: '', content: '', mood: 'neutral' })
    const [saving, setSaving] = useState(false)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [filter, setFilter] = useState('all')

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
        loadEntries()
    }, [workspaceId, page])

    const loadEntries = () => {
        setLoading(true)
        fetch(`/api/journal?workspaceId=${workspaceId}&page=${page}`)
            .then(r => r.json())
            .then(d => {
                setEntries(d.entries || [])
                setTotalPages(d.pages || 1)
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }

    const saveEntry = async () => {
        if (!form.content.trim()) return
        setSaving(true)
        try {
            const res = await fetch('/api/journal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, workspaceId }),
            })
            if (res.ok) {
                setForm({ title: '', content: '', mood: 'neutral' })
                setShowNew(false)
                loadEntries()
            }
        } finally {
            setSaving(false)
        }
    }

    const filtered = entries.filter(e => {
        if (filter === 'auto') return e.type === 'auto'
        if (filter === 'manual') return e.type === 'manual'
        return true
    })

    const formatDate = (d) => new Date(d).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    })

    return (
        <div style={{
            display: 'flex',
            height: '100%',
            overflow: 'hidden',
        }}>
            <div style={{
                width: '320px',
                borderRight: '1px solid #e5e7eb',
                display: 'flex',
                flexDirection: 'column',
                background: '#fff',
                flexShrink: 0,
            }}>
                <div style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexShrink: 0,
                }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#111' }}>Journal</div>
                    <button
                        onClick={() => { setShowNew(true); setSelected(null) }}
                        style={{
                            background: '#111827', color: '#fff',
                            border: 'none', borderRadius: '7px',
                            padding: '5px 12px', fontSize: '12px',
                            cursor: 'pointer',
                        }}
                    >
                        + New entry
                    </button>
                </div>

                <div style={{
                    padding: '10px 12px',
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    gap: '4px',
                    flexShrink: 0,
                }}>
                    {[
                        { key: 'all', label: 'All' },
                        { key: 'auto', label: 'Auto' },
                        { key: 'manual', label: 'Manual' },
                    ].map(f => (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key)}
                            style={{
                                padding: '4px 10px',
                                fontSize: '12px',
                                borderRadius: '6px',
                                border: filter === f.key ? '1px solid #e5e7eb' : 'none',
                                background: filter === f.key ? '#111827' : 'transparent',
                                color: filter === f.key ? '#fff' : '#6b7280',
                                cursor: 'pointer',
                            }}
                        >
                            {f.label}
                        </button>
                    ))}

                    {workspaces.length > 1 && (
                        <select
                            value={workspaceId}
                            onChange={e => setWorkspaceId(e.target.value)}
                            style={{
                                marginLeft: 'auto',
                                fontSize: '12px',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                padding: '3px 6px',
                                outline: 'none',
                            }}
                        >
                            {workspaces.map(ws => (
                                <option key={ws._id} value={ws._id}>{ws.name}</option>
                            ))}
                        </select>
                    )}
                </div>

                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {loading ? (
                        <div style={{
                            display: 'flex', alignItems: 'center',
                            justifyContent: 'center', height: '100px',
                            color: '#9ca3af', fontSize: '13px',
                        }}>
                            Loading...
                        </div>
                    ) : filtered.length === 0 ? (
                        <div style={{
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            height: '160px', gap: '8px',
                            color: '#9ca3af', fontSize: '13px',
                        }}>
                            <div>No journal entries yet</div>
                            <div style={{ fontSize: '12px' }}>Trades are auto-journaled when placed</div>
                        </div>
                    ) : (
                        filtered.map((entry) => (
                            <div
                                key={entry._id}
                                onClick={() => { setSelected(entry); setShowNew(false) }}
                                style={{
                                    padding: '12px 16px',
                                    borderBottom: '1px solid #f3f4f6',
                                    cursor: 'pointer',
                                    background: selected?._id === entry._id ? '#f9fafb' : '#fff',
                                    borderLeft: selected?._id === entry._id
                                        ? '3px solid #111827'
                                        : '3px solid transparent',
                                    transition: 'background 0.1s',
                                }}
                            >
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    marginBottom: '4px',
                                }}>
                                    <span style={{
                                        fontSize: '10px',
                                        padding: '2px 7px',
                                        borderRadius: '4px',
                                        fontWeight: 500,
                                        background: entry.type === 'auto' ? '#eff6ff' : '#f0fdf4',
                                        color: entry.type === 'auto' ? '#1d4ed8' : '#15803d',
                                    }}>
                                        {entry.type === 'auto' ? 'Auto' : 'Manual'}
                                    </span>

                                    {entry.tradeId?.outcome && (
                                        <span style={{
                                            fontSize: '10px',
                                            padding: '2px 7px',
                                            borderRadius: '4px',
                                            fontWeight: 500,
                                            background: outcomeColor(entry.tradeId.outcome).bg,
                                            color: outcomeColor(entry.tradeId.outcome).text,
                                        }}>
                                            {entry.tradeId.outcome.toUpperCase()}
                                        </span>
                                    )}

                                    {entry.mood && (
                                        <span style={{
                                            fontSize: '10px',
                                            padding: '2px 7px',
                                            borderRadius: '4px',
                                            background: moodColor(entry.mood).bg,
                                            color: moodColor(entry.mood).text,
                                        }}>
                                            {entry.mood}
                                        </span>
                                    )}
                                </div>

                                <div style={{
                                    fontSize: '13px', fontWeight: 500,
                                    color: '#111', marginBottom: '3px',
                                    overflow: 'hidden', textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}>
                                    {entry.title || 'Untitled'}
                                </div>
                                <div style={{
                                    fontSize: '12px', color: '#6b7280',
                                    overflow: 'hidden', textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}>
                                    {entry.content}
                                </div>
                                <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                                    {formatDate(entry.createdAt)}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {totalPages > 1 && (
                    <div style={{
                        padding: '10px 16px',
                        borderTop: '1px solid #e5e7eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexShrink: 0,
                    }}>
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            style={{
                                fontSize: '12px',
                                background: 'none',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                padding: '4px 10px',
                                cursor: page === 1 ? 'not-allowed' : 'pointer',
                                opacity: page === 1 ? 0.4 : 1,
                            }}
                        >
                            ← Prev
                        </button>
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>
                            {page} / {totalPages}
                        </span>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(p => p + 1)}
                            style={{
                                fontSize: '12px',
                                background: 'none',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                padding: '4px 10px',
                                cursor: page === totalPages ? 'not-allowed' : 'pointer',
                                opacity: page === totalPages ? 0.4 : 1,
                            }}
                        >
                            Next →
                        </button>
                    </div>
                )}
            </div>

            <div style={{
                flex: 1,
                background: '#f9fafb',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
            }}>
                {showNew && (
                    <div style={{ padding: '24px', maxWidth: '680px', width: '100%', margin: '0 auto' }}>
                        <div style={{
                            background: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '12px',
                            overflow: 'hidden',
                        }}>
                            <div style={{
                                padding: '14px 20px',
                                borderBottom: '1px solid #e5e7eb',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}>
                                <span style={{ fontSize: '14px', fontWeight: 600, color: '#111' }}>
                                    New journal entry
                                </span>
                                <button
                                    onClick={() => setShowNew(false)}
                                    style={{
                                        background: 'none', border: 'none',
                                        cursor: 'pointer', color: '#9ca3af', fontSize: '18px',
                                    }}
                                >
                                    ×
                                </button>
                            </div>

                            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <div>
                                    <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '5px' }}>
                                        Title
                                    </label>
                                    <input
                                        value={form.title}
                                        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                        placeholder="e.g. Reflection on today's session"
                                        style={{
                                            width: '100%', padding: '8px 12px',
                                            fontSize: '14px', border: '1px solid #e5e7eb',
                                            borderRadius: '8px', outline: 'none',
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '5px' }}>
                                        How are you feeling?
                                    </label>
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                        {MOODS.map(m => (
                                            <button
                                                key={m}
                                                onClick={() => setForm(f => ({ ...f, mood: m }))}
                                                style={{
                                                    padding: '5px 12px',
                                                    fontSize: '12px',
                                                    borderRadius: '20px',
                                                    border: form.mood === m
                                                        ? '1.5px solid #111827'
                                                        : '1px solid #e5e7eb',
                                                    background: form.mood === m
                                                        ? moodColor(m).bg
                                                        : '#fff',
                                                    color: form.mood === m
                                                        ? moodColor(m).text
                                                        : '#6b7280',
                                                    cursor: 'pointer',
                                                    fontWeight: form.mood === m ? 500 : 400,
                                                }}
                                            >
                                                {m}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '5px' }}>
                                        Entry
                                    </label>
                                    <textarea
                                        value={form.content}
                                        onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                                        placeholder="Write your thoughts, observations, lessons learned..."
                                        rows={8}
                                        style={{
                                            width: '100%', padding: '10px 12px',
                                            fontSize: '14px', border: '1px solid #e5e7eb',
                                            borderRadius: '8px', outline: 'none',
                                            resize: 'vertical', fontFamily: 'inherit',
                                            lineHeight: '1.6',
                                        }}
                                    />
                                </div>

                                <button
                                    onClick={saveEntry}
                                    disabled={saving || !form.content.trim()}
                                    style={{
                                        padding: '10px',
                                        background: '#111827', color: '#fff',
                                        border: 'none', borderRadius: '8px',
                                        fontSize: '13px', fontWeight: 500,
                                        cursor: saving || !form.content.trim() ? 'not-allowed' : 'pointer',
                                        opacity: saving || !form.content.trim() ? 0.6 : 1,
                                    }}
                                >
                                    {saving ? 'Saving...' : 'Save entry'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {selected && !showNew && (
                    <div style={{ padding: '24px', maxWidth: '680px', width: '100%', margin: '0 auto' }}>
                        <div style={{
                            background: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '12px',
                            overflow: 'hidden',
                        }}>
                            <div style={{
                                padding: '16px 20px',
                                borderBottom: '1px solid #e5e7eb',
                            }}>
                                <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                                    <span style={{
                                        fontSize: '11px', padding: '2px 8px',
                                        borderRadius: '4px', fontWeight: 500,
                                        background: selected.type === 'auto' ? '#eff6ff' : '#f0fdf4',
                                        color: selected.type === 'auto' ? '#1d4ed8' : '#15803d',
                                    }}>
                                        {selected.type === 'auto' ? 'Auto-journaled' : 'Manual entry'}
                                    </span>
                                    {selected.tradeId?.outcome && (
                                        <span style={{
                                            fontSize: '11px', padding: '2px 8px',
                                            borderRadius: '4px', fontWeight: 500,
                                            background: outcomeColor(selected.tradeId.outcome).bg,
                                            color: outcomeColor(selected.tradeId.outcome).text,
                                        }}>
                                            {selected.tradeId.outcome.toUpperCase()}
                                        </span>
                                    )}
                                    {selected.mood && (
                                        <span style={{
                                            fontSize: '11px', padding: '2px 8px',
                                            borderRadius: '4px',
                                            background: moodColor(selected.mood).bg,
                                            color: moodColor(selected.mood).text,
                                        }}>
                                            {selected.mood}
                                        </span>
                                    )}
                                </div>
                                <div style={{ fontSize: '18px', fontWeight: 600, color: '#111', marginBottom: '4px' }}>
                                    {selected.title || 'Untitled'}
                                </div>
                                <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                                    {formatDate(selected.createdAt)}
                                </div>
                            </div>

                            {selected.tradeId && (
                                <div style={{
                                    padding: '12px 20px',
                                    borderBottom: '1px solid #f3f4f6',
                                    background: '#f9fafb',
                                    display: 'flex',
                                    gap: '20px',
                                    flexWrap: 'wrap',
                                }}>
                                    {[
                                        ['Entry', selected.tradeId.entryPrice],
                                        ['Exit', selected.tradeId.exitPrice || '--'],
                                        ['P&L', selected.tradeId.pnl != null
                                            ? `${selected.tradeId.pnl >= 0 ? '+' : ''}$${selected.tradeId.pnl}`
                                            : '--'],
                                        ['R:R', selected.tradeId.riskRewardRatio
                                            ? `1:${selected.tradeId.riskRewardRatio}`
                                            : '--'],
                                    ].map(([label, val]) => (
                                        <div key={label}>
                                            <div style={{ fontSize: '11px', color: '#9ca3af' }}>{label}</div>
                                            <div style={{ fontSize: '14px', fontWeight: 600, color: '#111' }}>{val}</div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div style={{ padding: '20px' }}>
                                <p style={{
                                    fontSize: '14px', color: '#374151',
                                    lineHeight: '1.7', whiteSpace: 'pre-wrap', margin: 0,
                                }}>
                                    {selected.content}
                                </p>

                                {selected.aiSummary && (
                                    <div style={{
                                        marginTop: '20px',
                                        background: '#f0fdf4',
                                        border: '1px solid #bbf7d0',
                                        borderRadius: '10px',
                                        padding: '14px 16px',
                                    }}>
                                        <div style={{
                                            fontSize: '11px', color: '#15803d',
                                            fontWeight: 600, marginBottom: '8px',
                                            display: 'flex', alignItems: 'center', gap: '6px',
                                        }}>
                                            <div style={{
                                                width: '6px', height: '6px',
                                                borderRadius: '50%', background: '#4ade80',
                                            }} />
                                            AI analysis
                                        </div>
                                        <p style={{
                                            fontSize: '13px', color: '#166534',
                                            lineHeight: '1.6', margin: 0,
                                        }}>
                                            {selected.aiSummary}
                                        </p>
                                    </div>
                                )}

                                {selected.screenshot && (
                                    <div style={{ marginTop: '16px' }}>
                                        <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>
                                            Chart screenshot
                                        </div>
                                        <img
                                            src={selected.screenshot}
                                            alt="Trade screenshot"
                                            style={{
                                                width: '100%', borderRadius: '8px',
                                                border: '1px solid #e5e7eb',
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {!selected && !showNew && (
                    <div style={{
                        flex: 1, display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        gap: '10px',
                    }}>
                        <div style={{
                            width: '48px', height: '48px',
                            background: '#f3f4f6', borderRadius: '12px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                                <rect x="4" y="3" width="16" height="18" rx="2" />
                                <path d="M9 9h6M9 13h6M9 17h4" strokeLinecap="round" />
                            </svg>
                        </div>
                        <div style={{ fontSize: '14px', color: '#9ca3af' }}>
                            Select an entry or create a new one
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}