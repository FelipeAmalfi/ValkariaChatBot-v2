import { gql } from '@apollo/client'

export const LIST_NPCS = gql`
  query ListNpcs($location: String, $faction: String, $page: Int, $pageSize: Int) {
    npcs(location: $location, faction: $faction, page: $page, pageSize: $pageSize) {
      name
      faction
      role
      location
    }
  }
`

export const LIST_LOCATIONS = gql`
  query ListLocations($page: Int, $pageSize: Int) {
    locations(page: $page, pageSize: $pageSize) {
      id
      name
      description
      services
    }
  }
`

export const GET_AFFINITIES = gql`
  query GetAffinities($playerName: String!) {
    affinities(playerName: $playerName) {
      npcName
      level
      score
    }
  }
`
