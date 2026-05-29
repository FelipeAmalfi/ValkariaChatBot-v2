import type { Metadata } from 'next'
import { Cinzel, Inter } from 'next/font/google'
import { ApolloProvider } from '@/lib/graphql/ApolloProvider'
import { AuthProvider } from '@/lib/auth/AuthContext'
import { Navbar } from '@/components/layout/Navbar'
import './globals.css'

const cinzel = Cinzel({
  subsets: ['latin'],
  variable: '--font-cinzel',
  weight: ['400', '600', '700'],
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Valkária — Candessah',
  description: 'RPG interativo com NPCs inteligentes',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${cinzel.variable} ${inter.variable}`}>
      <body>
        <ApolloProvider>
          <AuthProvider>
            <Navbar />
            <main>{children}</main>
          </AuthProvider>
        </ApolloProvider>
      </body>
    </html>
  )
}
