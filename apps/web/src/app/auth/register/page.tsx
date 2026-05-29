import { PageTransition } from '@/components/layout/PageTransition'
import { RegisterWizard } from '@/components/auth/RegisterWizard'

export default function RegisterPage() {
  return (
    <PageTransition>
      <RegisterWizard />
    </PageTransition>
  )
}
