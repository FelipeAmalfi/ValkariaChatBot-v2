interface WizardStepProps {
  children: React.ReactNode
  title: string
  subtitle?: string
}

export function WizardStep({ children, title, subtitle }: WizardStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-display text-parchment">{title}</h2>
        {subtitle && <p className="text-silver text-sm mt-1">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}
