import type { Show } from './types'

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

  for (const show of shows) {
    for (const genre of show.genres ?? []) {
      const list = map.get(genre)
      if (list) {
        list.push(show)
      } else {
        map.set(genre, [show])
      }
    }
  }

  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([genre, genreShows]) => ({
      genre,
      shows: sortByRating(genreShows),
    }))
}
