import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import SearchPage from './SearchPage.vue'
import { useCatalogStore } from '../domain/store'
import * as api from '../domain/api'
import { mountPage, makeShow } from './testing'

vi.mock('../domain/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../domain/api')>()
  return { ...actual, searchShows: vi.fn() }
})

beforeEach(() => {
  vi.mocked(api.searchShows).mockResolvedValue([])
})

afterEach(() => {
  vi.useRealTimers()
  vi.resetAllMocks()
})

async function mountSearch(path = '/search') {
  const mounted = await mountPage(SearchPage, { path })
  return { ...mounted, store: useCatalogStore() }
}

describe('SearchPage', () => {
  it('prompts for a query when the URL has none', async () => {
    const { wrapper } = await mountSearch()

    expect(wrapper.get('[data-testid="empty-state"]').text()).toContain('Search TV shows')
    expect(api.searchShows).not.toHaveBeenCalled()
  })

  it('searches immediately for a query present on first render', async () => {
    vi.mocked(api.searchShows).mockResolvedValue([makeShow({ id: 1, name: 'Girls' })])
    const { wrapper, store } = await mountSearch('/search?q=girls')

    await vi.waitFor(() => {
      expect(store.searchStatus).toBe('ready')
    })
    await nextTick()

    expect(api.searchShows).toHaveBeenCalledWith('girls', expect.any(AbortSignal))
    expect(wrapper.find('[data-testid="show-card-grid"]').exists()).toBe(true)
    expect(wrapper.get('[data-testid="show-card"]').attributes('href')).toBe('/shows/1')
  })

  it('takes the first value when the query param repeats', async () => {
    await mountSearch('/search?q=girls&q=boys')

    await vi.waitFor(() => {
      expect(api.searchShows).toHaveBeenCalledWith('girls', expect.any(AbortSignal))
    })
  })

  it('treats a valueless repeated query param as empty', async () => {
    const { wrapper } = await mountSearch('/search?q&q=boys')

    expect(wrapper.get('[data-testid="empty-state"]').text()).toContain('Search TV shows')
    expect(api.searchShows).not.toHaveBeenCalled()
  })

  it('debounces query changes into a single search', async () => {
    vi.useFakeTimers()
    const { router } = await mountSearch('/search')

    await router.replace('/search?q=g')
    await nextTick()
    await router.replace('/search?q=gi')
    await nextTick()
    await router.replace('/search?q=girls')
    await nextTick()

    expect(api.searchShows).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(350)

    expect(api.searchShows).toHaveBeenCalledTimes(1)
    expect(api.searchShows).toHaveBeenCalledWith('girls', expect.any(AbortSignal))
  })

  it('cancels a pending debounce when the page unmounts', async () => {
    vi.useFakeTimers()
    const { wrapper, router } = await mountSearch('/search')

    await router.replace('/search?q=girls')
    await nextTick()
    wrapper.unmount()

    await vi.advanceTimersByTimeAsync(1000)

    expect(api.searchShows).not.toHaveBeenCalled()
  })

  it('releases an in-flight search on unmount so status cannot strand', async () => {
    vi.mocked(api.searchShows).mockImplementation(() => new Promise(() => {}))
    const { wrapper, store } = await mountSearch('/search?q=girls')

    await vi.waitFor(() => {
      expect(store.searchStatus).toBe('loading')
    })
    wrapper.unmount()

    expect(store.searchStatus).toBe('idle')
  })

  it('shows a skeleton while searching', async () => {
    vi.mocked(api.searchShows).mockImplementation(() => new Promise(() => {}))
    const { wrapper, store } = await mountSearch('/search?q=girls')

    await vi.waitFor(() => {
      expect(store.searchStatus).toBe('loading')
    })
    await nextTick()

    expect(wrapper.find('[data-testid="skeleton-row"]').exists()).toBe(true)
  })

  it('reports no matches for an unsuccessful search', async () => {
    const { wrapper, store } = await mountSearch('/search?q=zzzz')

    await vi.waitFor(() => {
      expect(store.searchStatus).toBe('ready')
    })
    await nextTick()

    expect(wrapper.get('[data-testid="empty-state"]').text()).toContain('No matches')
  })

  it('shows a retryable error banner', async () => {
    vi.mocked(api.searchShows).mockRejectedValue(new Error('boom'))
    const { wrapper, store } = await mountSearch('/search?q=girls')

    await vi.waitFor(() => {
      expect(store.searchStatus).toBe('error')
    })
    await nextTick()

    expect(wrapper.get('[data-testid="error-banner"]').text()).toContain('Search failed')

    vi.mocked(api.searchShows).mockResolvedValue([makeShow({ id: 5, name: 'Recovered' })])
    await wrapper.get('[data-testid="error-retry"]').trigger('click')
    await vi.waitFor(() => {
      expect(store.searchStatus).toBe('ready')
    })
  })

  it('falls back to a generic error message', async () => {
    const { wrapper, store } = await mountSearch('/search?q=girls')

    await vi.waitFor(() => {
      expect(store.searchStatus).toBe('ready')
    })
    store.searchStatus = 'error'
    store.searchError = null
    await nextTick()

    expect(wrapper.get('[data-testid="error-banner"]').text()).toContain('Search failed.')
  })
})
