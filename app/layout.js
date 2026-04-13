import { Inter } from 'next/font/google'
import './globals.css'
import AuthProvider from '@/components/ui/SessionProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'TradeFlow — XAUUSD Backtesting & Journal',
  description: 'AI-powered trading journal and backtesting platform',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={"`${inter.className}` text-stone-800"}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}