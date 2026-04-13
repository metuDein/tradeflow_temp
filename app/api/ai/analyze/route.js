import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import connectDB from '@/lib/db'
import Trade from '@/models/Trade'
import Workspace from '@/models/Workspace'
import { analyzeTradeAI, generateJournalSummary } from '@/lib/ai'
import { authOptions } from '@/lib/authOptions'

export async function POST(request) {
    try {

        const session = await getServerSession(authOptions)
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { tradeId, workspaceId, type } = await request.json()

        await connectDB()

        if (type === 'trade' && tradeId) {
            const trade = await Trade.findById(tradeId)
            if (!trade) return NextResponse.json({ error: 'Trade not found' }, { status: 404 })

            const workspace = await Workspace.findById(trade.workspaceId)
            const analysis = await analyzeTradeAI(trade, workspace?.rules)

            trade.aiAnalysis = analysis
            await trade.save()

            return NextResponse.json({ analysis })
        }

        if (type === 'summary' && workspaceId) {
            const trades = await Trade.find({
                workspaceId,
                status: 'closed',
            }).sort({ exitTime: -1 }).limit(20)

            if (trades.length === 0) {
                return NextResponse.json({
                    analysis: 'No closed trades yet. Start backtesting to get AI insights.'
                })
            }

            const summary = await generateJournalSummary(trades)
            return NextResponse.json({ analysis: summary })
        }

        return NextResponse.json({ error: 'Invalid request type' }, { status: 400 })
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}