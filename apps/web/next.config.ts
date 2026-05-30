import type { NextConfig } from 'next'

const config: NextConfig = {
  output: 'standalone',
  experimental: { reactCompiler: false },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_GRAPHQL_URL: process.env.NEXT_PUBLIC_GRAPHQL_URL,
  },
}

export default config
