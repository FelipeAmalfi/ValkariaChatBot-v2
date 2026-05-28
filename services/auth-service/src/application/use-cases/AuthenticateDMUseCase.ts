import { UnauthorizedError } from '@valkaria/domain'
import type { JwtService } from '../../infrastructure/auth/JwtService.js'

interface AuthenticateDMResult {
  token: string
}

export class AuthenticateDMUseCase {
  constructor(
    private jwtService: JwtService,
    private dmPassword: string
  ) {}

  async execute(password: string): Promise<AuthenticateDMResult> {
    if (password !== this.dmPassword) throw new UnauthorizedError('Invalid DM password')
    const token = this.jwtService.sign({ role: 'DM' })
    return { token }
  }
}
