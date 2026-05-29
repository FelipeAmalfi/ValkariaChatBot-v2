import { gql } from '@apollo/client'

export const REGISTER_PLAYER = gql`
  mutation RegisterPlayer(
    $name: String!
    $class: String!
    $race: String!
    $background: String!
    $personality: String!
    $interests: String!
  ) {
    registerPlayer(
      name: $name
      class: $class
      race: $race
      background: $background
      personality: $personality
      interests: $interests
    ) {
      id
      name
    }
  }
`

export const INITIATE_AUTH = gql`
  mutation InitiatePlayerAuth($playerName: String!) {
    initiatePlayerAuth(playerName: $playerName) {
      challengeId
      question
    }
  }
`

export const VERIFY_AUTH = gql`
  mutation VerifyPlayerAuth($challengeId: String!, $answer: String!) {
    verifyPlayerAuth(challengeId: $challengeId, answer: $answer) {
      token
      player {
        id
        name
        class
        race
      }
    }
  }
`

export const AUTHENTICATE_DM = gql`
  mutation AuthenticateDM($password: String!) {
    authenticateDM(password: $password) {
      token
    }
  }
`
