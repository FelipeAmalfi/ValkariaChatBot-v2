import { Suspense } from 'react'
import { PageTransition } from '@/components/layout/PageTransition'
import { LoginChallenge } from '@/components/auth/LoginChallenge'

export default function LoginPage() {
  return (
    <PageTransition>
      <Suspense>
        <LoginChallenge />
      </Suspense>
    </PageTransition>
  )
}
