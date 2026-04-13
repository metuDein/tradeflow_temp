'use client'
import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

export default function DashboardLayout({ children }) {
    const { data: session, status } = useSession()
    const router = useRouter()
    const pathname = usePathname()
    const [collapsed, setCollapsed] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)

    useEffect(() => {
        if (status === 'unauthenticated') router.push('/login')
    }, [status, router])

    useEffect(() => {
        setMobileOpen(false)
    }, [pathname])

    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === 'b' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault()
                setCollapsed(p => !p)
            }
            if (e.key === 'Escape') setMobileOpen(false)
        }
        window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    }, [])

    if (status === 'loading') {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f9fafb',
            }}>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>Loading...</span>
            </div>
        )
    }

    const navItems = [
        {
            href: '/dashboard',
            label: 'Dashboard',
            icon: (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="2" y="2" width="5" height="5" rx="1" />
                    <rect x="9" y="2" width="5" height="5" rx="1" />
                    <rect x="2" y="9" width="5" height="5" rx="1" />
                    <rect x="9" y="9" width="5" height="5" rx="1" />
                </svg>
            ),
        },
        {
            href: '/backtest',
            label: 'Backtest',
            icon: (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M2 12L6 7l3 3 5-7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            ),
        },
        {
            href: '/journal',
            label: 'Journal',
            icon: (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="2" width="10" height="12" rx="1" />
                    <path d="M6 6h4M6 9h4M6 12h2" strokeLinecap="round" />
                </svg>
            ),
        },
        {
            href: '/replay',
            label: 'Replay',
            icon: (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="8" cy="8" r="6" />
                    <path d="M6 5.5l5 2.5-5 2.5V5.5z" fill="currentColor" stroke="none" />
                </svg>
            ),
        },
        {
            href: '/settings',
            label: 'Settings',
            icon: (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="8" cy="8" r="2" />
                    <path d="M8 2v1.5M8 12.5V14M2 8h1.5M12.5 8H14M3.8 3.8l1 1M11.2 11.2l1 1M12.2 3.8l-1 1M4.8 11.2l-1 1" strokeLinecap="round" />
                </svg>
            ),
        },
    ]

    const sidebarWidth = collapsed ? '56px' : '220px'

    const SidebarContent = () => (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
        }}>
            <div style={{
                padding: collapsed ? '14px 0' : '14px 16px',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'space-between',
                gap: '10px',
                flexShrink: 0,
            }}>
                {!collapsed && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '28px', height: '28px',
                            background: '#111827',
                            borderRadius: '8px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path d="M2 9L5 6L8 8L12 3" stroke="#4ade80" strokeWidth="2"
                                    strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <div>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: '#111' }}>TradeFlow</div>
                            <div style={{ fontSize: '11px', color: '#9ca3af' }}>XAUUSD</div>
                        </div>
                    </div>
                )}

                {collapsed && (
                    <div style={{
                        width: '28px', height: '28px',
                        background: '#111827',
                        borderRadius: '8px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M2 9L5 6L8 8L12 3" stroke="#4ade80" strokeWidth="2"
                                strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                )}

                {!collapsed && (
                    <button
                        onClick={() => setCollapsed(true)}
                        title="Collapse sidebar (Ctrl+B)"
                        style={{
                            background: 'none', border: 'none',
                            cursor: 'pointer', color: '#9ca3af',
                            padding: '4px', borderRadius: '6px',
                            display: 'flex', alignItems: 'center',
                            flexShrink: 0,
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M10 4L6 8l4 4" strokeLinecap="round" strokeLinejoin="round" />
                            <line x1="3" y1="2" x2="3" y2="14" strokeLinecap="round" />
                        </svg>
                    </button>
                )}
            </div>

            {!collapsed && (
                <div style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb', flexShrink: 0 }}>
                    <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Workspace
                    </div>
                    <div style={{
                        background: '#f9fafb',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '7px 10px',
                    }}>
                        <div style={{ fontSize: '12px', fontWeight: 500, color: '#111' }}>Supply & Demand</div>
                        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>Backtesting</div>
                    </div>
                </div>
            )}

            <nav style={{
                flex: 1,
                padding: collapsed ? '10px 6px' : '10px 8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
            }}>
                {navItems.map((item) => {
                    const active = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            title={collapsed ? item.label : undefined}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: collapsed ? 0 : '10px',
                                padding: collapsed ? '10px' : '9px 12px',
                                justifyContent: collapsed ? 'center' : 'flex-start',
                                borderRadius: '8px',
                                fontSize: '13px',
                                fontWeight: active ? 500 : 400,
                                color: active ? '#fff' : '#6b7280',
                                background: active ? '#111827' : 'transparent',
                                textDecoration: 'none',
                                transition: 'background 0.15s',
                            }}
                        >
                            <span style={{ opacity: active ? 1 : 0.7, flexShrink: 0 }}>
                                {item.icon}
                            </span>
                            {!collapsed && item.label}
                        </Link>
                    )
                })}
            </nav>

            {collapsed && (
                <div style={{
                    padding: '10px 6px',
                    borderTop: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}>
                    <button
                        onClick={() => setCollapsed(false)}
                        title="Expand sidebar (Ctrl+B)"
                        style={{
                            background: 'none', border: 'none',
                            cursor: 'pointer', color: '#9ca3af',
                            padding: '8px', borderRadius: '6px',
                            display: 'flex', alignItems: 'center',
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                            <line x1="3" y1="2" x2="3" y2="14" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>
            )}

            {!collapsed && (
                <div style={{
                    padding: '10px 12px',
                    borderTop: '1px solid #e5e7eb',
                    flexShrink: 0,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '30px', height: '30px',
                            borderRadius: '50%',
                            background: '#111827',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '12px', fontWeight: 600, color: '#fff',
                            flexShrink: 0,
                        }}>
                            {session?.user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                                fontSize: '13px', fontWeight: 500, color: '#111',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                                {session?.user?.name}
                            </div>
                            <div style={{ fontSize: '11px', color: '#9ca3af' }}>Free plan</div>
                        </div>
                        <button
                            onClick={() => signOut({ callbackUrl: '/login' })}
                            title="Sign out"
                            style={{
                                background: 'none', border: 'none',
                                cursor: 'pointer', color: '#9ca3af', padding: '4px',
                            }}
                        >
                            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M5 7.5h8M10 5l2.5 2.5L10 10" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M8 3H3a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h5" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {collapsed && (
                <div style={{
                    padding: '8px 6px',
                    borderTop: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}>
                    <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        title="Sign out"
                        style={{
                            background: 'none', border: 'none',
                            cursor: 'pointer', color: '#9ca3af', padding: '8px',
                        }}
                    >
                        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M5 7.5h8M10 5l2.5 2.5L10 10" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M8 3H3a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h5" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>
            )}
        </div>
    )

    return (
        <div style={{
            display: 'flex',
            height: '100vh',
            width: '100vw',
            overflow: 'hidden',
            background: '#f9fafb',
        }}>
            {mobileOpen && (
                <div
                    onClick={() => setMobileOpen(false)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.4)',
                        zIndex: 40,
                        display: 'none',
                    }}
                    className="mobile-overlay"
                />
            )}

            <style>{`
        @media (max-width: 768px) {
          .sidebar-desktop { display: none !important; }
          .mobile-topbar { display: flex !important; }
          .mobile-overlay { display: block !important; }
          .sidebar-mobile {
            transform: ${mobileOpen ? 'translateX(0)' : 'translateX(-100%)'} !important;
          }
        }
        @media (min-width: 769px) {
          .sidebar-mobile { display: none !important; }
          .mobile-topbar { display: none !important; }
        }
      `}</style>

            <aside
                className="sidebar-desktop"
                style={{
                    width: sidebarWidth,
                    background: '#fff',
                    borderRight: '1px solid #e5e7eb',
                    height: '100vh',
                    flexShrink: 0,
                    transition: 'width 0.2s ease',
                    overflow: 'hidden',
                }}
            >
                <SidebarContent />
            </aside>

            <aside
                className="sidebar-mobile"
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '220px',
                    height: '100vh',
                    background: '#fff',
                    borderRight: '1px solid #e5e7eb',
                    zIndex: 50,
                    transition: 'transform 0.2s ease',
                }}
            >
                <SidebarContent />
            </aside>

            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                minWidth: 0,
            }}>
                <div
                    className="mobile-topbar"
                    style={{
                        display: 'none',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 16px',
                        background: '#fff',
                        borderBottom: '1px solid #e5e7eb',
                        flexShrink: 0,
                    }}
                >
                    <button
                        onClick={() => setMobileOpen(p => !p)}
                        style={{
                            background: 'none', border: 'none',
                            cursor: 'pointer', color: '#111', padding: '4px',
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M3 5h14M3 10h14M3 15h14" strokeLinecap="round" />
                        </svg>
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                            width: '24px', height: '24px',
                            background: '#111827', borderRadius: '6px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                                <path d="M2 9L5 6L8 8L12 3" stroke="#4ade80" strokeWidth="2"
                                    strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#111' }}>TradeFlow</span>
                    </div>
                </div>

                <main style={{
                    flex: 1,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                }}>
                    {children}
                </main>
            </div>
        </div>
    )
}