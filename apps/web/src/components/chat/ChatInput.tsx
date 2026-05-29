'use client'
import { useState, useRef, useCallback } from 'react'

interface ChatInputProps {
  onSend: (message: string) => void
  disabled: boolean
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value)
    adjustHeight()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSend = () => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const charCount = value.length
  const showCharCount = charCount > 400

  return (
    <div className="border-t border-shadow px-4 py-3 bg-night/50 flex-shrink-0">
      <div className="flex gap-2 items-end">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="O que você faz ou diz..."
            rows={1}
            className="w-full bg-void/80 border border-shadow rounded-lg px-3 py-2 text-parchment placeholder-mist/40 text-sm resize-none overflow-y-auto focus:outline-none focus:border-gold/40 transition-colors disabled:opacity-50"
            style={{ maxHeight: '120px' }}
          />
          {showCharCount && (
            <span
              className={`absolute bottom-2 right-2 text-xs pointer-events-none ${charCount > 490 ? 'text-ember' : 'text-silver/40'}`}
            >
              {charCount}/500
            </span>
          )}
        </div>
        <button
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          className="w-9 h-9 rounded-lg bg-gold/20 border border-gold/40 flex items-center justify-center text-gold hover:bg-gold/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 mb-0.5"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
