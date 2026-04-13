import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import connectDB from '@/lib/db'
import Workspace from '@/models/Workspace'
import Trade from '@/models/Trade'
import Journal from '@/models/Journal'

export async function GET(request, { params }) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        await connectDB()
        const workspace = await Workspace.findById(params.id)
        if (!workspace) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        return NextResponse.json({ workspace })
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function PATCH(request, { params }) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        const body = await request.json()
        await connectDB()
        const workspace = await Workspace.findByIdAndUpdate(
            params.id,
            { $set: body },
            { new: true }
        )
        if (!workspace) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        return NextResponse.json({ workspace })
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function DELETE(request, { params }) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        await connectDB()
        await Workspace.findByIdAndDelete(params.id)
        await Trade.deleteMany({ workspaceId: params.id })
        await Journal.deleteMany({ workspaceId: params.id })
        return NextResponse.json({ message: 'Workspace deleted' })
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}