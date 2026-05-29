'use client'
import { useQuery } from '@apollo/client/react'
import { cn } from '@/lib/utils'
import { LIST_NPCS } from '@/lib/graphql/queries/world'

interface ListNpcsData {
  npcs: { name: string }[]
}

const FACTIONS = [
  {
    id: 'valkaria_order',
    name: 'Ordem de Valkária',
    motto: '"Honra e proteção acima de tudo."',
    description: 'Cavaleiros e guardiões da lei em Candessah. Protegem os inocentes e mantêm a ordem.',
    color: 'border-blue-500/50',
    headerColor: 'text-blue-400',
    icon: '⚔',
  },
  {
    id: 'shadow_guild',
    name: 'Guilda das Sombras',
    motto: '"Informação é poder. Poder é sobrevivência."',
    description: 'Rede de espiões, ladrões e negociadores de segredos. Operam nas sombras de Candessah.',
    color: 'border-purple-700/50',
    headerColor: 'text-purple-400',
    icon: '🗡',
  },
  {
    id: 'merchant_league',
    name: 'Liga Mercante',
    motto: '"Todo acordo tem um preço justo."',
    description: 'Comerciantes e banqueiros que controlam o fluxo de riqueza pela cidade.',
    color: 'border-yellow-600/50',
    headerColor: 'text-yellow-400',
    icon: '⚖',
  },
  {
    id: 'free_cities',
    name: 'Cidades Livres',
    motto: '"Nenhuma corrente nos prende."',
    description: 'Aventureiros e independentes que não devem lealdade a nenhuma facção.',
    color: 'border-green-700/50',
    headerColor: 'text-green-400',
    icon: '🗺',
  },
]

function FactionCard({ faction }: { faction: typeof FACTIONS[0] }) {
  const { data } = useQuery<ListNpcsData>(LIST_NPCS, {
    variables: { faction: faction.id, pageSize: 100 },
  })
  const count = data?.npcs?.length ?? '...'

  return (
    <div className={cn('bg-card border rounded-lg p-6 flex flex-col gap-3', faction.color)}>
      <div className="flex items-center gap-3">
        <span className="text-3xl">{faction.icon}</span>
        <h3 className={cn('font-display text-lg', faction.headerColor)}>{faction.name}</h3>
      </div>
      <p className="text-silver text-sm italic">{faction.motto}</p>
      <p className="text-mist text-sm flex-1">{faction.description}</p>
      <p className="text-xs text-silver mt-auto">
        <span className={cn('font-semibold', faction.headerColor)}>{count}</span> membros conhecidos
      </p>
    </div>
  )
}

export function FactionOverview() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {FACTIONS.map(faction => (
        <FactionCard key={faction.id} faction={faction} />
      ))}
    </div>
  )
}
