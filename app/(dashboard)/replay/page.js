export default function ReplayPage() {
    return (
        <div style={{
            height: '100%', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: '12px',
        }}>
            <div style={{
                width: '52px', height: '52px',
                background: '#f3f4f6', borderRadius: '14px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M9 8l7 4-7 4V8z" fill="#9ca3af" stroke="none" />
                </svg>
            </div>
            <p style={{ fontSize: '14px', color: '#9ca3af' }}>
                Replay mode — use the Backtest page for full replay
            </p>
        </div>
    )
}