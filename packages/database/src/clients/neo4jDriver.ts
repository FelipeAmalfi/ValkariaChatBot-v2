import neo4j, { Driver } from 'neo4j-driver'

let driver: Driver | null = null

export function getNeo4jDriver(uri: string, user: string, password: string): Driver {
  if (!driver) {
    driver = neo4j.driver(uri, neo4j.auth.basic(user, password))
  }
  return driver
}
