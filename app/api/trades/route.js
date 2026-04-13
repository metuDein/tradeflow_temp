import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import connectDB from '@/lib/db'
import Trade from '@/models/Trade'
import Workspace from '@/models/Workspace'
import Journal from '@/models/Journal'
import { analyzeTradeAI, checkStrategyDeviation } from '@/lib/ai'

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const workspaceId = searchParams.get('workspaceId')

        await connectDB()

        const query = { userId: session.user.id }
        if (workspaceId) query.workspaceId = workspaceId

        const trades = await Trade.find(query).sort({ entryTime: -1 }).limit(100)
        return NextResponse.json({ trades })
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const {
            workspaceId, direction, execType,
            entryPrice, stopLoss, takeProfit,
            tp2, tp3, lotSize, timeframe,
            strategy, notes, screenshot,
        } = body

        if (!workspaceId || !direction || !entryPrice || !stopLoss || !takeProfit) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        await connectDB()

        const workspace = await Workspace.findById(workspaceId)
        if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

        const slDistance = Math.abs(entryPrice - stopLoss)
        const tpDistance = Math.abs(takeProfit - entryPrice)
        const riskRewardRatio = slDistance > 0
            ? parseFloat((tpDistance / slDistance).toFixed(2))
            : 0

        const deviations = await checkStrategyDeviation(
            { direction, entryPrice, stopLoss, takeProfit, timeframe, strategy },
            workspace.rules
        )

        const trade = await Trade.create({
            workspaceId,
            userId: session.user.id,
            direction,
            execType: execType || 'Market',
            entryPrice,
            stopLoss,
            takeProfit,
            tp2: tp2 || null,
            tp3: tp3 || null,
            lotSize: lotSize || 0.1,
            timeframe,
            strategy: strategy || workspace.strategy,
            notes,
            screenshot,
            riskRewardRatio,
            deviations,
            status: 'open',
            entryTime: new Date(),
        })

        await Journal.create({
            workspaceId,
            userId: session.user.id,
            tradeId: trade._id,
            type: 'auto',
            title: `${direction} XAUUSD @ ${entryPrice}`,
            content: `Opened ${direction} at ${entryPrice}. SL: ${stopLoss}, TP: ${takeProfit}. R:R = 1:${riskRewardRatio}.${deviations.length > 0 ? ' Deviations: ' + deviations.join(', ') : ''}`,
            screenshot,
        })

        return NextResponse.json({ trade, deviations }, { status: 201 })
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}