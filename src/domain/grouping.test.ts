import { describe, expect, it } from 'vitest'
import { groupShowsByGenre, sortByRating } from './grouping'
import type { Show } from './types'

const show = (partial: Partial<Show> & Pick<Show, 'id' | 'name'>): Show => ({
  genres: [],
  rating: { average: null },
  image: null,
  ...partial,
})

describe('sortByRating', () => {
  it('sorts higher ratings first and leaves input untouched', () => {
    const input = [
      show({ id: 1, name: 'B', rating: { average: 7 } }),
      show({ id: 2, name: 'A', rating: { average: 9 } }),
      show({ id: 3, name: 'C', rating: { average: 8 } }),
    ]
    const copy = [...input]
    const sorted = sortByRating(input)
    expect(sorted.map((s) => s.id)).toEqual([2, 3, 1])
    expect(input).toEqual(copy)
  })

  it('places unrated shows last', () => {
    const sorted = sortByRating([
      show({ id: 1, name: 'Unrated', rating: { average: null } }),
      show({ id: 2, name: 'Rated', rating: { average: 5 } }),
      show({ id: 3, name: 'Also unrated', rating: { average: undefined } }),
    ])
    expect(sorted.map((s) => s.id)).toEqual([2, 3, 1])
  })
})

describe('groupShowsByGenre', () => {
  it('groups by genre, sorts genres alphabetically, and sorts within groups', () => {
    const groups = groupShowsByGenre([
      show({
        id: 1,
        name: 'Low Drama',
        genres: ['Drama', 'Thriller'],
        rating: { average: 6 },
      }),
      show({
        id: 2,
        name: 'High Drama',
        genres: ['Drama'],
        rating: { average: 9 },
      }),
      show({
        id: 3,
        name: 'Comedy Hit',
        genres: ['Comedy'],
        rating: { average: 8 },
      }),
    ])

    expect(groups.map((g) => g.genre)).toEqual(['Comedy', 'Drama', 'Thriller'])
    expect(groups[1].shows.map((s) => s.id)).toEqual([2, 1])
    expect(groups[2].shows.map((s) => s.id)).toEqual([1])
  })
})
