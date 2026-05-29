'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'
import { DmDashboard } from '@/components/dm/DmDashboard'

export default function DmPage() {
  const { isDM, token } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (token && !isDM) router.push('/chat')
    if (!token) router.push('/auth/dm')
  }, [token, isDM, router])

  if (!isDM) return null
  return <DmDashboard />
}
