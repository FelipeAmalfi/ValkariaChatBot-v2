'use client'
import { useRequireAuth } from '@/lib/auth/useRequireAuth'
import { CharacterSheet } from '@/components/profile/CharacterSheet'

export default function ProfilePage() {
  const isAuthed = useRequireAuth()

  if (!isAuthed) return null

  return <CharacterSheet />
}
