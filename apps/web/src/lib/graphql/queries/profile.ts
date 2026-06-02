import { gql } from '@apollo/client'

export const GET_MY_PROFILE = gql`
  query GetMyProfile($playerName: String!) {
    player: npc(name: $playerName) {
      name
    }
  }
`

export const GET_MY_AFFINITIES = gql`
  query GetMyAffinities($playerName: String!) {
    affinities(playerName: $playerName) {
      npcName
      level
      score
      interactionCount
    }
  }
`

export const GET_NPC_DETAILS = gql`
  query GetNpcDetails($name: String!) {
    npc(name: $name) {
      name
      role
      location
      metadata {
        benefitsCordial
        benefitsLoyal
        benefitsIntimate
      }
    }
  }
`

export const SET_AFFINITY = gql`
  mutation SetAffinity($playerName: String!, $npcName: String!, $score: Int!) {
    setAffinity(playerName: $playerName, npcName: $npcName, score: $score) {
      npcName
      level
      score
      interactionCount
    }
  }
`
