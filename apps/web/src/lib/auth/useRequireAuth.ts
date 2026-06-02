'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './AuthContext'

export function useRequireAuth() {
  const { token, hydrated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (hydrated && !token) router.push('/auth/login')
  }, [token, hydrated, router])

  return !!token
}
