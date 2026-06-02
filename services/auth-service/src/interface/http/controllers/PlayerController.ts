import type { FastifyInstance, FastifyRequest } from 'fastify'
import type { MultipartFile } from '@fastify/multipart'
import { createWriteStream, mkdirSync } from 'fs'
import { join, extname } from 'path'
import { pipeline } from 'stream/promises'
import { randomUUID } from 'crypto'
import type { PlayerRepository } from '@valkaria/domain'
import type { JwtService } from '../../../infrastructure/auth/JwtService.js'

interface UpdateMeBody {
  background?: string
  personality?: string
  interests?: string
}

export interface PlayerControllerDeps {
  playerRepo: PlayerRepository
  jwtService: JwtService
  uploadsDir: string
  apiUrl: string
}

function buildPlayerToken(player: Awaited<ReturnType<PlayerRepository['findById']>>, jwtService: JwtService): string {
  if (!player) throw new Error('Player not found')
  return jwtService.sign({
    playerId: player.id,
    playerName: player.name,
    role: 'PLAYER',
    player: {
      id: player.id,
      name: player.name,
      class: player.class,
      race: player.race,
      background: player.background,
      personality: player.personality,
      interests: player.interests,
      avatarUrl: player.avatarUrl,
    },
  })
}

export class PlayerController {
  constructor(private deps: PlayerControllerDeps) {
    mkdirSync(deps.uploadsDir, { recursive: true })
  }

  register(app: FastifyInstance): void {
    app.patch('/auth/me', {
      preHandler: async (request: FastifyRequest) => { await request.jwtVerify() },
    }, async (request) => {
      const payload = request.user as { playerId?: string }
      const playerId = payload.playerId
      if (!playerId) throw new Error('No playerId in token')

      const { background, personality, interests } = request.body as UpdateMeBody

      const partial: Record<string, string> = {}
      if (background !== undefined) partial['background'] = background
      if (personality !== undefined) partial['personality'] = personality
      if (interests !== undefined) partial['interests'] = interests

      await this.deps.playerRepo.update(playerId, partial)
      const updated = await this.deps.playerRepo.findById(playerId)
      const token = buildPlayerToken(updated, this.deps.jwtService)
      return { token, player: updated }
    })

    app.post('/auth/me/avatar', {
      preHandler: async (request: FastifyRequest) => { await request.jwtVerify() },
    }, async (request) => {
      const payload = request.user as { playerId?: string }
      const playerId = payload.playerId
      if (!playerId) throw new Error('No playerId in token')

      const file = await (request as FastifyRequest & { file(): Promise<MultipartFile> }).file()
      const ext = extname(file.filename) || '.jpg'
      const filename = `${randomUUID()}${ext}`
      const dest = join(this.deps.uploadsDir, filename)

      await pipeline(file.file, createWriteStream(dest))

      const avatarUrl = `${this.deps.apiUrl}/uploads/${filename}`
      await this.deps.playerRepo.update(playerId, { avatarUrl } as Parameters<PlayerRepository['update']>[1])
      const updated = await this.deps.playerRepo.findById(playerId)
      const token = buildPlayerToken(updated, this.deps.jwtService)
      return { token, avatarUrl, player: updated }
    })
  }
}
