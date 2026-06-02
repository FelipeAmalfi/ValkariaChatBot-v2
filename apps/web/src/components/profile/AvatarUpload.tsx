'use client'
import { useRef, useState } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'

interface AvatarUploadProps {
  currentUrl?: string
}

export function AvatarUpload({ currentUrl }: AvatarUploadProps) {
  const { login } = useAuth()
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function handleUpload() {
    const file = inputRef.current?.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const stored = localStorage.getItem('valkaria:token') ?? ''
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${stored}` },
        body: form,
      })
      if (!res.ok) throw new Error('upload failed')
      const data = await res.json() as { token: string }
      login(data.token)
      setPreview(null)
    } catch {
      alert('Erro ao enviar imagem.')
    } finally {
      setUploading(false)
    }
  }

  const displaySrc = preview ?? currentUrl

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative group w-20 h-20">
        {displaySrc ? (
          <img
            src={displaySrc}
            alt="avatar"
            className="w-20 h-20 rounded-full object-cover border-2 border-gold/40"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-void/60 border-2 border-gold/20 flex items-center justify-center">
            <svg width="36" height="36" viewBox="0 0 64 64" fill="none">
              <circle cx="32" cy="26" r="12" fill="#b8860b" fillOpacity="0.5" />
              <ellipse cx="32" cy="52" rx="20" ry="10" fill="#b8860b" fillOpacity="0.3" />
            </svg>
          </div>
        )}
        <button
          onClick={() => inputRef.current?.click()}
          className="absolute inset-0 rounded-full bg-void/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-gold text-xs"
        >
          ✎
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {preview && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="text-xs px-3 py-1 bg-gold/20 border border-gold/40 rounded text-gold hover:bg-gold/30 transition-colors disabled:opacity-50"
        >
          {uploading ? 'Enviando...' : 'Confirmar foto'}
        </button>
      )}
    </div>
  )
}
