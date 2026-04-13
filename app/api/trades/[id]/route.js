import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import connectDB from '@/lib/db'
import Trade from '@/models/Trade'
import Workspace from '@/models/Workspace'
import Journal from '@/models/Journal'
import { analyzeTradeAI } from '@/lib/ai'

export async function PATCH(request, { params }) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { exitPrice, screenshot, partial, partialPercent } = await request.json()
        if (!exitPrice) return NextResponse.json({ error: 'exitPrice is required' }, { status: 400 })

        await connectDB()

        const trade = await Trade.findById(params.id)
        if (!trade) return NextResponse.json({ error: 'Trade not found' }, { status: 404 })
        if (trade.status === 'closed') return NextResponse.json({ error: 'Trade already closed' }, { status: 400 })

        const pipValue = trade.lotSize * 100
        let pnl = 0

        if (trade.direction === 'BUY') {
            pnl = parseFloat(((exitPrice - trade.entryPrice) * pipValue).toFixed(2))
        } else {
            pnl = parseFloat(((trade.entryPrice - exitPrice) * pipValue).toFixed(2))
        }

        if (partial && partialPercent) {
            pnl = parseFloat((pnl * (partialPercent / 100)).toFixed(2))
        }

        let outcome = 'breakeven'
        if (pnl > 0) outcome = 'win'
        else if (pnl < 0) outcome = 'loss'

        trade.exitPrice = exitPrice
        trade.exitTime = new Date()
        trade.status = partial ? 'open' : 'closed'
        trade.outcome = partial ? trade.outcome : outcome
        trade.pnl = parseFloat(((trade.pnl || 0) + pnl).toFixed(2))
        if (screenshot) trade.screenshot = screenshot
        await trade.save()

        const workspace = await Workspace.findById(trade.workspaceId)
        if (workspace) {
            workspace.currentBalance = parseFloat(
                (workspace.currentBalance + pnl).toFixed(2)
            )
            await workspace.save()
        }

        let aiAnalysis = null
        if (!partial) {
            aiAnalysis = await analyzeTradeAI(trade, workspace?.rules)
            trade.aiAnalysis = aiAnalysis
            await trade.save()
        }

        await Journal.create({
            workspaceId: trade.workspaceId,
            userId: session.user.id,
            tradeId: trade._id,
            type: 'auto',
            title: partial
                ? `Partial close ${partialPercent}% @ ${exitPrice}`
                : `Closed ${trade.direction} @ ${exitPrice} — ${outcome.toUpperCase()}`,
            content: partial
                ? `Closed ${partialPercent}% of position at ${exitPrice}. Partial P&L: ${pnl >= 0 ? '+' : ''}$${pnl}.`
                : `Exited at ${exitPrice}. P&L: ${pnl >= 0 ? '+' : ''}$${pnl}. R:R: 1:${trade.riskRewardRatio}.`,
            screenshot,
            aiSummary: aiAnalysis,
        })

        return NextResponse.json({ trade, aiAnalysis })
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function DELETE(request, { params }) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        await connectDB()
        await Trade.findByIdAndDelete(params.id)
        return NextResponse.json({ message: 'Trade deleted' })
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}