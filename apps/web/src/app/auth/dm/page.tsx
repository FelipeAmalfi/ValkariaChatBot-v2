'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'

export default function DMLoginPage() {
  const router = useRouter()
  const { loginAsDM } = useAuth()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/dm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) throw new Error('unauthorized')
      const data = await res.json() as { token: string }
      loginAsDM(data.token)
      router.push('/dm')
    } catch {
      setError('Senha incorreta.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <form onSubmit={handleSubmit} className="bg-night/80 border border-gold/10 rounded-xl p-8 backdrop-blur-sm space-y-4">
          <h1 className="text-xl font-display text-silver mb-6">Acesso do Mestre</h1>
          <div>
            <label className="block text-silver text-sm mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(null) }}
              className="w-full bg-night border border-gold/20 rounded-lg px-4 py-2 text-parchment focus:outline-none focus:border-gold/60 transition-colors"
              placeholder="Senha do Mestre"
              autoFocus
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full px-6 py-2 bg-night border border-gold/20 rounded-lg text-silver hover:text-parchment hover:border-gold/40 transition-colors disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar como Mestre'}
          </button>
        </form>
      </div>
    </div>
  )
}
