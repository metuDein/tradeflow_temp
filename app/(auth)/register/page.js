'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
    const router = useRouter()
    const [form, setForm] = useState({ name: '', email: '', password: '' })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.error)
                setLoading(false)
                return
            }

            router.push('/login?registered=true')
        } catch {
            setError('Something went wrong. Please try again.')
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 text-stone-800">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-900 rounded-xl mb-4">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M5 13L9 17L19 7" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-semibold text-gray-900">Create your account</h1>
                    <p className="text-gray-500 mt-1 text-sm">Start backtesting smarter with AI</p>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-8">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-6">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Full name
                            </label>
                            <input
                                type="text"
                                required
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                                placeholder="Tunde Kelani"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Email
                            </label>
                            <input
                                type="email"
                                required
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                                placeholder="you@example.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Password
                            </label>
                            <input
                                type="password"
                                required
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                                placeholder="Min. 6 characters"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gray-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating account...' : 'Create account'}
                        </button>
                    </form>

                    <p className="text-center text-sm text-gray-500 mt-6">
                        Already have an account?{' '}
                        <Link href="/login" className="text-gray-900 font-medium hover:underline">
                            Sign in
                        </Link>
                    </p>
                </div>

                <p className="text-center text-xs text-gray-400 mt-6">
                    A default Supply & Demand workspace will be created for you automatically.
                </p>
            </div>
        </div>
    )
}