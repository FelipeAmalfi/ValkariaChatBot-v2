'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'
import { DmDashboard } from '@/components/dm/DmDashboard'

export default function DmPage() {
  const { isDM, token, hydrated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!hydrated) return
    if (token && !isDM) router.push('/chat')
    if (!token) router.push('/auth/dm')
  }, [token, isDM, hydrated, router])

  if (!hydrated || !isDM) return null
  return <DmDashboard />
}
