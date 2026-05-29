'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@apollo/client/react'
import { motion, AnimatePresence } from 'framer-motion'
import { WizardStep } from './WizardStep'
import { StepIndicator } from './StepIndicator'
import { REGISTER_PLAYER } from '@/lib/graphql/mutations/auth'

const CLASSES = ['Guerreiro', 'Mago', 'Ladino', 'Clérigo', 'Bárbaro', 'Bardo', 'Druida', 'Paladino', 'Ranger']
const RACES = ['Humano', 'Elfo', 'Anão', 'Halfling', 'Gnomo', 'Meio-Elfo', 'Meio-Orc', 'Tiefling', 'Draconato']

interface FormState {
  name: string
  class: string
  race: string
  background: string
  personality: string
  interests: string
}

export function RegisterWizard() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>({
    name: '',
    class: CLASSES[0],
    race: RACES[0],
    background: '',
    personality: '',
    interests: '',
  })

  const [registerPlayer, { loading }] = useMutation(REGISTER_PLAYER)

  function set<K extends keyof FormState>(key: K, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
    setError(null)
  }

  function validateStep(): string | null {
    if (currentStep === 1) {
      if (!form.name.trim()) return 'O nome do personagem é obrigatório.'
    }
    if (currentStep === 2 && form.background.length < 50) {
      return 'A história deve ter ao menos 50 caracteres.'
    }
    if (currentStep === 3 && form.personality.length < 30) {
      return 'A personalidade deve ter ao menos 30 caracteres.'
    }
    if (currentStep === 4 && form.interests.length < 20) {
      return 'Os interesses devem ter ao menos 20 caracteres.'
    }
    return null
  }

  async function handleNext() {
    const err = validateStep()
    if (err) { setError(err); return }

    if (currentStep < 4) {
      setCurrentStep((currentStep + 1) as 1 | 2 | 3 | 4)
      return
    }

    try {
      await registerPlayer({
        variables: {
          name: form.name,
          class: form.class,
          race: form.race,
          background: form.background,
          personality: form.personality,
          interests: form.interests,
        },
      })
      router.push(`/auth/login?name=${encodeURIComponent(form.name)}`)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.toLowerCase().includes('conflict') || msg.toLowerCase().includes('already')) {
        setError('Este nome já está em uso.')
      } else {
        setError('Erro ao criar personagem. Tente novamente.')
      }
    }
  }

  function handleBack() {
    if (currentStep > 1) setCurrentStep((currentStep - 1) as 1 | 2 | 3 | 4)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <div className="bg-night/80 border border-gold/20 rounded-xl p-8 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-display text-gold">Criar Personagem</h1>
            <StepIndicator currentStep={currentStep} />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.25 }}
            >
              {currentStep === 1 && (
                <WizardStep title="Identidade do Personagem" subtitle="Nome, classe e raça definem quem você é.">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-silver text-sm mb-1">Nome</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={e => set('name', e.target.value)}
                        className="w-full bg-night border border-gold/20 rounded-lg px-4 py-2 text-parchment focus:outline-none focus:border-gold/60 transition-colors"
                        placeholder="Nome do seu personagem"
                      />
                    </div>
                    <div>
                      <label className="block text-silver text-sm mb-1">Classe</label>
                      <select
                        value={form.class}
                        onChange={e => set('class', e.target.value)}
                        className="w-full bg-night border border-gold/20 rounded-lg px-4 py-2 text-parchment focus:outline-none focus:border-gold/60 transition-colors"
                      >
                        {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-silver text-sm mb-1">Raça</label>
                      <select
                        value={form.race}
                        onChange={e => set('race', e.target.value)}
                        className="w-full bg-night border border-gold/20 rounded-lg px-4 py-2 text-parchment focus:outline-none focus:border-gold/60 transition-colors"
                      >
                        {RACES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                  </div>
                </WizardStep>
              )}

              {currentStep === 2 && (
                <WizardStep title="Origem" subtitle="Conte a história do seu personagem.">
                  <textarea
                    value={form.background}
                    onChange={e => set('background', e.target.value)}
                    rows={6}
                    className="w-full bg-night border border-gold/20 rounded-lg px-4 py-3 text-parchment focus:outline-none focus:border-gold/60 transition-colors resize-none"
                    placeholder="Descreva a história de seu personagem..."
                  />
                  <p className="text-silver/50 text-xs text-right">{form.background.length}/50 mín.</p>
                </WizardStep>
              )}

              {currentStep === 3 && (
                <WizardStep title="Personalidade" subtitle="Como seu personagem age e pensa?">
                  <textarea
                    value={form.personality}
                    onChange={e => set('personality', e.target.value)}
                    rows={5}
                    className="w-full bg-night border border-gold/20 rounded-lg px-4 py-3 text-parchment focus:outline-none focus:border-gold/60 transition-colors resize-none"
                    placeholder="Como seu personagem age e pensa?"
                  />
                  <p className="text-silver/50 text-xs text-right">{form.personality.length}/30 mín.</p>
                </WizardStep>
              )}

              {currentStep === 4 && (
                <WizardStep title="Interesses" subtitle="O que seu personagem aprecia?">
                  <textarea
                    value={form.interests}
                    onChange={e => set('interests', e.target.value)}
                    rows={4}
                    className="w-full bg-night border border-gold/20 rounded-lg px-4 py-3 text-parchment focus:outline-none focus:border-gold/60 transition-colors resize-none"
                    placeholder="O que seu personagem aprecia? (combate, magia, comércio...)"
                  />
                  <p className="text-silver/50 text-xs text-right">{form.interests.length}/20 mín.</p>
                </WizardStep>
              )}
            </motion.div>
          </AnimatePresence>

          {error && (
            <p className="mt-4 text-red-400 text-sm">{error}</p>
          )}

          <div className="flex items-center justify-between mt-8">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className="px-4 py-2 text-silver disabled:opacity-30 hover:text-parchment transition-colors"
            >
              Voltar
            </button>
            <button
              onClick={handleNext}
              disabled={loading}
              className="px-6 py-2 bg-gold/20 border border-gold/40 rounded-lg text-gold hover:bg-gold/30 transition-colors disabled:opacity-50"
            >
              {loading ? 'Criando...' : currentStep === 4 ? 'Criar Personagem' : 'Próximo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
