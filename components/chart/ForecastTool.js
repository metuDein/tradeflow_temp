'use client'
import { useState, useRef, useEffect } from 'react'

const FORECAST_TYPES = [
    { key: 'buy', label: '▲ Buy forecast', color: '#4ade80' },
    { key: 'sell', label: '▼ Sell forecast', color: '#ef4444' },
    { key: 'range', label: '◈ Range / consolidation', color: '#f59e0b' },
]

export default function ForecastTool({
    candles,
    replayIndex,
    onForecastSubmit,
}) {
    const canvasRef = useRef(null)
    const [active, setActive] = useState(false)
    const [forecastType, setForecastType] = useState('buy')
    const [drawing, setDrawing] = useState(false)
    const [startPoint, setStartPoint] = useState(null)
    const [endPoint, setEndPoint] = useState(null)
    const [forecasts, setForecasts] = useState([])
    const [submitted, setSubmitted] = useState(false)
    const [score, setScore] = useState(null)

    useEffect(() => {
        if (!canvasRef.current) return
        const canvas = canvasRef.current
        const parent = canvas.parentElement
        canvas.width = parent.offsetWidth
        canvas.height = parent.offsetHeight
        drawAll()
    }, [forecasts, endPoint, active])

    useEffect(() => {
        if (!submitted || forecasts.length === 0) return
        scoreForecasts()
    }, [replayIndex])

    const drawAll = () => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        forecasts.forEach(f => drawForecast(ctx, f, canvas))
        if (drawing && startPoint && endPoint) {
            const color = FORECAST_TYPES.find(t => t.key === forecastType)?.color || '#4ade80'
            drawArrow(ctx, startPoint, endPoint, color, 0.7)
        }
    }

    const drawForecast = (ctx, f, canvas) => {
        const color = FORECAST_TYPES.find(t => t.key === f.type)?.color || '#4ade80'
        const alpha = f.scored
            ? f.correct ? 1 : 0.4
            : 0.85
        drawArrow(ctx, f.start, f.end, color, alpha)

        if (f.scored) {
            ctx.font = 'bold 13px sans-serif'
            ctx.fillStyle = f.correct ? '#4ade80' : '#ef4444'
            ctx.fillText(
                f.correct ? '✓ Correct' : '✗ Wrong',
                f.end.x + 8,
                f.end.y
            )
        }

        ctx.font = '11px sans-serif'
        ctx.fillStyle = color
        ctx.globalAlpha = alpha
        ctx.fillText(
            FORECAST_TYPES.find(t => t.key === f.type)?.label || f.type,
            f.start.x,
            f.start.y - 8
        )
        ctx.globalAlpha = 1
    }

    const drawArrow = (ctx, from, to, color, alpha = 1) => {
        ctx.globalAlpha = alpha
        ctx.strokeStyle = color
        ctx.fillStyle = color
        ctx.lineWidth = 2.5
        ctx.setLineDash([6, 3])

        ctx.beginPath()
        ctx.moveTo(from.x, from.y)
        ctx.lineTo(to.x, to.y)
        ctx.stroke()
        ctx.setLineDash([])

        const angle = Math.atan2(to.y - from.y, to.x - from.x)
        const headLen = 14
        ctx.beginPath()
        ctx.moveTo(to.x, to.y)
        ctx.lineTo(
            to.x - headLen * Math.cos(angle - Math.PI / 6),
            to.y - headLen * Math.sin(angle - Math.PI / 6)
        )
        ctx.lineTo(
            to.x - headLen * Math.cos(angle + Math.PI / 6),
            to.y - headLen * Math.sin(angle + Math.PI / 6)
        )
        ctx.closePath()
        ctx.fill()

        ctx.globalAlpha = 1
    }

    const getPos = (e) => {
        const rect = canvasRef.current.getBoundingClientRect()
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        }
    }

    const onMouseDown = (e) => {
        if (!active) return
        const pos = getPos(e)
        setStartPoint(pos)
        setEndPoint(pos)
        setDrawing(true)
    }

    const onMouseMove = (e) => {
        if (!drawing || !active) return
        setEndPoint(getPos(e))
    }

    const onMouseUp = (e) => {
        if (!drawing || !active) return
        const end = getPos(e)
        const dist = Math.hypot(end.x - startPoint.x, end.y - startPoint.y)
        if (dist > 20) {
            const forecast = {
                id: Date.now(),
                type: forecastType,
                start: startPoint,
                end,
                canvasHeight: canvasRef.current.height,
                canvasWidth: canvasRef.current.width,
                replayIndexAtDraw: replayIndex,
                scored: false,
                correct: null,
            }
            setForecasts(prev => [...prev, forecast])
            onForecastSubmit?.(forecast)
        }
        setDrawing(false)
        setStartPoint(null)
        setEndPoint(null)
    }

    const scoreForecasts = () => {
        if (replayIndex === null || candles.length === 0) return

        setForecasts(prev => prev.map(f => {
            if (f.scored || f.replayIndexAtDraw === null) return f

            const lookAhead = Math.min(
                f.replayIndexAtDraw + 20,
                candles.length - 1
            )

            if (replayIndex < lookAhead) return f

            const atDraw = candles[f.replayIndexAtDraw]?.close
            const now = candles[Math.min(replayIndex, candles.length - 1)]?.close

            if (!atDraw || !now) return f

            const marketWentUp = parseFloat(now) > parseFloat(atDraw)
            const forecastWasUp = f.end.y < f.start.y

            const correct = (f.type === 'buy' && marketWentUp) ||
                (f.type === 'sell' && !marketWentUp) ||
                (f.type === 'range' && Math.abs(parseFloat(now) - parseFloat(atDraw)) < 5)

            return { ...f, scored: true, correct }
        }))
    }

    const clearAll = () => {
        setForecasts([])
        setScore(null)
        setSubmitted(false)
        const canvas = canvasRef.current
        if (canvas) {
            const ctx = canvas.getContext('2d')
            ctx.clearRect(0, 0, canvas.width, canvas.height)
        }
    }

    const submitForecasts = () => {
        setSubmitted(true)
        setActive(false)
    }

    const accuracy = forecasts.filter(f => f.scored).length > 0
        ? Math.round(
            (forecasts.filter(f => f.scored && f.correct).length /
                forecasts.filter(f => f.scored).length) * 100
        )
        : null

    return (
        <>
            <canvas
                ref={canvasRef}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: 10,
                    cursor: active ? 'crosshair' : 'default',
                    pointerEvents: active ? 'all' : 'none',
                }}
            />

            <div style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                zIndex: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
            }}>
                <div style={{
                    background: 'rgba(13,13,26,0.92)',
                    border: '1px solid #ffffff15',
                    borderRadius: '10px',
                    padding: '8px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    flexWrap: 'wrap',
                }}>
                    <button
                        onClick={() => setActive(p => !p)}
                        style={{
                            padding: '5px 12px',
                            fontSize: '12px',
                            borderRadius: '6px',
                            border: 'none',
                            cursor: 'pointer',
                            background: active ? '#4ade80' : '#1f2937',
                            color: active ? '#111' : '#9ca3af',
                            fontWeight: active ? 600 : 400,
                        }}
                    >
                        {active ? '✎ Drawing' : '✎ Forecast'}
                    </button>

                    {active && FORECAST_TYPES.map(ft => (
                        <button
                            key={ft.key}
                            onClick={() => setForecastType(ft.key)}
                            style={{
                                padding: '4px 10px',
                                fontSize: '11px',
                                borderRadius: '6px',
                                border: forecastType === ft.key
                                    ? `1.5px solid ${ft.color}`
                                    : '1px solid #374151',
                                background: forecastType === ft.key
                                    ? `${ft.color}22`
                                    : 'transparent',
                                color: forecastType === ft.key ? ft.color : '#6b7280',
                                cursor: 'pointer',
                                fontWeight: forecastType === ft.key ? 600 : 400,
                            }}
                        >
                            {ft.label}
                        </button>
                    ))}

                    {forecasts.length > 0 && !submitted && (
                        <button
                            onClick={submitForecasts}
                            style={{
                                padding: '4px 10px',
                                fontSize: '11px',
                                borderRadius: '6px',
                                border: '1px solid #4ade80',
                                background: '#4ade8022',
                                color: '#4ade80',
                                cursor: 'pointer',
                            }}
                        >
                            Lock in ({forecasts.length})
                        </button>
                    )}

                    {forecasts.length > 0 && (
                        <button
                            onClick={clearAll}
                            style={{
                                padding: '4px 10px',
                                fontSize: '11px',
                                borderRadius: '6px',
                                border: '1px solid #374151',
                                background: 'transparent',
                                color: '#6b7280',
                                cursor: 'pointer',
                            }}
                        >
                            Clear
                        </button>
                    )}
                </div>

                {submitted && accuracy !== null && (
                    <div style={{
                        background: 'rgba(13,13,26,0.92)',
                        border: `1px solid ${accuracy >= 60 ? '#4ade8040' : '#ef444440'}`,
                        borderRadius: '10px',
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                    }}>
                        <div style={{
                            fontSize: '22px',
                            fontWeight: 700,
                            color: accuracy >= 60 ? '#4ade80' : '#ef4444',
                        }}>
                            {accuracy}%
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', color: '#9ca3af' }}>Forecast accuracy</div>
                            <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                                {forecasts.filter(f => f.scored && f.correct).length} correct of{' '}
                                {forecasts.filter(f => f.scored).length} scored
                            </div>
                        </div>
                    </div>
                )}

                {active && (
                    <div style={{
                        background: 'rgba(13,13,26,0.85)',
                        border: '1px solid #ffffff10',
                        borderRadius: '8px',
                        padding: '7px 12px',
                        fontSize: '11px',
                        color: '#6b7280',
                    }}>
                        Click and drag on the chart to draw a forecast arrow
                    </div>
                )}
            </div>
        </>
    )
}