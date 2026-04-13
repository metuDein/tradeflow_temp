import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import connectDB from '@/lib/db'
import User from '@/models/User'
import Workspace from '@/models/Workspace'

export async function POST(request) {
    try {
        const { name, email, password } = await request.json()

        if (!name || !email || !password) {
            return NextResponse.json(
                { error: 'All fields are required' },
                { status: 400 }
            )
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: 'Password must be at least 6 characters' },
                { status: 400 }
            )
        }

        await connectDB()

        const existingUser = await User.findOne({ email })
        if (existingUser) {
            return NextResponse.json(
                { error: 'Email already registered' },
                { status: 400 }
            )
        }

        const hashedPassword = await bcrypt.hash(password, 12)

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
        })

        await Workspace.create({
            userId: user._id,
            name: 'My First Strategy',
            strategy: 'Supply & Demand',
            currencyPair: 'XAUUSD',
            startingBalance: 10000,
            currentBalance: 10000,
            rules: [
                'Only trade at supply or demand zones',
                'Minimum 1:2 risk to reward',
                'Only trade 1H timeframe and above',
                'No trading during high impact news',
            ],
        })

        return NextResponse.json(
            { message: 'Account created successfully' },
            { status: 201 }
        )
    } catch (error) {
        return NextResponse.json(
            { error: 'Something went wrong' },
            { status: 500 }
        )
    }
}