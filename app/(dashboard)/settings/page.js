'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const CURRENCY_PAIRS = ['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD']
const STRATEGIES = ['Supply & Demand', 'CRT', 'ICT', 'Price Action', 'Scalping', 'Swing Trading', 'Custom']

export default function SettingsPage() {
    const router = useRouter()
    const [workspaces, setWorkspaces] = useState([])
    const [selected, setSelected] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [showNew, setShowNew] = useState(false)
    const [activeTab, setActiveTab] = useState('workspace')
    const [mt5Connected, setMt5Connected] = useState(false)
    const [mt5Info, setMt5Info] = useState({ workspaceId: '', userId: '' })

    const [form, setForm] = useState({
        name: '',
        strategy: 'Supply & Demand',
        currencyPair: 'XAUUSD',
        startDate: '',
        endDate: '',
        startingBalance: 10000,
        rules: [],
    })

    const [newRule, setNewRule] = useState('')
    const [newWs, setNewWs] = useState({
        name: '',
        strategy: 'Supply & Demand',
        currencyPair: 'XAUUSD',
        startDate: '',
        endDate: '',
        startingBalance: 10000,
        rules: [],
    })
    const [newWsRule, setNewWsRule] = useState('')

    useEffect(() => {
        loadWorkspaces()
    }, [])

    const loadWorkspaces = () => {
        setLoading(true)
        fetch('/api/workspaces')
            .then(r => r.json())
            .then(d => {
                setWorkspaces(d.workspaces || [])
                if (d.workspaces?.length > 0 && !selected) {
                    const ws = d.workspaces[0]
                    setSelected(ws)
                    setForm({
                        name: ws.name,
                        strategy: ws.strategy,
                        currencyPair: ws.currencyPair || 'XAUUSD',
                        startDate: ws.startDate || '',
                        endDate: ws.endDate || '',
                        startingBalance: ws.startingBalance || 10000,
                        rules: ws.rules || [],
                    })
                    setMt5Info({ workspaceId: ws._id, userId: '' })
                }
                setLoading(false)
            })
    }

    const selectWorkspace = (ws) => {
        setSelected(ws)
        setShowNew(false)
        setForm({
            name: ws.name,
            strategy: ws.strategy,
            currencyPair: ws.currencyPair || 'XAUUSD',
            startDate: ws.startDate || '',
            endDate: ws.endDate || '',
            startingBalance: ws.startingBalance || 10000,
            rules: ws.rules || [],
        })
        setMt5Info({ workspaceId: ws._id, userId: '' })
    }

    const saveWorkspace = async () => {
        if (!selected) return
        setSaving(true)
        try {
            const res = await fetch(`/api/workspaces/${selected._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })
            if (res.ok) {
                loadWorkspaces()
            }
        } finally {
            setSaving(false)
        }
    }

    const deleteWorkspace = async () => {
        if (!selected) return
        if (!confirm(`Delete "${selected.name}"? This will also delete all trades and journal entries in this workspace.`)) return
        setDeleting(true)
        try {
            await fetch(`/api/workspaces/${selected._id}`, { method: 'DELETE' })
            setSelected(null)
            loadWorkspaces()
        } finally {
            setDeleting(false)
        }
    }

    const createWorkspace = async () => {
        if (!newWs.name.trim()) return
        setSaving(true)
        try {
            const res = await fetch('/api/workspaces', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newWs),
            })
            if (res.ok) {
                setShowNew(false)
                setNewWs({
                    name: '', strategy: 'Supply & Demand',
                    currencyPair: 'XAUUSD', startDate: '',
                    endDate: '', startingBalance: 10000, rules: [],
                })
                loadWorkspaces()
            }
        } finally {
            setSaving(false)
        }
    }

    const addRule = () => {
        if (!newRule.trim()) return
        setForm(f => ({ ...f, rules: [...f.rules, newRule.trim()] }))
        setNewRule('')
    }

    const removeRule = (i) => {
        setForm(f => ({ ...f, rules: f.rules.filter((_, idx) => idx !== i) }))
    }

    const addNewWsRule = () => {
        if (!newWsRule.trim()) return
        setNewWs(f => ({ ...f, rules: [...f.rules, newWsRule.trim()] }))
        setNewWsRule('')
    }

    const removeNewWsRule = (i) => {
        setNewWs(f => ({ ...f, rules: f.rules.filter((_, idx) => idx !== i) }))
    }

    const inputStyle = {
        width: '100%',
        padding: '8px 12px',
        fontSize: '13px',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        outline: 'none',
        background: '#fff',
        color: '#111',
    }

    const labelStyle = {
        fontSize: '12px',
        color: '#6b7280',
        marginBottom: '5px',
        display: 'block',
    }

    const sectionTitle = (title) => (
        <div style={{
            fontSize: '13px',
            fontWeight: 600,
            color: '#111',
            marginBottom: '12px',
            paddingBottom: '8px',
            borderBottom: '1px solid #f3f4f6',
        }}>
            {title}
        </div>
    )

    const tabs = [
        { key: 'workspace', label: 'Workspaces' },
        { key: 'mt5', label: 'MT5 Bridge' },
        { key: 'features', label: 'Features' },
    ]

    return (
        <div style={{
            display: 'flex',
            height: '100%',
            overflow: 'hidden',
        }}>
            <div style={{
                width: '240px',
                background: '#fff',
                borderRight: '1px solid #e5e7eb',
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0,
            }}>
                <div style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid #e5e7eb',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#111',
                    flexShrink: 0,
                }}>
                    Settings
                </div>

                <div style={{
                    padding: '8px',
                    borderBottom: '1px solid #e5e7eb',
                    flexShrink: 0,
                }}>
                    {tabs.map(t => (
                        <button
                            key={t.key}
                            onClick={() => setActiveTab(t.key)}
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                fontSize: '13px',
                                textAlign: 'left',
                                border: 'none',
                                borderRadius: '7px',
                                cursor: 'pointer',
                                background: activeTab === t.key ? '#111827' : 'transparent',
                                color: activeTab === t.key ? '#fff' : '#6b7280',
                                fontWeight: activeTab === t.key ? 500 : 400,
                                marginBottom: '2px',
                            }}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {activeTab === 'workspace' && (
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        <div style={{ padding: '8px' }}>
                            {workspaces.map(ws => (
                                <div
                                    key={ws._id}
                                    onClick={() => selectWorkspace(ws)}
                                    style={{
                                        padding: '10px 12px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        background: selected?._id === ws._id ? '#f9fafb' : 'transparent',
                                        borderLeft: selected?._id === ws._id
                                            ? '3px solid #111827'
                                            : '3px solid transparent',
                                        marginBottom: '2px',
                                    }}
                                >
                                    <div style={{ fontSize: '13px', fontWeight: 500, color: '#111' }}>
                                        {ws.name}
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                                        {ws.strategy} · {ws.currencyPair}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ padding: '8px' }}>
                            <button
                                onClick={() => { setShowNew(true); setSelected(null) }}
                                style={{
                                    width: '100%',
                                    padding: '9px',
                                    fontSize: '13px',
                                    border: '1px dashed #e5e7eb',
                                    borderRadius: '8px',
                                    background: 'transparent',
                                    color: '#6b7280',
                                    cursor: 'pointer',
                                }}
                            >
                                + New workspace
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '24px',
                background: '#f9fafb',
            }}>

                {activeTab === 'workspace' && selected && !showNew && (
                    <div style={{ maxWidth: '560px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{
                            background: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '12px',
                            padding: '20px',
                        }}>
                            {sectionTitle('Workspace details')}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <div>
                                    <label style={labelStyle}>Workspace name</label>
                                    <input
                                        value={form.name}
                                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                        style={inputStyle}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div>
                                        <label style={labelStyle}>Strategy</label>
                                        <select
                                            value={form.strategy}
                                            onChange={e => setForm(f => ({ ...f, strategy: e.target.value }))}
                                            style={inputStyle}
                                        >
                                            {STRATEGIES.map(s => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Currency pair</label>
                                        <select
                                            value={form.currencyPair}
                                            onChange={e => setForm(f => ({ ...f, currencyPair: e.target.value }))}
                                            style={inputStyle}
                                        >
                                            {CURRENCY_PAIRS.map(p => (
                                                <option key={p} value={p}>{p}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div>
                                        <label style={labelStyle}>Backtest start date</label>
                                        <input
                                            type="date"
                                            value={form.startDate}
                                            onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                                            style={inputStyle}
                                        />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Backtest end date</label>
                                        <input
                                            type="date"
                                            value={form.endDate}
                                            onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                                            style={inputStyle}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label style={labelStyle}>Starting balance ($)</label>
                                    <input
                                        type="number"
                                        value={form.startingBalance}
                                        onChange={e => setForm(f => ({ ...f, startingBalance: parseFloat(e.target.value) }))}
                                        style={inputStyle}
                                    />
                                </div>
                            </div>
                        </div>

                        <div style={{
                            background: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '12px',
                            padding: '20px',
                        }}>
                            {sectionTitle('Strategy rules')}
                            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '14px', lineHeight: '1.5' }}>
                                Define your strategy rules. The AI will warn you whenever a trade deviates from these rules.
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                                {form.rules.map((rule, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            padding: '9px 12px',
                                            background: '#f9fafb',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '8px',
                                        }}
                                    >
                                        <span style={{ fontSize: '13px', color: '#374151', flex: 1 }}>
                                            {rule}
                                        </span>
                                        <button
                                            onClick={() => removeRule(i)}
                                            style={{
                                                background: 'none', border: 'none',
                                                cursor: 'pointer', color: '#9ca3af',
                                                fontSize: '16px', padding: '0 4px',
                                                flexShrink: 0,
                                            }}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    value={newRule}
                                    onChange={e => setNewRule(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && addRule()}
                                    placeholder="e.g. Only trade at supply zones"
                                    style={{ ...inputStyle, flex: 1 }}
                                />
                                <button
                                    onClick={addRule}
                                    style={{
                                        padding: '8px 14px',
                                        background: '#111827', color: '#fff',
                                        border: 'none', borderRadius: '8px',
                                        fontSize: '13px', cursor: 'pointer',
                                        whiteSpace: 'nowrap', flexShrink: 0,
                                    }}
                                >
                                    Add rule
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={saveWorkspace}
                                disabled={saving}
                                style={{
                                    flex: 1,
                                    padding: '11px',
                                    background: '#111827', color: '#fff',
                                    border: 'none', borderRadius: '8px',
                                    fontSize: '13px', fontWeight: 500,
                                    cursor: saving ? 'not-allowed' : 'pointer',
                                    opacity: saving ? 0.6 : 1,
                                }}
                            >
                                {saving ? 'Saving...' : 'Save changes'}
                            </button>
                            <button
                                onClick={deleteWorkspace}
                                disabled={deleting || workspaces.length <= 1}
                                style={{
                                    padding: '11px 20px',
                                    background: '#fff', color: '#dc2626',
                                    border: '1px solid #fca5a5',
                                    borderRadius: '8px',
                                    fontSize: '13px',
                                    cursor: deleting || workspaces.length <= 1 ? 'not-allowed' : 'pointer',
                                    opacity: deleting || workspaces.length <= 1 ? 0.5 : 1,
                                }}
                            >
                                {deleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'workspace' && showNew && (
                    <div style={{ maxWidth: '560px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{
                            background: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '12px',
                            padding: '20px',
                        }}>
                            {sectionTitle('New workspace')}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <div>
                                    <label style={labelStyle}>Workspace name</label>
                                    <input
                                        value={newWs.name}
                                        onChange={e => setNewWs(f => ({ ...f, name: e.target.value }))}
                                        placeholder="e.g. CRT Strategy"
                                        style={inputStyle}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div>
                                        <label style={labelStyle}>Strategy</label>
                                        <select
                                            value={newWs.strategy}
                                            onChange={e => setNewWs(f => ({ ...f, strategy: e.target.value }))}
                                            style={inputStyle}
                                        >
                                            {STRATEGIES.map(s => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Currency pair</label>
                                        <select
                                            value={newWs.currencyPair}
                                            onChange={e => setNewWs(f => ({ ...f, currencyPair: e.target.value }))}
                                            style={inputStyle}
                                        >
                                            {CURRENCY_PAIRS.map(p => (
                                                <option key={p} value={p}>{p}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div>
                                        <label style={labelStyle}>Start date</label>
                                        <input
                                            type="date"
                                            value={newWs.startDate}
                                            onChange={e => setNewWs(f => ({ ...f, startDate: e.target.value }))}
                                            style={inputStyle}
                                        />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>End date</label>
                                        <input
                                            type="date"
                                            value={newWs.endDate}
                                            onChange={e => setNewWs(f => ({ ...f, endDate: e.target.value }))}
                                            style={inputStyle}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label style={labelStyle}>Starting balance ($)</label>
                                    <input
                                        type="number"
                                        value={newWs.startingBalance}
                                        onChange={e => setNewWs(f => ({ ...f, startingBalance: parseFloat(e.target.value) }))}
                                        style={inputStyle}
                                    />
                                </div>

                                <div>
                                    <label style={labelStyle}>Strategy rules</label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
                                        {newWs.rules.map((rule, i) => (
                                            <div
                                                key={i}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '10px',
                                                    padding: '8px 12px',
                                                    background: '#f9fafb', border: '1px solid #e5e7eb',
                                                    borderRadius: '8px',
                                                }}
                                            >
                                                <span style={{ fontSize: '13px', color: '#374151', flex: 1 }}>{rule}</span>
                                                <button
                                                    onClick={() => removeNewWsRule(i)}
                                                    style={{
                                                        background: 'none', border: 'none',
                                                        cursor: 'pointer', color: '#9ca3af', fontSize: '16px',
                                                    }}
                                                >×</button>
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <input
                                            value={newWsRule}
                                            onChange={e => setNewWsRule(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && addNewWsRule()}
                                            placeholder="e.g. Only trade 1H and above"
                                            style={{ ...inputStyle, flex: 1 }}
                                        />
                                        <button
                                            onClick={addNewWsRule}
                                            style={{
                                                padding: '8px 14px',
                                                background: '#111827', color: '#fff',
                                                border: 'none', borderRadius: '8px',
                                                fontSize: '13px', cursor: 'pointer',
                                                flexShrink: 0,
                                            }}
                                        >
                                            Add
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={createWorkspace}
                                disabled={saving || !newWs.name.trim()}
                                style={{
                                    flex: 1, padding: '11px',
                                    background: '#111827', color: '#fff',
                                    border: 'none', borderRadius: '8px',
                                    fontSize: '13px', fontWeight: 500,
                                    cursor: saving || !newWs.name.trim() ? 'not-allowed' : 'pointer',
                                    opacity: saving || !newWs.name.trim() ? 0.6 : 1,
                                }}
                            >
                                {saving ? 'Creating...' : 'Create workspace'}
                            </button>
                            <button
                                onClick={() => setShowNew(false)}
                                style={{
                                    padding: '11px 20px',
                                    background: '#fff', color: '#6b7280',
                                    border: '1px solid #e5e7eb', borderRadius: '8px',
                                    fontSize: '13px', cursor: 'pointer',
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'mt5' && (
                    <div style={{ maxWidth: '560px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{
                            background: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '12px',
                            padding: '20px',
                        }}>
                            {sectionTitle('MT5 bridge setup')}
                            <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.6', marginBottom: '16px' }}>
                                Connect your MT5 terminal to TradeFlow. Every trade you open or close in MT5 will be automatically journaled and analysed by AI here.
                            </p>

                            <div style={{
                                background: '#f9fafb',
                                border: '1px solid #e5e7eb',
                                borderRadius: '10px',
                                padding: '14px 16px',
                                marginBottom: '16px',
                            }}>
                                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '10px', fontWeight: 500 }}>
                                    Your bridge endpoint
                                </div>
                                <code style={{
                                    fontSize: '12px',
                                    color: '#111',
                                    background: '#111827',
                                    color: '#4ade80',
                                    padding: '8px 12px',
                                    borderRadius: '6px',
                                    display: 'block',
                                    wordBreak: 'break-all',
                                }}>
                                    POST https://your-domain.com/api/mt5
                                </code>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div>
                                    <label style={labelStyle}>Secret key (add to your EA)</label>
                                    <input
                                        value={process.env.NEXT_PUBLIC_MT5_SECRET || 'tradeflow_mt5_secret_change_this'}
                                        readOnly
                                        style={{ ...inputStyle, background: '#f9fafb', color: '#6b7280' }}
                                    />
                                </div>

                                <div>
                                    <label style={labelStyle}>Workspace ID to link</label>
                                    <select
                                        value={mt5Info.workspaceId}
                                        onChange={e => setMt5Info(f => ({ ...f, workspaceId: e.target.value }))}
                                        style={inputStyle}
                                    >
                                        {workspaces.map(ws => (
                                            <option key={ws._id} value={ws._id}>{ws.name}</option>
                                        ))}
                                    </select>
                                    <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                                        Copy this ID into your EA: <strong>{mt5Info.workspaceId}</strong>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{
                            background: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '12px',
                            padding: '20px',
                        }}>
                            {sectionTitle('MT5 Expert Advisor code')}
                            <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.6', marginBottom: '14px' }}>
                                Copy this MQL5 code into your MT5 Expert Advisor. It will automatically send every trade to TradeFlow.
                            </p>
                            <pre style={{
                                background: '#0d0d1a',
                                color: '#4ade80',
                                padding: '16px',
                                borderRadius: '10px',
                                fontSize: '11px',
                                lineHeight: '1.7',
                                overflowX: 'auto',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                            }}>{`// TradeFlow MT5 Bridge EA
// Paste this in your Expert Advisor

#include <Trade\\Trade.mqh>

string TRADEFLOW_URL    = "https://your-domain.com/api/mt5";
string MT5_SECRET       = "tradeflow_mt5_secret_change_this";
string WORKSPACE_ID     = "${mt5Info.workspaceId || 'paste-workspace-id-here'}";
string USER_ID          = "paste-your-user-id-here";

int OnInit() {
  EventSetTimer(5);
  return(INIT_SUCCEEDED);
}

void OnTimer() {
  CheckTrades();
}

void CheckTrades() {
  for(int i = PositionsTotal() - 1; i >= 0; i--) {
    ulong ticket = PositionGetTicket(i);
    if(ticket <= 0) continue;
    if(PositionGetString(POSITION_SYMBOL) != Symbol()) continue;
    
    string dir = PositionGetInteger(POSITION_TYPE) == 0 ? "BUY" : "SELL";
    double entry   = PositionGetDouble(POSITION_PRICE_OPEN);
    double sl      = PositionGetDouble(POSITION_SL);
    double tp      = PositionGetDouble(POSITION_TP);
    double lots    = PositionGetDouble(POSITION_VOLUME);
    datetime oTime = (datetime)PositionGetInteger(POSITION_TIME);
    
    string body = StringFormat(
      "{\\"action\\":\\"open\\",\\"ticket\\":%d,\\"symbol\\":\\"%s\\","
      "\\"direction\\":\\"%s\\",\\"entryPrice\\":%.5f,"
      "\\"stopLoss\\":%.5f,\\"takeProfit\\":%.5f,"
      "\\"lotSize\\":%.2f,\\"openTime\\":\\"%s\\","
      "\\"workspaceId\\":\\"%s\\",\\"userId\\":\\"%s\\"}",
      ticket, Symbol(), dir, entry, sl, tp, lots,
      TimeToString(oTime, TIME_DATE|TIME_SECONDS),
      WORKSPACE_ID, USER_ID
    );
    
    SendToTradeFlow(body);
  }
}

void OnTradeTransaction(
  const MqlTradeTransaction &trans,
  const MqlTradeRequest &request,
  const MqlTradeResult &result
) {
  if(trans.type == TRADE_TRANSACTION_DEAL_ADD) {
    if(trans.deal_type == DEAL_TYPE_BUY ||
       trans.deal_type == DEAL_TYPE_SELL) {
      
      ulong ticket  = trans.deal;
      double price  = trans.price;
      double profit = trans.profit;
      datetime cTime = trans.time;
      
      string body = StringFormat(
        "{\\"action\\":\\"close\\",\\"ticket\\":%d,"
        "\\"exitPrice\\":%.5f,\\"pnl\\":%.2f,"
        "\\"closeTime\\":\\"%s\\","
        "\\"workspaceId\\":\\"%s\\",\\"userId\\":\\"%s\\"}",
        ticket, price, profit,
        TimeToString(cTime, TIME_DATE|TIME_SECONDS),
        WORKSPACE_ID, USER_ID
      );
      
      SendToTradeFlow(body);
    }
  }
}

void SendToTradeFlow(string body) {
  string headers = "Content-Type: application/json\\r\\n"
                   "x-mt5-secret: " + MT5_SECRET + "\\r\\n";
  char post[];
  char result[];
  string resultHeaders;
  
  StringToCharArray(body, post, 0, StringLen(body));
  
  int res = WebRequest(
    "POST",
    TRADEFLOW_URL,
    headers,
    5000,
    post,
    result,
    resultHeaders
  );
  
  if(res == -1) {
    Print("TradeFlow bridge error: ", GetLastError());
  }
}`}</pre>

                            <div style={{
                                marginTop: '14px',
                                background: '#fef9c3',
                                border: '1px solid #fde047',
                                borderRadius: '8px',
                                padding: '12px 14px',
                            }}>
                                <div style={{ fontSize: '12px', fontWeight: 600, color: '#854d0e', marginBottom: '5px' }}>
                                    Important setup steps in MT5
                                </div>
                                <div style={{ fontSize: '12px', color: '#92400e', lineHeight: '1.6' }}>
                                    1. In MT5 go to Tools → Options → Expert Advisors<br />
                                    2. Check "Allow WebRequest for listed URL"<br />
                                    3. Add your TradeFlow URL to the list<br />
                                    4. Replace your-domain.com with your actual Vercel URL after deployment
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'features' && (
                    <div style={{ maxWidth: '560px' }}>
                        <div style={{
                            background: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '12px',
                            padding: '20px',
                        }}>
                            {sectionTitle('Feature toggles')}
                            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px', lineHeight: '1.5' }}>
                                Toggle platform features on or off. Settings are saved locally.
                            </p>

                            {[
                                { key: 'ai_analysis', label: 'AI trade analysis', desc: 'Automatically analyse each trade using AI after it closes' },
                                { key: 'auto_journal', label: 'Auto journaling', desc: 'Automatically create journal entries when trades are opened and closed' },
                                { key: 'deviation_warnings', label: 'Strategy deviation warnings', desc: 'Warn when a trade breaks your defined strategy rules' },
                                { key: 'screenshot', label: 'Auto screenshot', desc: 'Capture the chart automatically when a trade is placed' },
                                { key: 'mt5_bridge', label: 'MT5 bridge', desc: 'Receive and journal trades from MetaTrader 5' },
                                { key: 'replay_mode', label: 'Replay mode', desc: 'Enable the candle-by-candle replay engine on the backtest chart' },
                            ].map(feature => {
                                const key = `tf_feature_${feature.key}`
                                const enabled = typeof window !== 'undefined'
                                    ? localStorage.getItem(key) !== 'false'
                                    : true

                                return (
                                    <FeatureToggle
                                        key={feature.key}
                                        label={feature.label}
                                        desc={feature.desc}
                                        storageKey={key}
                                        defaultEnabled={enabled}
                                    />
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

function FeatureToggle({ label, desc, storageKey, defaultEnabled }) {
    const [on, setOn] = useState(defaultEnabled)

    const toggle = () => {
        const next = !on
        setOn(next)
        localStorage.setItem(storageKey, String(next))
    }

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 0',
            borderBottom: '1px solid #f3f4f6',
        }}>
            <div style={{ flex: 1, paddingRight: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 500, color: '#111' }}>{label}</div>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>{desc}</div>
            </div>
            <div
                onClick={toggle}
                style={{
                    width: '40px', height: '22px',
                    borderRadius: '11px',
                    background: on ? '#111827' : '#e5e7eb',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    flexShrink: 0,
                }}
            >
                <div style={{
                    width: '16px', height: '16px',
                    borderRadius: '50%',
                    background: '#fff',
                    position: 'absolute',
                    top: '3px',
                    left: on ? '21px' : '3px',
                    transition: 'left 0.2s',
                }} />
            </div>
        </div>
    )
}