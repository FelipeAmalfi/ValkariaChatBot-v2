'use client'
import { useState } from 'react'
import { ChatWindow } from './ChatWindow'
import { WorldContextPanel } from './WorldContextPanel'
import { Drawer, DrawerContent } from '@/components/ui/drawer'

export function ChatLayout() {
  const [worldContextNpc, setWorldContextNpc] = useState<string | null>(null)
  const [worldDrawerOpen, setWorldDrawerOpen] = useState(false)

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Left: Chat — 60% desktop, full mobile */}
      <div className="flex-1 lg:flex-[6] flex flex-col min-w-0">
        <ChatWindow onNpcMentioned={setWorldContextNpc} />
      </div>

      {/* Right: World Context — hidden on mobile */}
      <div className="hidden lg:flex lg:flex-[4] flex-col border-l border-shadow">
        <WorldContextPanel activeNpc={worldContextNpc} />
      </div>

      {/* Mobile: floating world button */}
      <button
        className="lg:hidden fixed bottom-24 right-4 z-50 bg-night border border-gold/40 rounded-full w-12 h-12 flex items-center justify-center"
        onClick={() => setWorldDrawerOpen(true)}
      >
        <span className="text-gold">🌍</span>
      </button>

      {/* Mobile: bottom drawer */}
      <Drawer open={worldDrawerOpen} onOpenChange={setWorldDrawerOpen}>
        <DrawerContent className="bg-void border-t border-shadow max-h-[80vh]">
          <WorldContextPanel activeNpc={worldContextNpc} />
        </DrawerContent>
      </Drawer>
    </div>
  )
}
