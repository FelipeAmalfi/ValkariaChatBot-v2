'use client'
import { useState } from 'react'
import { useQuery } from '@apollo/client/react'
import { cn } from '@/lib/utils'
import { LIST_ALL_PLAYERS } from '@/lib/graphql/queries/dm'
import type { PlayerProfile } from './DmDashboard'

const PAGE_SIZE = 15

interface PlayerTableProps {
  onSelectPlayer: (player: PlayerProfile) => void
  selectedPlayer: PlayerProfile | null
}

interface ListAllPlayersData {
  players: PlayerProfile[]
}

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(iso))

export function PlayerTable({ onSelectPlayer, selectedPlayer }: PlayerTableProps) {
  const [page, setPage] = useState(1)

  const { data, loading } = useQuery<ListAllPlayersData>(LIST_ALL_PLAYERS, {
    variables: { page, pageSize: PAGE_SIZE },
  })

  return (
    <div className="bg-night/60 border border-shadow rounded-lg p-6">
      <h2 className="font-display text-gold text-xl mb-4">Jogadores Registrados</h2>

      {loading ? (
        <div className="text-silver text-center py-12">Carregando jogadores...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-shadow">
                <th className="text-left text-silver text-sm font-display py-3 pr-4">Nome</th>
                <th className="text-left text-silver text-sm font-display py-3 pr-4">Classe</th>
                <th className="text-left text-silver text-sm font-display py-3 pr-4">Raça</th>
                <th className="text-left text-silver text-sm font-display py-3">Registro</th>
              </tr>
            </thead>
            <tbody>
              {data?.players.map(player => (
                <tr
                  key={player.id}
                  onClick={() => onSelectPlayer(player)}
                  className={cn(
                    'border-b border-shadow/50 cursor-pointer transition-colors',
                    selectedPlayer?.id === player.id
                      ? 'bg-gold/10 text-parchment'
                      : 'hover:bg-night text-parchment/80'
                  )}
                >
                  <td className="py-3 pr-4 font-display text-gold">{player.name}</td>
                  <td className="py-3 pr-4 text-sm">{player.class}</td>
                  <td className="py-3 pr-4 text-sm">{player.race}</td>
                  <td className="py-3 text-sm text-silver">{formatDate(player.createdAt)}</td>
                </tr>
              ))}
              {data?.players.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-silver text-sm">
                    Nenhum jogador registrado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-center gap-2 mt-6">
        <button
          onClick={() => setPage(p => p - 1)}
          disabled={page === 1}
          className="px-4 py-2 bg-night border border-shadow rounded disabled:opacity-30 text-silver hover:border-gold/50 transition-colors"
        >
          ←
        </button>
        <span className="px-4 py-2 text-silver">Página {page}</span>
        <button
          onClick={() => setPage(p => p + 1)}
          disabled={(data?.players.length ?? 0) < PAGE_SIZE}
          className="px-4 py-2 bg-night border border-shadow rounded disabled:opacity-30 text-silver hover:border-gold/50 transition-colors"
        >
          →
        </button>
      </div>
    </div>
  )
}
