import type { Show } from './types'

/** Bucket for shows the TVmaze index returns without any genre. */
export const UNCATEGORIZED = 'Uncategorized'

/** Pure sort: higher rating first; null/undefined ratings last. Does not mutate input. */
export function sortByRating(shows: Show[]): Show[] {
  return [...shows].sort((a, b) => {
    const left = a.rating?.average
    const right = b.rating?.average
    const leftMissing = left == null || Number.isNaN(left)
    const rightMissing = right == null || Number.isNaN(right)

    if (leftMissing && rightMissing) return a.name.localeCompare(b.name)
    if (leftMissing) return 1
    if (rightMissing) return -1
    if (right !== left) return right - left
    return a.name.localeCompare(b.name)
  })
}

/** Group shows by genre and sort each group by rating. */
export function groupShowsByGenre(shows: Show[]): Array<{ genre: string; shows: Show[] }> {
  const map = new Map<string, Show[]>()

  const add = (genre: string, show: Show) => {
    const list = map.get(genre)
    if (list) {
      list.push(show)
    } else {
      map.set(genre, [show])
    }
  }

  for (const show of shows) {
    const genres = show.genres ?? []
    if (genres.length === 0) {
      add(UNCATEGORIZED, show)
      continue
    }
    for (const genre of genres) {
      add(genre, show)
    }
  }

  return [...map.entries()]
    .sort(([a], [b]) => {
      // Genreless shows are a fallback bucket, so they always trail real genres.
      if (a === UNCATEGORIZED) return 1
      if (b === UNCATEGORIZED) return -1
      return a.localeCompare(b)
    })
    .map(([genre, genreShows]) => ({
      genre,
      shows: sortByRating(genreShows),
    }))
}
