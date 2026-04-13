import { NextResponse } from 'next/server'
import connectDB from '@/lib/db'
import CandleCache from '@/models/CandleCache'

const TWELVE_DATA_KEY = process.env.TWELVE_DATA_API_KEY

const INTERVAL_MAP = {
    '1min': '1min',
    '5min': '5min',
    '15min': '15min',
    '30min': '30min',
    '1h': '1h',
    '4h': '4h',
    '1day': '1day',
}

async function fetchFromTwelveData(symbol, interval, startDate, endDate) {
    const url = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=${interval}&start_date=${startDate}&end_date=${endDate}&outputsize=5000&apikey=${TWELVE_DATA_KEY}`

    const res = await fetch(url)
    const data = await res.json()

    if (data.status === 'error') {
        throw new Error(data.message || 'Twelve Data API error')
    }

    if (!data.values || data.values.length === 0) {
        throw new Error('No candle data returned for this period')
    }

    return data.values.map((candle) => ({
        time: Math.floor(new Date(candle.datetime).getTime() / 1000),
        open: parseFloat(candle.open),
        high: parseFloat(candle.high),
        low: parseFloat(candle.low),
        close: parseFloat(candle.close),
        volume: parseFloat(candle.volume || 0),
    })).reverse()
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const symbol = searchParams.get('symbol') || 'XAU/USD'
        const interval = searchParams.get('interval') || '1h'
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')

        if (!startDate || !endDate) {
            return NextResponse.json(
                { error: 'startDate and endDate are required' },
                { status: 400 }
            )
        }

        if (!INTERVAL_MAP[interval]) {
            return NextResponse.json(
                { error: 'Invalid interval' },
                { status: 400 }
            )
        }

        await connectDB()

        const cacheKey = `${symbol}-${interval}-${startDate}-${endDate}`
        const cached = await CandleCache.findOne({
            symbol,
            interval,
            date: cacheKey,
        })

        if (cached) {
            return NextResponse.json({
                candles: cached.candles,
                cached: true,
                count: cached.candles.length,
            })
        }

        const candles = await fetchFromTwelveData(symbol, interval, startDate, endDate)

        await CandleCache.create({
            symbol,
            interval,
            date: cacheKey,
            candles,
        })

        return NextResponse.json({
            candles,
            cached: false,
            count: candles.length,
        })
    } catch (error) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }
}