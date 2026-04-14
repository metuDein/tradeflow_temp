'use client'
import { useState, useRef, useEffect, useCallback } from 'react'

const TOOLS = [
    {
        key: 'cursor',
        label: 'Cursor',
        icon: (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 2l10 5-5 1-2 5-3-11z" fill="currentColor" />
            </svg>
        ),
    },
    {
        key: 'hline',
        label: 'Horizontal line',
        icon: (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <line x1="1" y1="7" x2="13" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="7" cy="7" r="1.5" fill="currentColor" />
            </svg>
        ),
    },
    {
        key: 'vline',
        label: 'Vertical line',
        icon: (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <line x1="7" y1="1" x2="7" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="7" cy="7" r="1.5" fill="currentColor" />
            </svg>
        ),
    },
    {
        key: 'rect',
        label: 'Rectangle / Zone',
        icon: (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="2" y="4" width="10" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
            </svg>
        ),
    },
    {
        key: 'trendline',
        label: 'Trend line',
        icon: (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <line x1="2" y1="12" x2="12" y2="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="2" cy="12" r="1.5" fill="currentColor" />
                <circle cx="12" cy="2" r="1.5" fill="currentColor" />
            </svg>
        ),
    },
    {
        key: 'ray',
        label: 'Ray',
        icon: (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <line x1="2" y1="10" x2="12" y2="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="2" cy="10" r="1.5" fill="currentColor" />
                <path d="M10.5 3l2 1-1.5 1.5" stroke="currentColor" strokeWidth="1" fill="none" strokeLinecap="round" />
            </svg>
        ),
    },
    {
        key: 'fib',
        label: 'Fibonacci',
        icon: (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <line x1="2" y1="3" x2="12" y2="3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                <line x1="2" y1="6" x2="12" y2="6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeDasharray="2 1" />
                <line x1="2" y1="8.5" x2="12" y2="8.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeDasharray="2 1" />
                <line x1="2" y1="11" x2="12" y2="11" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            </svg>
        ),
    },
    {
        key: 'text',
        label: 'Text label',
        icon: (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <text x="3" y="11" fontSize="10" fill="currentColor" fontWeight="700">T</text>
            </svg>
        ),
    },
]

const COLORS = [
    '#4ade80', '#ef4444', '#f59e0b',
    '#60a5fa', '#c084fc', '#fb923c',
    '#ffffff', '#94a3b8',
]

const FIB_LEVELS = [
    { level: 0, label: '0%', color: '#ef4444' },
    { level: 0.236, label: '23.6%', color: '#f59e0b' },
    { level: 0.382, label: '38.2%', color: '#4ade80' },
    { level: 0.5, label: '50%', color: '#60a5fa' },
    { level: 0.618, label: '61.8%', color: '#4ade80' },
    { level: 0.786, label: '78.6%', color: '#f59e0b' },
    { level: 1, label: '100%', color: '#ef4444' },
]

export default function DrawingTools({ containerRef }) {
    const canvasRef = useRef(null)
    const stateRef = useRef({
        tool: 'cursor',
        color: '#4ade80',
        lineWidth: 1,
        drawings: [],
        drawing: false,
        startPoint: null,
        currentPoint: null,
        selected: -1,
        dragging: false,
        dragOffset: null,
        dragStart: null,
    })

    const [tool, setTool] = useState('cursor')
    const [color, setColor] = useState('#4ade80')
    const [lineWidth, setLineWidth] = useState(1)
    const [showColors, setShowColors] = useState(false)
    const [drawCount, setDrawCount] = useState(0)
    const [textMode, setTextMode] = useState(null)
    const [textValue, setTextValue] = useState('')

    useEffect(() => { stateRef.current.tool = tool }, [tool])
    useEffect(() => { stateRef.current.color = color }, [color])
    useEffect(() => { stateRef.current.lineWidth = lineWidth }, [lineWidth])

    const getSize = useCallback(() => {
        const c = canvasRef.current
        if (!c) return { w: 800, h: 500 }
        return { w: c.offsetWidth, h: c.offsetHeight }
    }, [])

    const redraw = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        const dpr = window.devicePixelRatio || 1
        const { w, h } = getSize()
        ctx.clearRect(0, 0, w * dpr, h * dpr)
        stateRef.current.drawings.forEach((d, i) => {
            drawShape(ctx, d, w, h, i === stateRef.current.selected)
        })
        const s = stateRef.current
        if (s.drawing && s.startPoint && s.currentPoint) {
            drawPreview(ctx, s.tool, s.startPoint, s.currentPoint, s.color, s.lineWidth, w, h)
        }
    }, [getSize])

    const syncCanvasSize = useCallback(() => {
        const canvas = canvasRef.current
        const parent = containerRef?.current
        if (!canvas || !parent) return
        const dpr = window.devicePixelRatio || 1
        const w = parent.offsetWidth
        const h = parent.offsetHeight
        canvas.style.width = `${w}px`
        canvas.style.height = `${h}px`
        canvas.width = Math.floor(w * dpr)
        canvas.height = Math.floor(h * dpr)
        const ctx = canvas.getContext('2d')
        ctx.scale(dpr, dpr)
        redraw()
    }, [containerRef, redraw])

    useEffect(() => {
        syncCanvasSize()
        const ro = new ResizeObserver(syncCanvasSize)
        if (containerRef?.current) ro.observe(containerRef.current)
        return () => ro.disconnect()
    }, [syncCanvasSize, containerRef])

    const drawShape = (ctx, d, w, h, selected) => {
        ctx.save()
        ctx.strokeStyle = d.color
        ctx.fillStyle = d.color
        ctx.lineWidth = d.lineWidth || 1
        ctx.setLineDash([])

        if (selected) {
            ctx.shadowColor = d.color
            ctx.shadowBlur = 8
        }

        switch (d.type) {
            case 'hline': {
                ctx.setLineDash([])
                ctx.beginPath()
                ctx.moveTo(0, d.y)
                ctx.lineTo(w, d.y)
                ctx.stroke()
                ctx.shadowBlur = 0
                ctx.font = '11px sans-serif'
                ctx.textAlign = 'right'
                ctx.fillStyle = d.color
                ctx.fillText(d.label || '', w - 6, d.y - 4)
                break
            }
            case 'vline': {
                ctx.beginPath()
                ctx.moveTo(d.x, 0)
                ctx.lineTo(d.x, h)
                ctx.stroke()
                break
            }
            case 'rect': {
                const rx = Math.min(d.x1, d.x2)
                const ry = Math.min(d.y1, d.y2)
                const rw = Math.abs(d.x2 - d.x1)
                const rh = Math.abs(d.y2 - d.y1)
                ctx.globalAlpha = 0.12
                ctx.fillRect(rx, ry, rw, rh)
                ctx.globalAlpha = 1
                ctx.strokeRect(rx, ry, rw, rh)
                break
            }
            case 'trendline': {
                ctx.beginPath()
                ctx.moveTo(d.x1, d.y1)
                ctx.lineTo(d.x2, d.y2)
                ctx.stroke()
                dot(ctx, d.x1, d.y1, d.color)
                dot(ctx, d.x2, d.y2, d.color)
                break
            }
            case 'ray': {
                const dx = d.x2 - d.x1
                const dy = d.y2 - d.y1
                const len = Math.hypot(dx, dy)
                if (len === 0) break
                const ext = Math.max(w, h) * 4
                ctx.beginPath()
                ctx.moveTo(d.x1, d.y1)
                ctx.lineTo(d.x1 + (dx / len) * ext, d.y1 + (dy / len) * ext)
                ctx.stroke()
                dot(ctx, d.x1, d.y1, d.color)
                break
            }
            case 'fib': {
                const top = Math.min(d.y1, d.y2)
                const bot = Math.max(d.y1, d.y2)
                const range = bot - top
                FIB_LEVELS.forEach(({ level, label, color: fc }) => {
                    const y = top + range * level
                    ctx.save()
                    ctx.strokeStyle = fc
                    ctx.fillStyle = fc
                    ctx.lineWidth = 0.8
                    ctx.setLineDash([4, 3])
                    ctx.shadowBlur = 0
                    ctx.beginPath()
                    ctx.moveTo(0, y)
                    ctx.lineTo(w, y)
                    ctx.stroke()
                    ctx.setLineDash([])
                    ctx.font = '10px sans-serif'
                    ctx.textAlign = 'left'
                    ctx.fillText(`${label}  ${d.y1 < d.y2 ? '' : ''}`, d.x1 + 6, y - 3)
                    ctx.restore()
                })
                break
            }
            case 'text': {
                ctx.font = `${d.fontSize || 13}px sans-serif`
                ctx.textAlign = 'left'
                ctx.shadowBlur = 0
                ctx.fillText(d.text || '', d.x, d.y)
                if (selected) {
                    const m = ctx.measureText(d.text || '')
                    ctx.strokeStyle = d.color
                    ctx.lineWidth = 0.5
                    ctx.setLineDash([3, 3])
                    ctx.strokeRect(d.x - 2, d.y - 14, m.width + 8, 18)
                    ctx.setLineDash([])
                }
                break
            }
        }
        ctx.restore()
        if (selected) drawHandles(ctx, d, w, h)
    }

    const dot = (ctx, x, y, color) => {
        ctx.save()
        ctx.fillStyle = color
        ctx.shadowBlur = 0
        ctx.beginPath()
        ctx.arc(x, y, 3, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
    }

    const drawHandles = (ctx, d, w, h) => {
        const pts = getHandles(d, w, h)
        ctx.save()
        pts.forEach(([hx, hy]) => {
            ctx.fillStyle = '#fff'
            ctx.strokeStyle = d.color
            ctx.lineWidth = 1.5
            ctx.shadowBlur = 0
            ctx.beginPath()
            ctx.arc(hx, hy, 4, 0, Math.PI * 2)
            ctx.fill()
            ctx.stroke()
        })
        ctx.restore()
    }

    const getHandles = (d, w, h) => {
        switch (d.type) {
            case 'hline': return [[w / 4, d.y], [w / 2, d.y], [w * 0.75, d.y]]
            case 'vline': return [[d.x, h / 4], [d.x, h / 2], [d.x, h * 0.75]]
            case 'trendline':
            case 'ray':
            case 'fib': return [[d.x1, d.y1], [d.x2, d.y2]]
            case 'rect': return [[d.x1, d.y1], [d.x2, d.y1], [d.x1, d.y2], [d.x2, d.y2]]
            default: return []
        }
    }

    const drawPreview = (ctx, type, start, end, color, lw, w, h) => {
        ctx.save()
        ctx.strokeStyle = color
        ctx.fillStyle = color
        ctx.lineWidth = lw
        ctx.globalAlpha = 0.6
        ctx.setLineDash([5, 3])

        switch (type) {
            case 'hline': {
                ctx.beginPath()
                ctx.moveTo(0, start.y)
                ctx.lineTo(w, start.y)
                ctx.stroke()
                break
            }
            case 'vline': {
                ctx.beginPath()
                ctx.moveTo(start.x, 0)
                ctx.lineTo(start.x, h)
                ctx.stroke()
                break
            }
            case 'rect': {
                ctx.globalAlpha = 0.08
                ctx.fillRect(start.x, start.y, end.x - start.x, end.y - start.y)
                ctx.globalAlpha = 0.6
                ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y)
                break
            }
            case 'trendline':
            case 'ray': {
                ctx.beginPath()
                ctx.moveTo(start.x, start.y)
                ctx.lineTo(end.x, end.y)
                ctx.stroke()
                break
            }
            case 'fib': {
                const top = Math.min(start.y, end.y)
                const bot = Math.max(start.y, end.y)
                const range = bot - top
                FIB_LEVELS.forEach(({ level, label, color: fc }) => {
                    const y = top + range * level
                    ctx.save()
                    ctx.strokeStyle = fc
                    ctx.lineWidth = 0.8
                    ctx.setLineDash([4, 3])
                    ctx.beginPath()
                    ctx.moveTo(0, y)
                    ctx.lineTo(w, y)
                    ctx.stroke()
                    ctx.fillStyle = fc
                    ctx.font = '10px sans-serif'
                    ctx.textAlign = 'left'
                    ctx.setLineDash([])
                    ctx.fillText(label, start.x + 6, y - 3)
                    ctx.restore()
                })
                break
            }
        }
        ctx.restore()
    }

    const hitTest = (d, x, y, w, h) => {
        const T = 8
        switch (d.type) {
            case 'hline': return Math.abs(y - d.y) < T
            case 'vline': return Math.abs(x - d.x) < T
            case 'trendline':
            case 'ray': {
                const dx = d.x2 - d.x1
                const dy = d.y2 - d.y1
                const len = Math.hypot(dx, dy)
                if (len === 0) return false
                const dist = Math.abs(dy * x - dx * y + d.x2 * d.y1 - d.y2 * d.x1) / len
                return dist < T && x >= Math.min(d.x1, d.x2) - T && x <= Math.max(d.x1, d.x2) + T
            }
            case 'rect': {
                const rx = Math.min(d.x1, d.x2)
                const ry = Math.min(d.y1, d.y2)
                const rw = Math.abs(d.x2 - d.x1)
                const rh = Math.abs(d.y2 - d.y1)
                return x >= rx - T && x <= rx + rw + T && y >= ry - T && y <= ry + rh + T
            }
            case 'fib': {
                const top = Math.min(d.y1, d.y2)
                const bot = Math.max(d.y1, d.y2)
                return y >= top - T && y <= bot + T && x >= d.x1 - T
            }
            case 'text': return Math.abs(x - d.x) < 80 && Math.abs(y - d.y) < 16
            default: return false
        }
    }

    const getPos = (e) => {
        const rect = canvasRef.current.getBoundingClientRect()
        return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }

    const onMouseDown = useCallback((e) => {
        const s = stateRef.current
        const pos = getPos(e)

        if (s.tool === 'cursor') {
            let found = -1
            const { w, h } = getSize()
            for (let i = s.drawings.length - 1; i >= 0; i--) {
                if (hitTest(s.drawings[i], pos.x, pos.y, w, h)) { found = i; break }
            }
            stateRef.current.selected = found
            stateRef.current.dragging = found >= 0
            stateRef.current.dragOffset = found >= 0 ? pos : null
            stateRef.current.dragStart = found >= 0
                ? JSON.parse(JSON.stringify(s.drawings[found]))
                : null
            setDrawCount(c => c + 1)
            redraw()
            return
        }

        if (s.tool === 'text') {
            setTextMode(pos)
            setTextValue('')
            return
        }

        stateRef.current.drawing = true
        stateRef.current.startPoint = pos
        stateRef.current.currentPoint = pos
    }, [getSize, redraw])

    const onMouseMove = useCallback((e) => {
        const s = stateRef.current
        const pos = getPos(e)

        if (s.dragging && s.selected >= 0 && s.dragStart) {
            const dx = pos.x - s.dragOffset.x
            const dy = pos.y - s.dragOffset.y
            const d = s.drawings[s.selected]
            const ds = s.dragStart
            if (d.type === 'hline') d.y = ds.y + dy
            if (d.type === 'vline') d.x = ds.x + dx
            if (['trendline', 'ray', 'rect', 'fib'].includes(d.type)) {
                d.x1 = ds.x1 + dx; d.y1 = ds.y1 + dy
                d.x2 = ds.x2 + dx; d.y2 = ds.y2 + dy
            }
            if (d.type === 'text') { d.x = ds.x + dx; d.y = ds.y + dy }
            redraw()
            return
        }

        if (s.drawing) {
            stateRef.current.currentPoint = pos
            redraw()
        }
    }, [redraw])

    const onMouseUp = useCallback((e) => {
        const s = stateRef.current
        const pos = getPos(e)

        if (s.dragging) {
            stateRef.current.dragging = false
            stateRef.current.dragOffset = null
            stateRef.current.dragStart = null
            return
        }

        if (!s.drawing || !s.startPoint) return

        const dist = Math.hypot(pos.x - s.startPoint.x, pos.y - s.startPoint.y)
        let newD = null

        switch (s.tool) {
            case 'hline':
                newD = { type: 'hline', y: s.startPoint.y, label: '', color: s.color, lineWidth: s.lineWidth }
                break
            case 'vline':
                newD = { type: 'vline', x: s.startPoint.x, color: s.color, lineWidth: s.lineWidth }
                break
            case 'rect':
                if (dist > 5) newD = { type: 'rect', x1: s.startPoint.x, y1: s.startPoint.y, x2: pos.x, y2: pos.y, color: s.color, lineWidth: s.lineWidth }
                break
            case 'trendline':
                if (dist > 5) newD = { type: 'trendline', x1: s.startPoint.x, y1: s.startPoint.y, x2: pos.x, y2: pos.y, color: s.color, lineWidth: s.lineWidth }
                break
            case 'ray':
                if (dist > 5) newD = { type: 'ray', x1: s.startPoint.x, y1: s.startPoint.y, x2: pos.x, y2: pos.y, color: s.color, lineWidth: s.lineWidth }
                break
            case 'fib':
                if (dist > 5) newD = { type: 'fib', x1: s.startPoint.x, y1: s.startPoint.y, x2: pos.x, y2: pos.y, color: s.color, lineWidth: s.lineWidth }
                break
        }

        if (newD) {
            s.drawings.push(newD)
            setDrawCount(c => c + 1)
        }

        stateRef.current.drawing = false
        stateRef.current.startPoint = null
        stateRef.current.currentPoint = null
        redraw()
    }, [redraw])

    const onKeyDown = useCallback((e) => {
        const s = stateRef.current
        if (['Delete', 'Backspace'].includes(e.key) && s.selected >= 0) {
            if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return
            s.drawings.splice(s.selected, 1)
            stateRef.current.selected = -1
            setDrawCount(c => c + 1)
            redraw()
        }
        if (e.key === 'Escape') {
            stateRef.current.selected = -1
            stateRef.current.drawing = false
            setTool('cursor')
            redraw()
        }
    }, [redraw])

    useEffect(() => {
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [onKeyDown])

    const submitText = () => {
        if (!textValue.trim() || !textMode) { setTextMode(null); return }
        stateRef.current.drawings.push({
            type: 'text', text: textValue,
            x: textMode.x, y: textMode.y,
            color: stateRef.current.color,
            fontSize: 13, lineWidth: 1,
        })
        setTextMode(null)
        setTextValue('')
        setDrawCount(c => c + 1)
        redraw()
    }

    const clearAll = () => {
        stateRef.current.drawings = []
        stateRef.current.selected = -1
        setDrawCount(0)
        redraw()
    }

    return (
        <>
            <canvas
                ref={canvasRef}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    zIndex: 12,
                    cursor:
                        tool === 'cursor' ? 'default' :
                            tool === 'text' ? 'text' :
                                'crosshair',
                    pointerEvents: 'all',
                    display: 'block',
                }}
            />

            {textMode && (
                <div style={{
                    position: 'absolute',
                    left: textMode.x,
                    top: textMode.y - 22,
                    zIndex: 30,
                    display: 'flex',
                    gap: '5px',
                    alignItems: 'center',
                }}>
                    <input
                        autoFocus
                        value={textValue}
                        onChange={e => setTextValue(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter') submitText()
                            if (e.key === 'Escape') setTextMode(null)
                        }}
                        placeholder="Type label..."
                        style={{
                            padding: '4px 8px',
                            fontSize: '13px',
                            border: `2px solid ${color}`,
                            borderRadius: '6px',
                            background: 'rgba(13,13,26,0.95)',
                            color: color,
                            outline: 'none',
                            minWidth: '120px',
                        }}
                    />
                    <button
                        onClick={submitText}
                        style={{
                            padding: '4px 8px',
                            fontSize: '12px',
                            background: color,
                            color: '#111',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontWeight: 600,
                        }}
                    >
                        Add
                    </button>
                </div>
            )}

            <div style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
            }}>
                <div style={{
                    background: 'rgba(13,13,26,0.92)',
                    border: '1px solid #ffffff15',
                    borderRadius: '10px',
                    padding: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                }}>
                    {TOOLS.map(t => (
                        <button
                            key={t.key}
                            onClick={() => {
                                setTool(t.key)
                                stateRef.current.selected = -1
                                setShowColors(false)
                                redraw()
                            }}
                            title={t.label}
                            style={{
                                width: '30px',
                                height: '30px',
                                borderRadius: '6px',
                                border: 'none',
                                background: tool === t.key ? `${color}33` : 'transparent',
                                color: tool === t.key ? color : '#6b7280',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            {t.icon}
                        </button>
                    ))}

                    <div style={{ width: '30px', height: '1px', background: '#ffffff15', margin: '3px 0' }} />

                    <button
                        onClick={() => setShowColors(p => !p)}
                        title="Color"
                        style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '6px',
                            border: `2px solid #ffffff20`,
                            background: color,
                            cursor: 'pointer',
                            padding: 0,
                        }}
                    />

                    {[1, 2, 3].map(lw => (
                        <button
                            key={lw}
                            onClick={() => setLineWidth(lw)}
                            title={`Line width ${lw}`}
                            style={{
                                width: '30px',
                                height: '26px',
                                borderRadius: '5px',
                                border: 'none',
                                background: lineWidth === lw ? '#ffffff15' : 'transparent',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <div style={{
                                width: '16px',
                                height: `${lw}px`,
                                background: lineWidth === lw ? '#fff' : '#6b7280',
                                borderRadius: '1px',
                            }} />
                        </button>
                    ))}

                    <div style={{ width: '30px', height: '1px', background: '#ffffff15', margin: '3px 0' }} />

                    <button
                        onClick={clearAll}
                        title="Clear all drawings"
                        style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '6px',
                            border: 'none',
                            background: 'transparent',
                            color: '#6b7280',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M1 1l10 10M11 1L1 11" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                {showColors && (
                    <div style={{
                        background: 'rgba(13,13,26,0.95)',
                        border: '1px solid #ffffff15',
                        borderRadius: '10px',
                        padding: '8px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4,1fr)',
                        gap: '4px',
                        width: '104px',
                    }}>
                        {COLORS.map(c => (
                            <button
                                key={c}
                                onClick={() => { setColor(c); setShowColors(false) }}
                                style={{
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '4px',
                                    border: color === c ? '2px solid #fff' : '1px solid #ffffff20',
                                    background: c,
                                    cursor: 'pointer',
                                    padding: 0,
                                }}
                            />
                        ))}
                    </div>
                )}

                {stateRef.current.drawings.length > 0 && (
                    <div style={{
                        background: 'rgba(13,13,26,0.85)',
                        border: '1px solid #ffffff10',
                        borderRadius: '7px',
                        padding: '5px 8px',
                        fontSize: '10px',
                        color: '#6b7280',
                        textAlign: 'center',
                    }}>
                        {stateRef.current.drawings.length} drawing{stateRef.current.drawings.length !== 1 ? 's' : ''}
                        <br />
                        <span style={{ color: '#4b5563' }}>Del to remove</span>
                    </div>
                )}
            </div>
        </>
    )
}