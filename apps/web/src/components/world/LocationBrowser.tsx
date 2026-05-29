'use client'
import { useState } from 'react'
import { useQuery } from '@apollo/client/react'
import { LIST_LOCATIONS } from '@/lib/graphql/queries/world'
import { LocationCard } from './LocationCard'

interface Location {
  id: string
  name: string
  description: string
  services: string[]
}

interface ListLocationsData {
  locations: Location[]
}

export function LocationBrowser() {
  const [expanded, setExpanded] = useState<string | null>(null)
  const { data, loading } = useQuery<ListLocationsData>(LIST_LOCATIONS, { variables: { pageSize: 50 } })

  if (loading) {
    return <div className="text-silver text-center py-12">Carregando locais...</div>
  }

  return (
    <div className="space-y-2">
      {data?.locations.map((location: Location) => (
        <LocationCard
          key={location.id}
          location={location}
          isExpanded={expanded === location.name}
          onToggle={() => setExpanded(expanded === location.name ? null : location.name)}
        />
      ))}
    </div>
  )
}
