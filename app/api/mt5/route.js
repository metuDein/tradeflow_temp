import { NextResponse } from 'next/server'
import connectDB from '@/lib/db'
import Trade from '@/models/Trade'
import Workspace from '@/models/Workspace'
import Journal from '@/models/Journal'
import { analyzeTradeAI, checkStrategyDeviation } from '@/lib/ai'

const MT5_SECRET = process.env.MT5_SECRET || 'tradeflow_mt5_secret'

export async function POST(request) {
    try {
        const authHeader = request.headers.get('x-mt5-secret')
        if (authHeader !== MT5_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const {
            action,
            ticket,
            symbol,
            direction,
            entryPrice,
            exitPrice,
            stopLoss,
            takeProfit,
            lotSize,
            pnl,
            openTime,
            closeTime,
            workspaceId,
            userId,
        } = body

        await connectDB()

        if (action === 'open') {
            const workspace = await Workspace.findById(workspaceId)

            const slDistance = Math.abs(entryPrice - stopLoss)
            const tpDistance = Math.abs(takeProfit - entryPrice)
            const riskRewardRatio = slDistance > 0
                ? parseFloat((tpDistance / slDistance).toFixed(2))
                : 0

            const deviations = workspace
                ? await checkStrategyDeviation(
                    { direction, entryPrice, stopLoss, takeProfit, timeframe: '1h' },
                    workspace.rules
                )
                : []

            const trade = await Trade.create({
                workspaceId,
                userId,
                direction,
                entryPrice,
                stopLoss,
                takeProfit,
                lotSize,
                riskRewardRatio,
                deviations,
                status: 'open',
                entryTime: openTime ? new Date(openTime) : new Date(),
                notes: `MT5 trade #${ticket}`,
                strategy: workspace?.strategy || 'MT5',
                timeframe: '1h',
            })

            await Journal.create({
                workspaceId,
                userId,
                tradeId: trade._id,
                type: 'auto',
                title: `MT5 ${direction} XAUUSD @ ${entryPrice}`,
                content: `MT5 trade opened. Ticket: ${ticket}. Entry: ${entryPrice}, SL: ${stopLoss}, TP: ${takeProfit}. R:R = 1:${riskRewardRatio}.${deviations.length > 0 ? ' Deviations: ' + deviations.join(', ') : ''}`,
            })

            return NextResponse.json({ trade, deviations }, { status: 201 })
        }

        if (action === 'close') {
            const trade = await Trade.findOne({
                notes: { $regex: `MT5 trade #${ticket}` },
                status: 'open',
            })

            if (!trade) {
                return NextResponse.json({ error: 'Trade not found' }, { status: 404 })
            }

            let outcome = 'breakeven'
            if (pnl > 0) outcome = 'win'
            else if (pnl < 0) outcome = 'loss'

            trade.exitPrice = exitPrice
            trade.exitTime = closeTime ? new Date(closeTime) : new Date()
            trade.status = 'closed'
            trade.outcome = outcome
            trade.pnl = parseFloat(pnl.toFixed(2))
            await trade.save()

            const workspace = await Workspace.findById(trade.workspaceId)
            if (workspace) {
                workspace.currentBalance = parseFloat(
                    (workspace.currentBalance + pnl).toFixed(2)
                )
                await workspace.save()
            }

            const aiAnalysis = await analyzeTradeAI(trade, workspace?.rules)
            trade.aiAnalysis = aiAnalysis
            await trade.save()

            await Journal.create({
                workspaceId: trade.workspaceId,
                userId: trade.userId,
                tradeId: trade._id,
                type: 'auto',
                title: `MT5 closed ${trade.direction} @ ${exitPrice} — ${outcome.toUpperCase()}`,
                content: `MT5 trade closed. Ticket: ${ticket}. Exit: ${exitPrice}. P&L: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}.`,
                aiSummary: aiAnalysis,
            })

            return NextResponse.json({ trade, aiAnalysis })
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function GET() {
    return NextResponse.json({ status: 'TradeFlow MT5 Bridge active' })
}