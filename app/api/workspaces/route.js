import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import connectDB from '@/lib/db'
import Workspace from '@/models/Workspace'

export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        await connectDB()
        const workspaces = await Workspace.find({ userId: session.user.id })
        return NextResponse.json({ workspaces })
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { name, strategy, currencyPair, startDate, endDate, startingBalance, rules } = await request.json()

        if (!name || !strategy) {
            return NextResponse.json({ error: 'Name and strategy are required' }, { status: 400 })
        }

        await connectDB()

        const workspace = await Workspace.create({
            userId: session.user.id,
            name,
            strategy,
            currencyPair: currencyPair || 'XAUUSD',
            startDate,
            endDate,
            startingBalance: startingBalance || 10000,
            currentBalance: startingBalance || 10000,
            rules: rules || [],
        })

        return NextResponse.json({ workspace }, { status: 201 })
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}