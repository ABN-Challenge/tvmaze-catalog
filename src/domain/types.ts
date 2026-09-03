export interface ShowImage {
  medium?: string | null
  original?: string | null
}

export interface ShowRating {
  average?: number | null
}

export interface ShowNetwork {
  name?: string | null
}

export interface Show {
  id: number
  name: string
  genres: string[]
  rating: ShowRating
  image: ShowImage | null
  summary?: string | null
  status?: string | null
  premiered?: string | null
  officialSite?: string | null
  network?: ShowNetwork | null
  webChannel?: ShowNetwork | null
  _embedded?: {
    cast?: Array<{
      person?: { name?: string | null }
      character?: { name?: string | null }
    }>
  }
}

export interface SearchResult {
  score: number
  show: Show
}

export type GenreGroups = Record<string, Show[]>
