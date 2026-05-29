'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMutation } from '@apollo/client/react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/lib/auth/AuthContext'
import { INITIATE_AUTH, VERIFY_AUTH } from '@/lib/graphql/mutations/auth'

type Phase = 'name' | 'challenge' | 'result'

interface Challenge {
  challengeId: string
  question: string
}

export function LoginChallenge() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()

  const [phase, setPhase] = useState<Phase>('name')
  const [playerName, setPlayerName] = useState('')
  const [answer, setAnswer] = useState('')
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const name = searchParams.get('name')
    if (name) setPlayerName(name)
  }, [searchParams])

  const [initiateAuth, { loading: initiating }] = useMutation(INITIATE_AUTH)
  const [verifyAuth, { loading: verifying }] = useMutation(VERIFY_AUTH)

  async function handleInitiate() {
    if (!playerName.trim()) { setError('Digite seu nome.'); return }
    setError(null)
    try {
      const { data } = await initiateAuth({ variables: { playerName: playerName.trim() } })
      const initResult = data as { initiatePlayerAuth: Challenge }
      setChallenge(initResult.initiatePlayerAuth)
      setPhase('challenge')
    } catch {
      setError('Personagem não encontrado. Verifique o nome.')
    }
  }

  async function handleVerify() {
    if (!answer.trim() || !challenge) return
    setError(null)
    try {
      const { data } = await verifyAuth({
        variables: { challengeId: challenge.challengeId, answer: answer.trim() },
      })
      const verifyResult = data as { verifyPlayerAuth: { token: string; player: { id: string; name: string; class: string; race: string } } }
      const { token, player } = verifyResult.verifyPlayerAuth
      login(token, player)
      setSuccess(true)
      setPhase('result')
      setTimeout(() => router.push('/chat'), 800)
    } catch {
      setPhase('result')
      setSuccess(false)
    }
  }

  function handleRetry() {
    setPhase('name')
    setAnswer('')
    setChallenge(null)
    setError(null)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-night/80 border border-gold/20 rounded-xl p-8 backdrop-blur-sm">
          <h1 className="text-2xl font-display text-gold mb-8">Entrar em Valkária</h1>

          <AnimatePresence mode="wait">
            {phase === 'name' && (
              <motion.div
                key="name"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-silver text-sm mb-1">Nome do Personagem</label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={e => { setPlayerName(e.target.value); setError(null) }}
                    onKeyDown={e => e.key === 'Enter' && handleInitiate()}
                    className="w-full bg-night border border-gold/20 rounded-lg px-4 py-2 text-parchment focus:outline-none focus:border-gold/60 transition-colors"
                    placeholder="Seu nome no mundo de Valkária"
                  />
                </div>
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <button
                  onClick={handleInitiate}
                  disabled={initiating}
                  className="w-full px-6 py-2 bg-gold/20 border border-gold/40 rounded-lg text-gold hover:bg-gold/30 transition-colors disabled:opacity-50"
                >
                  {initiating ? 'Buscando...' : 'Entrar'}
                </button>
              </motion.div>
            )}

            {phase === 'challenge' && challenge && (
              <motion.div
                key="challenge"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="border border-gold/30 rounded-lg p-6 bg-night/50">
                  <p className="text-silver text-sm mb-2 font-display">O narrador pergunta:</p>
                  <p className="text-parchment italic text-lg">&ldquo;{challenge.question}&rdquo;</p>
                </div>
                <div>
                  <label className="block text-silver text-sm mb-1">Sua resposta</label>
                  <textarea
                    value={answer}
                    onChange={e => setAnswer(e.target.value)}
                    rows={4}
                    className="w-full bg-night border border-gold/20 rounded-lg px-4 py-3 text-parchment focus:outline-none focus:border-gold/60 transition-colors resize-none"
                    placeholder="Responda com as palavras do seu personagem..."
                  />
                </div>
                <button
                  onClick={handleVerify}
                  disabled={verifying || !answer.trim()}
                  className="w-full px-6 py-2 bg-gold/20 border border-gold/40 rounded-lg text-gold hover:bg-gold/30 transition-colors disabled:opacity-50"
                >
                  {verifying ? 'Verificando...' : 'Responder'}
                </button>
              </motion.div>
            )}

            {phase === 'result' && (
              <motion.div
                key="result"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="text-center space-y-4"
              >
                {success ? (
                  <p className="text-gold font-display text-lg">Bem-vindo de volta, {playerName}.</p>
                ) : (
                  <>
                    <p className="text-red-400">Identidade não confirmada. Tente novamente.</p>
                    <button
                      onClick={handleRetry}
                      className="px-6 py-2 bg-gold/20 border border-gold/40 rounded-lg text-gold hover:bg-gold/30 transition-colors"
                    >
                      Tentar Novamente
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-silver/40 text-xs mt-4">
          Mestre?{' '}
          <a href="/auth/dm" className="text-gold/60 hover:text-gold transition-colors">
            Acesse aqui
          </a>
        </p>
      </div>
    </div>
  )
}
