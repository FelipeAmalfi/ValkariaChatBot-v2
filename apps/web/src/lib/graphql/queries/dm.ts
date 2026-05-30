import { gql } from '@apollo/client'

export const LIST_ALL_PLAYERS = gql`
  query ListAllPlayers($page: Int, $pageSize: Int) {
    players(page: $page, pageSize: $pageSize) {
      id
      name
      class
      race
      background
      personality
      interests
      createdAt
    }
  }
`

export const GET_PLAYER_AFFINITIES = gql`
  query GetPlayerAffinities($playerName: String!) {
    affinities(playerName: $playerName) {
      npcName
      level
      score
      interactionCount
    }
  }
`
