'use client'
import { useState } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'

interface CharacterEditFormProps {
  background?: string
  personality?: string
  interests?: string
  onSaved: () => void
}

export function CharacterEditForm({ background, personality, interests, onSaved }: CharacterEditFormProps) {
  const { login } = useAuth()
  const [form, setForm] = useState({ background: background ?? '', personality: personality ?? '', interests: interests ?? '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const stored = localStorage.getItem('valkaria:token') ?? ''
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${stored}` },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('save failed')
      const data = await res.json() as { token: string }
      login(data.token)
      onSaved()
    } catch {
      setError('Erro ao salvar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {(['background', 'personality', 'interests'] as const).map(field => {
        const labels = { background: 'Antecedente', personality: 'Personalidade', interests: 'Interesses' }
        return (
          <div key={field}>
            <label className="block text-silver text-xs uppercase tracking-wider mb-1">{labels[field]}</label>
            <textarea
              value={form[field]}
              onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
              rows={3}
              className="w-full bg-night border border-gold/20 rounded-lg px-4 py-2 text-parchment text-sm focus:outline-none focus:border-gold/60 transition-colors resize-none"
            />
          </div>
        )
      })}
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-gold/20 border border-gold/40 rounded text-gold text-sm hover:bg-gold/30 transition-colors disabled:opacity-50"
        >
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
        <button
          onClick={onSaved}
          className="px-4 py-2 border border-shadow rounded text-silver text-sm hover:text-parchment transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
