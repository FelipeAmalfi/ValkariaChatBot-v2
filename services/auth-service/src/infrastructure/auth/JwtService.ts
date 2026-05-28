import jwt from 'jsonwebtoken'

export type JwtRole = 'PLAYER' | 'DM'

export interface JwtPayload {
  playerId?: string
  playerName?: string
  role: JwtRole
}

export class JwtService {
  constructor(
    private secret: string,
    private expiresInSeconds: number = 86400
  ) {}

  sign(payload: JwtPayload): string {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresInSeconds })
  }

  verify(token: string): JwtPayload {
    return jwt.verify(token, this.secret) as JwtPayload
  }
}
