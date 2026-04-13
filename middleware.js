export { default } from 'next-auth/middleware'

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/backtest/:path*',
        '/journal/:path*',
        '/replay/:path*',
    ],
}