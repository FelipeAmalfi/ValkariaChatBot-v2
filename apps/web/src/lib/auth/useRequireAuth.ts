'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './AuthContext'

export function useRequireAuth() {
  const { token } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!token) router.push('/auth/login')
  }, [token, router])

  return !!token
}
