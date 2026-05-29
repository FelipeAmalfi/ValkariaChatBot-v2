'use client'
import { useState, useRef, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useAuth } from '@/lib/auth/AuthContext'
import { useThreadId } from '@/lib/chat/useThreadId'
import { useNpcExtractor } from '@/lib/chat/useNpcExtractor'
import { MessageBubble } from './MessageBubble'
import { ChatInput } from './ChatInput'
import { TypingIndicator } from './TypingIndicator'

interface Message {
  id: string
  role: 'user' | 'narrator'
  content: string
  timestamp: Date
}

interface ChatWindowProps {
  onNpcMentioned: (npcName: string) => void
}

export function ChatWindow({ onNpcMentioned }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { token } = useAuth()
  const threadId = useThreadId()
  const { extractNpcName } = useNpcExtractor()

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  const handleSend = async (message: string) => {
    if (!threadId) return

    const userMsg: Message = {
      id: uuidv4(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMsg])
    setIsLoading(true)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-thread-id': threadId,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message }),
      })

      const data = await res.json()
      const response: string = data.response ?? data.message ?? ''

      const narratorMsg: Message = {
        id: uuidv4(),
        role: 'narrator',
        content: response,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, narratorMsg])

      const npcName = extractNpcName(response)
      if (npcName) onNpcMentioned(npcName)
    } catch {
      const errMsg: Message = {
        id: uuidv4(),
        role: 'narrator',
        content: 'O narrador não responde... tente novamente.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errMsg])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4"
      >
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-mist/40 text-sm font-display text-center">
              O que você faz, aventureiro?
            </p>
          </div>
        )}
        {messages.map(msg => (
          <MessageBubble key={msg.id} role={msg.role} content={msg.content} />
        ))}
        {isLoading && <TypingIndicator />}
      </div>

      <ChatInput onSend={handleSend} disabled={isLoading} />
    </div>
  )
}
