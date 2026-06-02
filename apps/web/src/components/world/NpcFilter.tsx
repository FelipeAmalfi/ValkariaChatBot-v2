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

interface FilterValue {
  location: string
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

  function handleLocation(location: string) {
    onChange({ ...value, location, page: 1 })
  }

  return (
    <aside className="w-48 shrink-0 space-y-4">
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
