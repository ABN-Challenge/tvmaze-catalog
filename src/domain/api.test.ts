import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  fetchShowById,
  fetchShowIndex,
  fetchShowsPage,
  searchShows,
  TvmazeApiError,
} from './api'

const jsonResponse = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
})

const aShow = (id: number, name = `Show ${id}`) => ({
  id,
  name,
  genres: [],
  rating: {},
  image: null,
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('fetchShowsPage', () => {
  it('requests the given index page and asks for JSON', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([aShow(1)]))
    vi.stubGlobal('fetch', fetchMock)

    await fetchShowsPage(3)

    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toBe('https://api.tvmaze.com/shows?page=3')
    expect(init.headers.Accept).toBe('application/json')
    // Browsers forbid setting User-Agent, so it must not be sent.
    expect(init.headers).not.toHaveProperty('User-Agent')
  })

  it('defaults to page 0', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([]))
    vi.stubGlobal('fetch', fetchMock)

    await fetchShowsPage()

    expect(String(fetchMock.mock.calls[0][0])).toContain('page=0')
  })

  it('merges caller supplied headers', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([]))
    vi.stubGlobal('fetch', fetchMock)

    await fetchShowsPage(0, undefined)
    expect(fetchMock.mock.calls[0][1].headers).toEqual({ Accept: 'application/json' })
  })
})

describe('fetchShowIndex', () => {
  it('merges page 0 and page 1', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse([aShow(1, 'One')]))
      .mockResolvedValueOnce(jsonResponse([aShow(2, 'Two')]))
    vi.stubGlobal('fetch', fetchMock)

    const shows = await fetchShowIndex()
    expect(shows.map((s) => s.id)).toEqual([1, 2])
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('de-duplicates shows that appear on both pages', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse([aShow(1)]))
      .mockResolvedValueOnce(jsonResponse([aShow(1), aShow(2)]))
    vi.stubGlobal('fetch', fetchMock)

    const shows = await fetchShowIndex()
    expect(shows.map((s) => s.id)).toEqual([1, 2])
  })

  it('returns page 0 when page 1 is 404', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse([aShow(1)]))
      .mockResolvedValueOnce(jsonResponse({}, 404))
    vi.stubGlobal('fetch', fetchMock)

    expect(await fetchShowIndex()).toHaveLength(1)
  })

  it('skips page 1 when includeSecondPage is false', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([aShow(1)]))
    vi.stubGlobal('fetch', fetchMock)

    const shows = await fetchShowIndex(undefined, { includeSecondPage: false })
    expect(shows).toHaveLength(1)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('surfaces rate-limit errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({}, 429)))
    await expect(fetchShowIndex()).rejects.toThrow('Rate limited by TVmaze')
  })

  it('rethrows a non-404 failure from page 1', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse([aShow(1)]))
      .mockResolvedValueOnce(jsonResponse({}, 500))
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchShowIndex()).rejects.toThrow('TVmaze request failed (500)')
  })

  it('propagates an aborted request', async () => {
    const abortError = new Error('aborted')
    abortError.name = 'AbortError'
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abortError))

    await expect(fetchShowIndex()).rejects.toMatchObject({ name: 'AbortError' })
  })
})

describe('searchShows', () => {
  it('returns empty array for blank query without fetching', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(searchShows('   ')).resolves.toEqual([])
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('maps search payloads to shows and encodes the query', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse([{ score: 1, show: aShow(9, 'Girls') }]))
    vi.stubGlobal('fetch', fetchMock)

    await expect(searchShows(' girls & boys ')).resolves.toEqual([
      expect.objectContaining({ id: 9, name: 'Girls' }),
    ])
    expect(String(fetchMock.mock.calls[0][0])).toContain('q=girls%20%26%20boys')
  })
})

describe('fetchShowById', () => {
  it('embeds cast by default', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(aShow(1)))
    vi.stubGlobal('fetch', fetchMock)

    await fetchShowById(1)
    expect(String(fetchMock.mock.calls[0][0])).toContain('embed[]=cast')
  })

  it('omits cast embed when embedCast is false', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(aShow(1)))
    vi.stubGlobal('fetch', fetchMock)

    await fetchShowById(1, { embedCast: false })
    expect(String(fetchMock.mock.calls[0][0])).not.toContain('embed')
  })

  it('accepts a bare AbortSignal and still embeds cast', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(aShow(1)))
    vi.stubGlobal('fetch', fetchMock)
    const controller = new AbortController()

    await fetchShowById(1, controller.signal)

    expect(String(fetchMock.mock.calls[0][0])).toContain('embed[]=cast')
    expect(fetchMock.mock.calls[0][1].signal).toBe(controller.signal)
  })

  it('accepts an options object carrying a signal', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(aShow(1)))
    vi.stubGlobal('fetch', fetchMock)
    const controller = new AbortController()

    await fetchShowById(1, { signal: controller.signal })
    expect(fetchMock.mock.calls[0][1].signal).toBe(controller.signal)
  })

  it('throws a 404 TvmazeApiError for an unknown show', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({}, 404)))

    await expect(fetchShowById(999)).rejects.toBeInstanceOf(TvmazeApiError)
    await expect(fetchShowById(999)).rejects.toMatchObject({ status: 404, name: 'TvmazeApiError' })
  })
})
