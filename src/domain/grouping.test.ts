import { describe, expect, it } from 'vitest'
import { groupShowsByGenre, sortByRating, UNCATEGORIZED } from './grouping'
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

  it('treats NaN ratings as unrated', () => {
    const sorted = sortByRating([
      show({ id: 1, name: 'Broken', rating: { average: Number.NaN } }),
      show({ id: 2, name: 'Fine', rating: { average: 6 } }),
    ])
    expect(sorted.map((s) => s.id)).toEqual([2, 1])
  })

  it('breaks equal ratings by name', () => {
    const sorted = sortByRating([
      show({ id: 1, name: 'Zulu', rating: { average: 8 } }),
      show({ id: 2, name: 'Alpha', rating: { average: 8 } }),
    ])
    expect(sorted.map((s) => s.name)).toEqual(['Alpha', 'Zulu'])
  })

  it('handles a show without a rating object', () => {
    const sorted = sortByRating([
      { id: 1, name: 'No rating key', genres: [], image: null } as unknown as Show,
      show({ id: 2, name: 'Rated', rating: { average: 7 } }),
    ])
    expect(sorted.map((s) => s.id)).toEqual([2, 1])
  })
})

describe('groupShowsByGenre', () => {
  it('groups by genre, sorts genres alphabetically, and sorts within groups', () => {
    const groups = groupShowsByGenre([
      show({ id: 1, name: 'Low Drama', genres: ['Drama', 'Thriller'], rating: { average: 6 } }),
      show({ id: 2, name: 'High Drama', genres: ['Drama'], rating: { average: 9 } }),
      show({ id: 3, name: 'Comedy Hit', genres: ['Comedy'], rating: { average: 8 } }),
    ])

    expect(groups.map((g) => g.genre)).toEqual(['Comedy', 'Drama', 'Thriller'])
    expect(groups[1].shows.map((s) => s.id)).toEqual([2, 1])
    expect(groups[2].shows.map((s) => s.id)).toEqual([1])
  })

  it('collects genreless shows into the Uncategorized bucket', () => {
    const groups = groupShowsByGenre([
      show({ id: 1, name: 'No genres', genres: [] }),
      show({ id: 2, name: 'Drama one', genres: ['Drama'], rating: { average: 7 } }),
    ])

    expect(groups.map((g) => g.genre)).toEqual(['Drama', UNCATEGORIZED])
    expect(groups[1].shows.map((s) => s.id)).toEqual([1])
  })

  it('treats a missing genres field as uncategorized', () => {
    const groups = groupShowsByGenre([
      { id: 1, name: 'Undefined genres', rating: {}, image: null } as unknown as Show,
    ])
    expect(groups).toEqual([expect.objectContaining({ genre: UNCATEGORIZED })])
  })

  it('always sorts Uncategorized last regardless of insertion order', () => {
    const genrelessFirst = groupShowsByGenre([
      show({ id: 1, name: 'No genres', genres: [] }),
      show({ id: 2, name: 'Western', genres: ['Western'] }),
      show({ id: 3, name: 'Action', genres: ['Action'] }),
    ])
    expect(genrelessFirst.map((g) => g.genre)).toEqual(['Action', 'Western', UNCATEGORIZED])

    const genrelessLast = groupShowsByGenre([
      show({ id: 2, name: 'Western', genres: ['Western'] }),
      show({ id: 3, name: 'Action', genres: ['Action'] }),
      show({ id: 1, name: 'No genres', genres: [] }),
    ])
    expect(genrelessLast.map((g) => g.genre)).toEqual(['Action', 'Western', UNCATEGORIZED])
  })

  it('keeps Uncategorized last when it is the only trailing bucket', () => {
    const groups = groupShowsByGenre([
      show({ id: 1, name: 'Drama one', genres: ['Drama'] }),
      show({ id: 2, name: 'No genres', genres: [] }),
    ])
    expect(groups.map((g) => g.genre)).toEqual(['Drama', UNCATEGORIZED])
  })

  it('returns no groups for an empty catalog', () => {
    expect(groupShowsByGenre([])).toEqual([])
  })
})
