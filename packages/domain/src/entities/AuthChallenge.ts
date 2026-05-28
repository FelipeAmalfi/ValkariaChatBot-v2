export interface AuthChallenge {
  challengeId: string
  playerId: string
  fieldText: string
  embedding: number[]
  question: string
  expiresAt: string
}
