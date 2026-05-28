export type ID = string
export type Timestamp = string  // ISO 8601

export interface Pagination {
  page: number
  pageSize: number
  total: number
}

export type Nullable<T> = T | null
export type Optional<T> = T | undefined
