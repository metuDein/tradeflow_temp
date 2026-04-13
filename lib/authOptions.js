import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import connectDB from '@/lib/db'
import User from '@/models/User'

export const authOptions = {
    providers: [
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                try {
                    await connectDB()
                    const user = await User.findOne({ email: credentials.email })
                    if (!user) throw new Error('No user found with this email')
                    const isValid = await bcrypt.compare(credentials.password, user.password)
                    if (!isValid) throw new Error('Invalid password')
                    return {
                        id: user._id.toString(),
                        name: user.name,
                        email: user.email,
                        plan: user.plan,
                    }
                } catch (error) {
                    throw new Error(error.message)
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.plan = user.plan
            }
            return token
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id
                session.user.plan = token.plan
            }
            return session
        },
    },
    pages: {
        signIn: '/login',
        error: '/login',
    },
    session: {
        strategy: 'jwt',
    },
    secret: process.env.NEXTAUTH_SECRET,
}