'use client'
import { PageTransition } from '@/components/layout/PageTransition'
import { WorldExplorer } from '@/components/world/WorldExplorer'

export default function WorldPage() {
  return (
    <PageTransition>
      <WorldExplorer />
    </PageTransition>
  )
}
