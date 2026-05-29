import { cn } from '@/lib/utils'

interface StepIndicatorProps {
  currentStep: number
  totalSteps?: number
}

export function StepIndicator({ currentStep, totalSteps = 4 }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map(step => (
        <div
          key={step}
          className={cn(
            'w-2 h-2 rounded-full transition-all duration-300',
            step < currentStep ? 'bg-gold scale-100' :
            step === currentStep ? 'bg-gold scale-125 ring-2 ring-gold/30' :
            'bg-mist'
          )}
        />
      ))}
    </div>
  )
}
