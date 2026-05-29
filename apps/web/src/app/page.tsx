import Link from 'next/link'
import { ParticleCanvas } from '@/components/background/ParticleCanvas'

export default function HomePage() {
  return (
    <div className="relative min-h-[calc(100vh-3.5rem)]">
      <ParticleCanvas />

      {/* Hero */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] px-4 text-center">
        <h1 className="font-display text-6xl md:text-8xl font-bold text-gold mb-4 tracking-wider">
          Valkária
        </h1>
        <p className="text-xl md:text-2xl text-parchment/70 mb-2 font-display">
          A cidade de Candessah aguarda
        </p>
        <p className="text-sm text-parchment/40 mb-10 max-w-md">
          Entre em um mundo onde cada NPC tem memória, motivações e segredos.
          Suas escolhas moldam o destino de Candessah.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/auth/login"
            className="px-8 py-3 bg-gold text-void font-display font-semibold rounded hover:bg-gold/80 transition-colors"
          >
            Entrar
          </Link>
          <Link
            href="/auth/register"
            className="px-8 py-3 border border-gold/50 text-parchment font-display font-semibold rounded hover:border-gold hover:text-gold transition-colors"
          >
            Criar Personagem
          </Link>
        </div>
      </div>

      {/* World description */}
      <div className="relative z-10 max-w-3xl mx-auto px-4 pb-20 text-center">
        <div className="border border-shadow rounded-lg p-8 bg-night/60 backdrop-blur-sm">
          <h2 className="font-display text-2xl text-gold mb-4">O Mundo</h2>
          <p className="text-parchment/70 leading-relaxed">
            Candessah é uma cidade de contradições: torres arcanas que tocam as nuvens ao lado de
            becos sombrios onde conspirações florescem. Cada NPC que você encontrar tem sua própria
            história, motivações e memórias das suas interações passadas.
          </p>
          <p className="text-parchment/50 mt-4 text-sm leading-relaxed">
            Interprete seu personagem com sabedoria. Aqui, palavras têm consequências.
          </p>
        </div>
      </div>
    </div>
  )
}
