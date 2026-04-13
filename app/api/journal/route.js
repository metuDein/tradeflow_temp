import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import connectDB from '@/lib/db'
import Journal from '@/models/Journal'

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const workspaceId = searchParams.get('workspaceId')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = 20

        await connectDB()

        const query = { userId: session.user.id }
        if (workspaceId) query.workspaceId = workspaceId

        const total = await Journal.countDocuments(query)
        const entries = await Journal.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('tradeId', 'direction entryPrice exitPrice pnl outcome riskRewardRatio')

        return NextResponse.json({ entries, total, pages: Math.ceil(total / limit), page })
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { workspaceId, title, content, mood, screenshot } = await request.json()
        if (!workspaceId || !content) {
            return NextResponse.json({ error: 'workspaceId and content are required' }, { status: 400 })
        }

        await connectDB()

        const entry = await Journal.create({
            workspaceId,
            userId: session.user.id,
            type: 'manual',
            title: title || 'Journal entry',
            content,
            mood,
            screenshot,
        })

        return NextResponse.json({ entry }, { status: 201 })
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}