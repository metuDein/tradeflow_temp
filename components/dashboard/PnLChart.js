'use client'
import { useEffect, useRef } from 'react'

export default function PnLChart({ data = [] }) {
    const canvasRef = useRef(null)

    useEffect(() => {
        if (!canvasRef.current || data.length === 0) return

        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        const dpr = window.devicePixelRatio || 1
        const rect = canvas.getBoundingClientRect()

        canvas.width = rect.width * dpr
        canvas.height = rect.height * dpr
        ctx.scale(dpr, dpr)

        const w = rect.width
        const h = rect.height
        const pad = { top: 16, right: 16, bottom: 28, left: 56 }
        const chartW = w - pad.left - pad.right
        const chartH = h - pad.top - pad.bottom

        ctx.clearRect(0, 0, w, h)

        const balances = data.map(d => d.balance)
        const minB = Math.min(...balances)
        const maxB = Math.max(...balances)
        const range = maxB - minB || 1

        const xStep = chartW / Math.max(data.length - 1, 1)

        const toX = (i) => pad.left + i * xStep
        const toY = (val) => pad.top + chartH - ((val - minB) / range) * chartH

        ctx.strokeStyle = '#e5e7eb'
        ctx.lineWidth = 0.5
        const gridLines = 4
        for (let i = 0; i <= gridLines; i++) {
            const y = pad.top + (chartH / gridLines) * i
            ctx.beginPath()
            ctx.moveTo(pad.left, y)
            ctx.lineTo(pad.left + chartW, y)
            ctx.stroke()

            const val = maxB - ((maxB - minB) / gridLines) * i
            ctx.fillStyle = '#9ca3af'
            ctx.font = '11px sans-serif'
            ctx.textAlign = 'right'
            ctx.fillText('$' + Math.round(val).toLocaleString(), pad.left - 6, y + 4)
        }

        ctx.beginPath()
        data.forEach((d, i) => {
            const x = toX(i)
            const y = toY(d.balance)
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        })

        const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH)
        grad.addColorStop(0, 'rgba(74, 222, 128, 0.15)')
        grad.addColorStop(1, 'rgba(74, 222, 128, 0)')

        const fillPath = new Path2D()
        data.forEach((d, i) => {
            const x = toX(i)
            const y = toY(d.balance)
            i === 0 ? fillPath.moveTo(x, y) : fillPath.lineTo(x, y)
        })
        fillPath.lineTo(toX(data.length - 1), pad.top + chartH)
        fillPath.lineTo(toX(0), pad.top + chartH)
        fillPath.closePath()

        ctx.fillStyle = grad
        ctx.fill(fillPath)

        ctx.beginPath()
        data.forEach((d, i) => {
            const x = toX(i)
            const y = toY(d.balance)
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        })
        ctx.strokeStyle = '#4ade80'
        ctx.lineWidth = 2
        ctx.lineJoin = 'round'
        ctx.stroke()

        data.forEach((d, i) => {
            const x = toX(i)
            const y = toY(d.balance)
            ctx.beginPath()
            ctx.arc(x, y, 3, 0, Math.PI * 2)
            ctx.fillStyle = d.outcome === 'win' ? '#4ade80' : '#ef4444'
            ctx.fill()
        })

        ctx.fillStyle = '#9ca3af'
        ctx.font = '11px sans-serif'
        ctx.textAlign = 'center'
        const labelStep = Math.max(1, Math.floor(data.length / 6))
        data.forEach((d, i) => {
            if (i % labelStep === 0 || i === data.length - 1) {
                ctx.fillText(`#${d.trade}`, toX(i), h - 6)
            }
        })
    }, [data])

    if (data.length === 0) {
        return (
            <div style={{
                height: '200px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#9ca3af',
                fontSize: '13px',
            }}>
                No closed trades yet
            </div>
        )
    }

    return (
        <canvas
            ref={canvasRef}
            style={{ width: '100%', height: '200px', display: 'block' }}
        />
    )
}