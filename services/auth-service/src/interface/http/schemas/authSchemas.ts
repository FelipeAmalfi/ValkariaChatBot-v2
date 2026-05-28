import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().min(1).max(255),
  class: z.string().min(1).max(100),
  race: z.string().min(1).max(100),
  background: z.string().min(1),
  personality: z.string().min(1),
  interests: z.string().min(1),
})

export const initiateSchema = z.object({
  playerName: z.string().min(1),
})

export const validateSchema = z.object({
  challengeId: z.string().uuid(),
  answer: z.string().min(1),
})

export const dmAuthSchema = z.object({
  password: z.string().min(1),
})
