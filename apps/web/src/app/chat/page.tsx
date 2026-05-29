'use client'
import { useRequireAuth } from '@/lib/auth/useRequireAuth'
import { ChatLayout } from '@/components/chat/ChatLayout'

export default function ChatPage() {
  useRequireAuth()
  return <ChatLayout />
}
