import { gql } from '@apollo/client'

export const GET_NPC = gql`
  query GetNpc($name: String!) {
    npc(name: $name) {
      name
      role
      location
      metadata {
        likes
        dislikes
        benefitsCordial
        benefitsLoyal
        benefitsIntimate
      }
    }
  }
`

export const GET_AFFINITY = gql`
  query GetAffinity($playerName: String!, $npcName: String!) {
    affinity(playerName: $playerName, npcName: $npcName) {
      level
      score
    }
  }
`
