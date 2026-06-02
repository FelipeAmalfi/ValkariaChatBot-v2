'use client'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/AuthContext'

export function Navbar() {
  const { player, isDM, token, logout } = useAuth()
  const isAuthenticated = !!token
  const logoHref = !token ? '/' : isDM ? '/dm' : '/chat'

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-sm bg-void/80 border-b border-shadow">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href={logoHref} className="font-display text-gold text-lg font-semibold tracking-wide">
          ⚔ Valkária
        </Link>

        {/* Center nav */}
        {isAuthenticated && (
          <div className="flex items-center gap-6">
            <Link
              href="/world"
              className="text-sm text-parchment/80 hover:text-parchment transition-colors"
            >
              Mundo
            </Link>
            {!isDM && (
              <Link
                href="/profile"
                className="text-sm text-parchment/80 hover:text-parchment transition-colors"
              >
                Perfil
              </Link>
            )}
          </div>
        )}

        {/* Right side */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <span className="text-sm text-parchment/70">
                {isDM ? 'Dungeon Master' : player?.name ?? 'Aventureiro'}
              </span>
              <button
                onClick={logout}
                className="text-sm px-3 py-1.5 rounded border border-shadow text-parchment/60 hover:text-parchment hover:border-mist transition-colors"
              >
                Sair
              </button>
            </>
          ) : (
            <Link
              href="/auth/login"
              className="text-sm px-3 py-1.5 rounded bg-gold text-void font-medium hover:bg-gold/80 transition-colors"
            >
              Entrar
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
