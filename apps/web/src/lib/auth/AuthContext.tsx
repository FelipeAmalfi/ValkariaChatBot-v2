'use client'
import { createContext, useContext, useState, useEffect, useCallback } from 'react'

interface Player {
  id: string
  name: string
  class: string
  race: string
  background?: string
  personality?: string
  interests?: string
  avatarUrl?: string
}

interface AuthState {
  token: string | null
  player: Player | null
  isDM: boolean
  hydrated: boolean
  login: (token: string, player?: Player) => void
  loginAsDM: (token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthState>({
  token: null,
  player: null,
  isDM: false,
  hydrated: false,
  login: () => {},
  loginAsDM: () => {},
  logout: () => {},
})

function parseJwtClaims(token: string): Record<string, unknown> {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload))
  } catch {
    return {}
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [player, setPlayer] = useState<Player | null>(null)
  const [isDM, setIsDM] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('valkaria:token')
    if (stored) {
      const claims = parseJwtClaims(stored)
      setToken(stored)
      setIsDM(claims.role === 'DM')
      if (claims.player && typeof claims.player === 'object') {
        setPlayer(claims.player as Player)
      }
    }
    setHydrated(true)
  }, [])

  const login = useCallback((newToken: string, newPlayer?: Player) => {
    localStorage.setItem('valkaria:token', newToken)
    setToken(newToken)
    setIsDM(false)
    if (newPlayer) {
      setPlayer(newPlayer)
    } else {
      const claims = parseJwtClaims(newToken)
      if (claims.player && typeof claims.player === 'object') {
        setPlayer(claims.player as Player)
      }
    }
  }, [])

  const loginAsDM = useCallback((newToken: string) => {
    localStorage.setItem('valkaria:token', newToken)
    setToken(newToken)
    setIsDM(true)
    setPlayer(null)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('valkaria:token')
    setToken(null)
    setPlayer(null)
    setIsDM(false)
  }, [])

  return (
    <AuthContext.Provider value={{ token, player, isDM, hydrated, login, loginAsDM, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
