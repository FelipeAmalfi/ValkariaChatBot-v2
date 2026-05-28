export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number
  ) {
    super(message)
    this.name = this.constructor.name
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class ValidationError extends AppError {
  constructor(m: string) { super(m, 400) }
}
export class NotFoundError extends AppError {
  constructor(m: string) { super(m, 404) }
}
export class UnauthorizedError extends AppError {
  constructor(m: string) { super(m, 401) }
}
export class ForbiddenError extends AppError {
  constructor(m: string) { super(m, 403) }
}
export class ConflictError extends AppError {
  constructor(m: string) { super(m, 409) }
}
export class InfrastructureError extends AppError {
  constructor(m: string) { super(m, 500) }
}
export class RepositoryError extends InfrastructureError {}
export class AIProviderError extends AppError {
  constructor(m: string) { super(m, 502) }
}
