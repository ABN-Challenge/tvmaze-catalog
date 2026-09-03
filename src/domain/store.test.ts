import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useCatalogStore } from './store'
import { TvmazeApiError } from './api'
import * as api from './api'
import type { Show } from './types'

vi.mock('./api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./api')>()
  return {
    ...actual,
    fetchShowIndex: vi.fn(),
    searchShows: vi.fn(),
    fetchShowById: vi.fn(),
  }
})

const show = (id: number, name = `Show ${id}`): Show => ({
  id,
  name,
  genres: ['Drama'],
  rating: { average: 8 },
  image: null,
})

const abortError = () => {
  const error = new Error('aborted')
  error.name = 'AbortError'
  return error
}

beforeEach(() => {
  setActivePinia(createPinia())
})

afterEach(() => {
  vi.resetAllMocks()
})

describe('loadDashboard', () => {
  it('starts idle and populates genre groups on success', async () => {
    vi.mocked(api.fetchShowIndex).mockResolvedValue([show(1), show(2)])
    const store = useCatalogStore()

    expect(store.dashboardStatus).toBe('idle')
    await store.loadDashboard()

    expect(store.dashboardStatus).toBe('ready')
    expect(store.shows).toHaveLength(2)
    expect(store.genreGroups).toEqual([expect.objectContaining({ genre: 'Drama' })])
    expect(store.dashboardError).toBeNull()
  })

  it('reports a friendly error and clears it on retry', async () => {
    vi.mocked(api.fetchShowIndex).mockRejectedValueOnce(new Error('network down'))
    const store = useCatalogStore()

    await store.loadDashboard()
    expect(store.dashboardStatus).toBe('error')
    expect(store.dashboardError).toBe('Could not load shows from TVmaze. Please try again.')

    vi.mocked(api.fetchShowIndex).mockResolvedValue([show(1)])
    await store.loadDashboard()

    expect(store.dashboardStatus).toBe('ready')
    expect(store.dashboardError).toBeNull()
  })

  it('aborts the previous request when reloaded', async () => {
    const signals: (AbortSignal | undefined)[] = []
    vi.mocked(api.fetchShowIndex).mockImplementation(async (signal) => {
      signals.push(signal)
      return [show(1)]
    })
    const store = useCatalogStore()

    const first = store.loadDashboard()
    const second = store.loadDashboard()
    await Promise.all([first, second])

    expect(signals[0]?.aborted).toBe(true)
    expect(signals[1]?.aborted).toBe(false)
    expect(store.dashboardStatus).toBe('ready')
  })

  it('ignores an aborted dashboard request', async () => {
    vi.mocked(api.fetchShowIndex).mockRejectedValue(abortError())
    const store = useCatalogStore()

    await store.loadDashboard()

    expect(store.dashboardStatus).toBe('loading')
    expect(store.dashboardError).toBeNull()
  })
})

describe('runSearch', () => {
  it('stores results for a query', async () => {
    vi.mocked(api.searchShows).mockResolvedValue([show(7, 'Girls')])
    const store = useCatalogStore()

    await store.runSearch('girls')

    expect(store.searchStatus).toBe('ready')
    expect(store.searchResults).toHaveLength(1)
    expect(api.searchShows).toHaveBeenCalledWith('girls', expect.any(AbortSignal))
  })

  it('resets to idle for a blank query without calling the API', async () => {
    const store = useCatalogStore()
    store.searchResults = [show(1)]

    await store.runSearch('   ')

    expect(store.searchStatus).toBe('idle')
    expect(store.searchResults).toEqual([])
    expect(store.searchError).toBeNull()
    expect(api.searchShows).not.toHaveBeenCalled()
  })

  it('supersedes an in-flight search', async () => {
    const signals: (AbortSignal | undefined)[] = []
    vi.mocked(api.searchShows).mockImplementation(async (_query, signal) => {
      signals.push(signal)
      return [show(1)]
    })
    const store = useCatalogStore()

    await Promise.all([store.runSearch('gi'), store.runSearch('girls')])

    expect(signals[0]?.aborted).toBe(true)
    expect(signals[1]?.aborted).toBe(false)
  })

  it('reports search failures', async () => {
    vi.mocked(api.searchShows).mockRejectedValue(new Error('boom'))
    const store = useCatalogStore()

    await store.runSearch('girls')

    expect(store.searchStatus).toBe('error')
    expect(store.searchError).toBe('Search failed. Please try again.')
  })

  it('ignores an aborted search', async () => {
    vi.mocked(api.searchShows).mockRejectedValue(abortError())
    const store = useCatalogStore()

    await store.runSearch('girls')

    expect(store.searchStatus).toBe('loading')
    expect(store.searchError).toBeNull()
  })

  it('leaves status untouched when the request is aborted mid-flight', async () => {
    let capturedSignal: AbortSignal | undefined
    vi.mocked(api.searchShows).mockImplementation(async (_query, signal) => {
      capturedSignal = signal
      const controller = signal as AbortSignal
      Object.defineProperty(controller, 'aborted', { value: true, configurable: true })
      return [show(1)]
    })
    const store = useCatalogStore()

    await store.runSearch('girls')

    expect(capturedSignal?.aborted).toBe(true)
    expect(store.searchStatus).toBe('loading')
  })
})

describe('cancelSearch', () => {
  it('aborts an in-flight search and returns to idle', async () => {
    let capturedSignal: AbortSignal | undefined
    vi.mocked(api.searchShows).mockImplementation((_query, signal) => {
      capturedSignal = signal
      return new Promise(() => {})
    })
    const store = useCatalogStore()

    void store.runSearch('girls')
    expect(store.searchStatus).toBe('loading')

    store.cancelSearch()

    expect(capturedSignal?.aborted).toBe(true)
    expect(store.searchStatus).toBe('idle')
  })

  it('leaves a settled search alone', async () => {
    vi.mocked(api.searchShows).mockResolvedValue([show(1)])
    const store = useCatalogStore()

    await store.runSearch('girls')
    store.cancelSearch()

    expect(store.searchStatus).toBe('ready')
  })

  it('is safe to call without a pending search', () => {
    const store = useCatalogStore()
    expect(() => store.cancelSearch()).not.toThrow()
    expect(store.searchStatus).toBe('idle')
  })
})

describe('loadShow', () => {
  it('stores the selected show', async () => {
    vi.mocked(api.fetchShowById).mockResolvedValue(show(42, 'Under the Dome'))
    const store = useCatalogStore()

    await store.loadShow('42')

    expect(store.detailsStatus).toBe('ready')
    expect(store.selectedShow?.name).toBe('Under the Dome')
  })

  it('maps a 404 to not-found rather than an error', async () => {
    vi.mocked(api.fetchShowById).mockRejectedValue(new TvmazeApiError('Not found', 404))
    const store = useCatalogStore()

    await store.loadShow('999')

    expect(store.detailsStatus).toBe('not-found')
    expect(store.detailsError).toBeNull()
    expect(store.selectedShow).toBeNull()
  })

  it('reports other API failures as errors', async () => {
    vi.mocked(api.fetchShowById).mockRejectedValue(new TvmazeApiError('Server error', 500))
    const store = useCatalogStore()

    await store.loadShow('1')

    expect(store.detailsStatus).toBe('error')
    expect(store.detailsError).toBe('Could not load show details.')
  })

  it('reports network failures as errors', async () => {
    vi.mocked(api.fetchShowById).mockRejectedValue(new Error('offline'))
    const store = useCatalogStore()

    await store.loadShow('1')

    expect(store.detailsStatus).toBe('error')
  })

  it('ignores an aborted details request', async () => {
    vi.mocked(api.fetchShowById).mockRejectedValue(abortError())
    const store = useCatalogStore()

    await store.loadShow('1')

    expect(store.detailsStatus).toBe('loading')
    expect(store.detailsError).toBeNull()
  })

  it('aborts the previous details request when the id changes', async () => {
    const signals: (AbortSignal | undefined)[] = []
    vi.mocked(api.fetchShowById).mockImplementation(async (id, signalOrOptions) => {
      signals.push(signalOrOptions as AbortSignal)
      return show(Number(id))
    })
    const store = useCatalogStore()

    await Promise.all([store.loadShow('1'), store.loadShow('2')])

    expect(signals[0]?.aborted).toBe(true)
    expect(signals[1]?.aborted).toBe(false)
    expect(store.selectedShow?.id).toBe(2)
  })
})
