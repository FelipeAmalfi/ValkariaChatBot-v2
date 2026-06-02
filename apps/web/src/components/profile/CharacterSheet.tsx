'use client'
import { useState } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import { AvatarUpload } from './AvatarUpload'
import { CharacterEditForm } from './CharacterEditForm'
import { NarrativeBlock } from './NarrativeBlock'
import { AffinityEditTable } from './AffinityEditTable'

export function CharacterSheet() {
  const { player } = useAuth()
  const [editMode, setEditMode] = useState(false)

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-gold/30 pb-6 mb-8">
        <div className="flex items-center gap-6">
          <AvatarUpload currentUrl={player?.avatarUrl} />
          <div>
            <h1 className="font-display text-4xl text-gold">{player?.name}</h1>
            <p className="text-silver text-lg mt-1">{player?.class} · {player?.race}</p>
          </div>
        </div>
        {!editMode && (
          <button
            onClick={() => setEditMode(true)}
            className="px-4 py-2 border border-gold/30 rounded text-gold/70 text-sm hover:text-gold hover:border-gold/60 transition-colors"
          >
            Editar Perfil
          </button>
        )}
      </div>

      {/* Narrative fields */}
      {editMode ? (
        <CharacterEditForm
          background={player?.background}
          personality={player?.personality}
          interests={player?.interests}
          onSaved={() => setEditMode(false)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <NarrativeBlock title="Antecedente" content={player?.background} />
          <NarrativeBlock title="Personalidade" content={player?.personality} />
          <NarrativeBlock title="Interesses" content={player?.interests} className="md:col-span-2" />
        </div>
      )}

      {/* Affinity section */}
      <div className="mt-10">
        <div className="flex items-center gap-4 mb-6 text-gold/40">
          <div className="flex-1 h-px bg-gold/20" />
          <span className="font-display text-gold text-lg tracking-widest">Relações</span>
          <div className="flex-1 h-px bg-gold/20" />
        </div>
        <AffinityEditTable />
      </div>
    </div>
  )
}
