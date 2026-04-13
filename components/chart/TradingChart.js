'use client'
import { useEffect, useRef } from 'react'

export default function TradingChart({
    candles = [],
    trades = [],
    replayIndex = null,
    onCandleClick,
}) {
    const containerRef = useRef(null)
    const chartRef = useRef(null)
    const seriesRef = useRef(null)
    const initDoneRef = useRef(false)

    useEffect(() => {
        if (!containerRef.current || candles.length === 0) return

        async function init() {
            const LWC = await import('lightweight-charts')
            const el = containerRef.current

            if (chartRef.current) {
                chartRef.current.remove()
                chartRef.current = null
                seriesRef.current = null
            }

            const chart = LWC.createChart(el, {
                width: el.offsetWidth,
                height: el.offsetHeight,
                layout: {
                    background: { color: '#0d0d1a' },
                    textColor: '#9ca3af',
                    fontSize: 12,
                },
                grid: {
                    vertLines: { color: '#ffffff08' },
                    horzLines: { color: '#ffffff08' },
                },
                crosshair: {
                    mode: LWC.CrosshairMode.Normal,
                    vertLine: {
                        color: '#4ade8040',
                        labelBackgroundColor: '#1a1a2e',
                    },
                    horzLine: {
                        color: '#4ade8040',
                        labelBackgroundColor: '#1a1a2e',
                    },
                },
                rightPriceScale: {
                    borderColor: '#ffffff10',
                    textColor: '#6b7280',
                },
                timeScale: {
                    borderColor: '#ffffff10',
                    textColor: '#6b7280',
                    timeVisible: true,
                    secondsVisible: false,
                },
            })

            const seriesOpts = {
                upColor: '#4ade80',
                downColor: '#ef4444',
                borderUpColor: '#4ade80',
                borderDownColor: '#ef4444',
                wickUpColor: '#4ade80',
                wickDownColor: '#ef4444',
            }

            let series
            if (typeof chart.addCandlestickSeries === 'function') {
                series = chart.addCandlestickSeries(seriesOpts)
            } else {
                series = chart.addSeries(LWC.CandlestickSeries, seriesOpts)
            }

            const visibleCandles = replayIndex !== null
                ? candles.slice(0, replayIndex + 1)
                : candles

            series.setData(visibleCandles)
            chart.timeScale().fitContent()

            if (onCandleClick) {
                chart.subscribeClick((param) => {
                    if (param.time) onCandleClick(param.time)
                })
            }

            const onResize = () => {
                if (!containerRef.current || !chart) return
                chart.applyOptions({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight,
                })
            }
            window.addEventListener('resize', onResize)

            chartRef.current = chart
            seriesRef.current = series

            return () => window.removeEventListener('resize', onResize)
        }

        let cleanup
        init().then(fn => { cleanup = fn })

        return () => {
            if (cleanup) cleanup()
        }
    }, [candles])

    useEffect(() => {
        if (!seriesRef.current || candles.length === 0) return

        const visibleCandles = replayIndex !== null
            ? candles.slice(0, replayIndex + 1)
            : candles

        seriesRef.current.setData(visibleCandles)

        if (replayIndex === null && chartRef.current) {
            chartRef.current.timeScale().fitContent()
        }
    }, [replayIndex])

    useEffect(() => {
        if (!seriesRef.current || trades.length === 0) return

        const markers = trades
            .filter((t) => t.entryTime && t.status === 'closed')
            .map((t) => ({
                time: Math.floor(new Date(t.entryTime).getTime() / 1000),
                position: t.direction === 'BUY' ? 'belowBar' : 'aboveBar',
                color: t.outcome === 'win' ? '#4ade80' : '#ef4444',
                shape: t.direction === 'BUY' ? 'arrowUp' : 'arrowDown',
                text: `${t.direction} ${t.pnl > 0 ? '+' : ''}$${t.pnl}`,
            }))

        seriesRef.current.setMarkers(markers)
    }, [trades])

    useEffect(() => {
        return () => {
            if (chartRef.current) {
                chartRef.current.remove()
                chartRef.current = null
                seriesRef.current = null
            }
        }
    }, [])

    return (
        <div
            id="chart-container"
            ref={containerRef}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100%',
                height: '100%',
            }}
        />
    )
}