import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import DashboardPage from './DashboardPage.vue'
import { useCatalogStore } from '../domain/store'
import * as api from '../domain/api'
import { mountPage, makeShow } from './testing'

vi.mock('../domain/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../domain/api')>()
  return { ...actual, fetchShowIndex: vi.fn() }
})

beforeEach(() => {
  vi.mocked(api.fetchShowIndex).mockResolvedValue([])
})

afterEach(() => {
  vi.resetAllMocks()
})

/** The mount-time load is async, so let it settle before driving state. */
async function mountDashboard() {
  const mounted = await mountPage(DashboardPage)
  const store = useCatalogStore()
  await vi.waitFor(() => {
    expect(store.dashboardStatus).not.toBe('loading')
  })
  await nextTick()
  return { ...mounted, store }
}

describe('DashboardPage', () => {
  it('loads the show index once on mount', async () => {
    const { store } = await mountDashboard()

    expect(api.fetchShowIndex).toHaveBeenCalledTimes(1)
    expect(store.dashboardStatus).toBe('ready')
  })

  it('does not reload when the dashboard is already populated', async () => {
    const { pinia } = await mountDashboard()
    expect(api.fetchShowIndex).toHaveBeenCalledTimes(1)

    await mountPage(DashboardPage, { pinia })
    expect(api.fetchShowIndex).toHaveBeenCalledTimes(1)
  })

  it('shows skeleton rows while loading', async () => {
    const { wrapper, store } = await mountDashboard()
    store.dashboardStatus = 'loading'
    await nextTick()

    expect(wrapper.findAll('[data-testid="skeleton-row"]')).toHaveLength(3)
    expect(wrapper.find('[aria-busy="true"]').exists()).toBe(true)
  })

  it('renders one genre row per group with links to details', async () => {
    const { wrapper, store } = await mountDashboard()
    store.shows = [
      makeShow({ id: 1, name: 'Drama One', rating: { average: 7 } }),
      makeShow({ id: 2, name: 'Comedy One', genres: ['Comedy'] }),
    ]
    await nextTick()

    expect(wrapper.findAll('[data-testid="genre-row"]')).toHaveLength(2)
    expect(wrapper.findAll('[data-testid="genre-title"]').map((t) => t.text())).toEqual([
      'Comedy',
      'Drama',
    ])
    expect(wrapper.find('[data-testid="show-card"]').attributes('href')).toBe('/shows/2')
  })

  it('shows an empty state when the catalog has no shows', async () => {
    const { wrapper } = await mountDashboard()
    await nextTick()

    expect(wrapper.get('[data-testid="empty-state"]').text()).toContain('No shows found')
  })

  it('shows a retryable error banner', async () => {
    vi.mocked(api.fetchShowIndex).mockRejectedValue(new Error('network down'))
    const { wrapper, store } = await mountDashboard()
    await nextTick()

    expect(wrapper.get('[data-testid="error-banner"]').text()).toContain(
      'Could not load shows from TVmaze',
    )

    vi.mocked(api.fetchShowIndex).mockResolvedValue([makeShow({ id: 1, name: 'Recovered' })])
    await wrapper.get('[data-testid="error-retry"]').trigger('click')
    await vi.waitFor(() => {
      expect(store.dashboardStatus).toBe('ready')
    })
  })

  it('falls back to a generic error message', async () => {
    const { wrapper, store } = await mountDashboard()
    store.dashboardStatus = 'error'
    store.dashboardError = null
    await nextTick()

    expect(wrapper.get('[data-testid="error-banner"]').text()).toContain('Something went wrong.')
  })
})
