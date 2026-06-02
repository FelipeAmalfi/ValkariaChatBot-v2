'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'

export function AuthRedirect() {
  const { token, isDM, hydrated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!hydrated) return
    if (token) {
      router.replace(isDM ? '/dm' : '/chat')
    }
  }, [token, isDM, hydrated, router])

  return null
}
