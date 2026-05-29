'use client'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { NpcGallery } from './NpcGallery'
import { LocationBrowser } from './LocationBrowser'
import { FactionOverview } from './FactionOverview'

export function WorldExplorer() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-display text-3xl text-gold mb-2">O Mundo de Valkária</h1>
      <p className="text-silver mb-8">Explore Candessah e seus habitantes</p>

      <Tabs defaultValue="npcs">
        <TabsList className="bg-night border border-shadow mb-6">
          <TabsTrigger value="npcs">Personagens</TabsTrigger>
          <TabsTrigger value="locations">Locais</TabsTrigger>
          <TabsTrigger value="factions">Facções</TabsTrigger>
        </TabsList>

        <TabsContent value="npcs">
          <NpcGallery />
        </TabsContent>
        <TabsContent value="locations">
          <LocationBrowser />
        </TabsContent>
        <TabsContent value="factions">
          <FactionOverview />
        </TabsContent>
      </Tabs>
    </div>
  )
}
