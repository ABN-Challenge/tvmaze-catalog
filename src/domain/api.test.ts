import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchShowById, fetchShowIndex, searchShows, TvmazeApiError } from './api'
import { sanitizeSummaryHtml } from './sanitize'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('fetchShowIndex', () => {
  it('merges page 0 and page 1', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ id: 1, name: 'One', genres: [], rating: {}, image: null }],
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ id: 2, name: 'Two', genres: [], rating: {}, image: null }],
      })
    vi.stubGlobal('fetch', fetchMock)

    const shows = await fetchShowIndex()
    expect(shows.map((s) => s.id)).toEqual([1, 2])
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('returns page 0 when page 1 is 404', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ id: 1, name: 'One', genres: [], rating: {}, image: null }],
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({}),
      })
    vi.stubGlobal('fetch', fetchMock)

    const shows = await fetchShowIndex()
    expect(shows).toHaveLength(1)
  })

  it('surfaces rate-limit errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 429, json: async () => ({}) }),
    )
    await expect(fetchShowIndex()).rejects.toBeInstanceOf(TvmazeApiError)
  })
})

describe('searchShows', () => {
  it('returns empty array for blank query without fetching', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    await expect(searchShows('   ')).resolves.toEqual([])
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('maps search payloads to shows', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [{ score: 1, show: { id: 9, name: 'Girls', genres: [], rating: {}, image: null } }],
      }),
    )
    await expect(searchShows('girls')).resolves.toEqual([
      expect.objectContaining({ id: 9, name: 'Girls' }),
    ])
  })
})

describe('fetchShowById', () => {
  it('embeds cast by default', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 1, name: 'One', genres: [], rating: {}, image: null }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await fetchShowById(1)
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('embed[]=cast')
  })

  it('omits cast embed when embedCast is false', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 1, name: 'One', genres: [], rating: {}, image: null }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await fetchShowById(1, { embedCast: false })
    expect(String(fetchMock.mock.calls[0]?.[0])).not.toContain('embed')
  })
})

describe('fetchShowIndex options', () => {
  it('skips page 1 when includeSecondPage is false', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [{ id: 1, name: 'One', genres: [], rating: {}, image: null }],
    })
    vi.stubGlobal('fetch', fetchMock)

    const shows = await fetchShowIndex(undefined, { includeSecondPage: false })
    expect(shows).toHaveLength(1)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})

describe('sanitizeSummaryHtml', () => {
  it('keeps allowed tags and strips scripts/attributes', () => {
    const dirty =
      '<p onclick="alert(1)">Hello <b>world</b><script>evil()</script><a href="x">link</a></p>'
    const clean = sanitizeSummaryHtml(dirty)
    expect(clean).toContain('<p>')
    expect(clean).toContain('<b>world</b>')
    expect(clean).not.toContain('onclick')
    expect(clean).not.toContain('<script')
    expect(clean).not.toContain('<a')
    expect(clean).toContain('link')
  })
})
