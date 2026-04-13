const INTERVAL_MINUTES = {
    '1min': 1,
    '5min': 5,
    '15min': 15,
    '30min': 30,
    '1h': 60,
    '4h': 240,
    '1day': 1440,
}

export function aggregateCandles(candles, targetInterval) {
    if (!candles || candles.length === 0) return []

    const targetMins = INTERVAL_MINUTES[targetInterval]
    if (!targetMins) return candles

    const bucketSecs = targetMins * 60
    const map = new Map()

    for (const c of candles) {
        const key = Math.floor(c.time / bucketSecs) * bucketSecs

        if (!map.has(key)) {
            map.set(key, {
                time: key,
                open: c.open,
                high: c.high,
                low: c.low,
                close: c.close,
                volume: c.volume || 0,
            })
        } else {
            const b = map.get(key)
            b.high = Math.max(b.high, c.high)
            b.low = Math.min(b.low, c.low)
            b.close = c.close
            b.volume = parseFloat(((b.volume || 0) + (c.volume || 0)).toFixed(4))
        }
    }

    return Array.from(map.values()).sort((a, b) => a.time - b.time)
}