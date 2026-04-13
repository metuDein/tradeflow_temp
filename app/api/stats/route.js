import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import connectDB from '@/lib/db'
import Trade from '@/models/Trade'
import Workspace from '@/models/Workspace'
// import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'

export async function GET(request) {
    try {
        // const session = await getServerSession()
        const session = await getServerSession(authOptions)
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const workspaceId = searchParams.get('workspaceId')

        await connectDB()

        const workspace = await Workspace.findById(workspaceId)
        if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

        const allTrades = await Trade.find({ workspaceId, status: 'closed' })
        const openTrades = await Trade.find({ workspaceId, status: 'open' })

        const totalTrades = allTrades.length
        const wins = allTrades.filter(t => t.outcome === 'win').length
        const losses = allTrades.filter(t => t.outcome === 'loss').length
        const breakevens = allTrades.filter(t => t.outcome === 'breakeven').length
        const winRate = totalTrades > 0 ? parseFloat(((wins / totalTrades) * 100).toFixed(1)) : 0

        const totalPnl = parseFloat(allTrades.reduce((sum, t) => sum + (t.pnl || 0), 0).toFixed(2))
        const avgWin = wins > 0
            ? parseFloat((allTrades.filter(t => t.outcome === 'win').reduce((s, t) => s + t.pnl, 0) / wins).toFixed(2))
            : 0
        const avgLoss = losses > 0
            ? parseFloat((allTrades.filter(t => t.outcome === 'loss').reduce((s, t) => s + t.pnl, 0) / losses).toFixed(2))
            : 0

        const profitFactor = Math.abs(avgLoss) > 0
            ? parseFloat((avgWin / Math.abs(avgLoss)).toFixed(2))
            : 0

        const avgRR = totalTrades > 0
            ? parseFloat((allTrades.reduce((s, t) => s + (t.riskRewardRatio || 0), 0) / totalTrades).toFixed(2))
            : 0

        const strategyBreakdown = {}
        allTrades.forEach(t => {
            const key = t.strategy || 'Unknown'
            if (!strategyBreakdown[key]) {
                strategyBreakdown[key] = { trades: 0, wins: 0, losses: 0, pnl: 0, winRate: 0 }
            }
            strategyBreakdown[key].trades++
            strategyBreakdown[key].pnl = parseFloat((strategyBreakdown[key].pnl + (t.pnl || 0)).toFixed(2))
            if (t.outcome === 'win') strategyBreakdown[key].wins++
            if (t.outcome === 'loss') strategyBreakdown[key].losses++
        })

        Object.keys(strategyBreakdown).forEach(key => {
            const s = strategyBreakdown[key]
            s.winRate = s.trades > 0 ? parseFloat(((s.wins / s.trades) * 100).toFixed(1)) : 0
        })

        const recentTrades = await Trade.find({ workspaceId })
            .sort({ entryTime: -1 })
            .limit(8)

        const pnlOverTime = allTrades
            .sort((a, b) => new Date(a.exitTime) - new Date(b.exitTime))
            .reduce((acc, t, i) => {
                const prev = acc[i - 1]?.balance || workspace.startingBalance
                acc.push({
                    trade: i + 1,
                    balance: parseFloat((prev + (t.pnl || 0)).toFixed(2)),
                    pnl: t.pnl,
                    outcome: t.outcome,
                })
                return acc
            }, [])

        const periodCovered = workspace.startDate && workspace.endDate
            ? (() => {
                const start = new Date(workspace.startDate)
                const end = new Date(workspace.endDate)
                const last = allTrades.length > 0
                    ? new Date(allTrades[allTrades.length - 1].exitTime)
                    : start
                const total = end - start
                const covered = last - start
                return total > 0 ? parseFloat(((covered / total) * 100).toFixed(1)) : 0
            })()
            : 0

        return NextResponse.json({
            workspace: {
                name: workspace.name,
                strategy: workspace.strategy,
                startingBalance: workspace.startingBalance,
                currentBalance: workspace.currentBalance,
                periodCovered,
            },
            stats: {
                totalTrades,
                openTrades: openTrades.length,
                wins,
                losses,
                breakevens,
                winRate,
                totalPnl,
                avgWin,
                avgLoss,
                profitFactor,
                avgRR,
            },
            strategyBreakdown,
            recentTrades,
            pnlOverTime,
        })
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}