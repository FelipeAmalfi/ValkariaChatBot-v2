import { z } from 'zod'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createEnvSchema<T extends Record<string, any>>(shape: T) {
  const schema = z.object(shape)
  return function validateEnv(env = process.env): z.infer<typeof schema> {
    const result = schema.safeParse(env)
    if (!result.success) {
      console.error('Invalid environment variables:', result.error.flatten().fieldErrors)
      process.exit(1)
    }
    return result.data
  }
}
