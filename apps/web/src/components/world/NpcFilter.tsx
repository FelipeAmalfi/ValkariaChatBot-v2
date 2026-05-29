'use client'
import { useQuery } from '@apollo/client/react'
import { LIST_LOCATIONS } from '@/lib/graphql/queries/world'

interface Location {
  id: string
  name: string
}

interface ListLocationsData {
  locations: Location[]
}

const FACTIONS = [
  { value: '', label: 'Todas' },
  { value: 'valkaria_order', label: 'Ordem de Valkária' },
  { value: 'shadow_guild', label: 'Guilda das Sombras' },
  { value: 'merchant_league', label: 'Liga Mercante' },
  { value: 'free_cities', label: 'Cidades Livres' },
  { value: 'neutral', label: 'Neutro' },
]

interface FilterValue {
  location: string
  faction: string
  page: number
}

interface NpcFilterProps {
  value: FilterValue
  onChange: (v: FilterValue) => void
}

export function NpcFilter({ value, onChange }: NpcFilterProps) {
  const { data: locationsData } = useQuery<ListLocationsData>(LIST_LOCATIONS, {
    variables: { pageSize: 50 },
  })

  function handleFaction(faction: string) {
    onChange({ ...value, faction, page: 1 })
  }

  function handleLocation(location: string) {
    onChange({ ...value, location, page: 1 })
  }

  return (
    <aside className="w-48 shrink-0 space-y-4">
      <div>
        <label className="text-silver text-xs uppercase tracking-wider mb-2 block">Facção</label>
        <div className="space-y-1">
          {FACTIONS.map(f => (
            <button
              key={f.value}
              onClick={() => handleFaction(f.value)}
              className={`w-full text-left px-3 py-1.5 text-sm rounded transition-colors ${
                value.faction === f.value
                  ? 'bg-shadow text-parchment'
                  : 'text-silver hover:bg-shadow/50 hover:text-parchment'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-silver text-xs uppercase tracking-wider mb-2 block">Local</label>
        <select
          value={value.location}
          onChange={e => handleLocation(e.target.value)}
          className="w-full bg-night border border-shadow text-parchment text-sm rounded px-2 py-1.5 focus:outline-none focus:border-mist"
        >
          <option value="">Todos</option>
          {locationsData?.locations.map((loc) => (
            <option key={loc.id} value={loc.name}>
              {loc.name}
            </option>
          ))}
        </select>
      </div>
    </aside>
  )
}
