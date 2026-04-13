import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request) {
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
    })

    const { pathname } = request.nextUrl

    const protectedRoutes = [
        '/dashboard',
        '/backtest',
        '/journal',
        '/replay',
        '/settings',
    ]

    const isProtected = protectedRoutes.some(route =>
        pathname.startsWith(route)
    )

    if (isProtected && !token) {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('callbackUrl', pathname)
        return NextResponse.redirect(loginUrl)
    }

    if (token && (pathname === '/login' || pathname === '/register')) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/backtest/:path*',
        '/journal/:path*',
        '/replay/:path*',
        '/settings/:path*',
        '/login',
        '/register',
    ],
}