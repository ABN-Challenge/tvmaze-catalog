import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import ShowDetailsPage from './ShowDetailsPage.vue'
import { useCatalogStore } from '../domain/store'
import * as api from '../domain/api'
import { TvmazeApiError } from '../domain/api'
import { mountPage, makeShow } from './testing'

vi.mock('../domain/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../domain/api')>()
  return { ...actual, fetchShowById: vi.fn() }
})

const dome = makeShow({
  id: 42,
  name: 'Under the Dome',
  genres: ['Drama', 'Thriller'],
  status: 'Ended',
  premiered: '2013-06-24',
  network: { name: 'CBS' },
  officialSite: 'https://example.com',
  summary: '<p>Hello <b>world</b><script>evil()</script></p>',
  _embedded: {
    cast: [
      { person: { name: 'Mike Vogel' } },
      { person: { name: 'Rachelle Lefevre' } },
      { person: {} },
    ],
  },
})

beforeEach(() => {
  vi.mocked(api.fetchShowById).mockResolvedValue(dome)
})

afterEach(() => {
  vi.resetAllMocks()
})

async function mountDetails(path = '/shows/42') {
  const mounted = await mountPage(ShowDetailsPage, { path })
  const store = useCatalogStore()
  await vi.waitFor(() => {
    expect(store.detailsStatus).not.toBe('loading')
  })
  await nextTick()
  return { ...mounted, store }
}

describe('ShowDetailsPage', () => {
  it('loads the show for the route id', async () => {
    const { wrapper } = await mountDetails()

    expect(api.fetchShowById).toHaveBeenCalledWith('42', expect.any(AbortSignal))
    expect(wrapper.get('[data-testid="show-hero"]').text()).toContain('Under the Dome')
  })

  it('sanitises the summary before rendering it', async () => {
    const { wrapper } = await mountDetails()
    const summary = wrapper.get('[data-testid="show-summary"]')

    expect(summary.html()).toContain('<b>world</b>')
    expect(summary.html()).not.toContain('<script')
  })

  it('lists named cast members only', async () => {
    const { wrapper } = await mountDetails()

    expect(wrapper.text()).toContain('Mike Vogel')
    expect(wrapper.text()).toContain('Rachelle Lefevre')
    expect(wrapper.findAll('li')).toHaveLength(2)
  })

  it('renders no cast section when the show has no embed', async () => {
    vi.mocked(api.fetchShowById).mockResolvedValue(
      makeShow({ id: 7, name: 'No Cast', summary: null }),
    )
    const { wrapper } = await mountDetails('/shows/7')

    expect(wrapper.get('[data-testid="show-hero"]').text()).toContain('No Cast')
    expect(wrapper.findAll('li')).toHaveLength(0)
  })

  it('shows a loading state while fetching', async () => {
    vi.mocked(api.fetchShowById).mockImplementation(() => new Promise(() => {}))
    const { wrapper } = await mountPage(ShowDetailsPage, { path: '/shows/42' })
    const store = useCatalogStore()

    await vi.waitFor(() => {
      expect(store.detailsStatus).toBe('loading')
    })
    await nextTick()

    expect(wrapper.get('[data-testid="loading-state"]').text()).toContain('Loading show details')
  })

  it('shows a not-found state for an unknown show', async () => {
    vi.mocked(api.fetchShowById).mockRejectedValue(new TvmazeApiError('Not found', 404))
    const { wrapper, store } = await mountDetails('/shows/999')

    expect(store.detailsStatus).toBe('not-found')
    expect(wrapper.get('[data-testid="empty-state"]').text()).toContain('Show not found')
    expect(wrapper.find('[data-testid="error-banner"]').exists()).toBe(false)
  })

  it('shows a retryable error banner for a real failure', async () => {
    vi.mocked(api.fetchShowById).mockRejectedValue(new Error('offline'))
    const { wrapper, store } = await mountDetails()

    expect(wrapper.get('[data-testid="error-banner"]').text()).toContain(
      'Could not load show details.',
    )

    vi.mocked(api.fetchShowById).mockResolvedValue(dome)
    await wrapper.get('[data-testid="error-retry"]').trigger('click')
    await vi.waitFor(() => {
      expect(store.detailsStatus).toBe('ready')
    })
  })

  it('falls back to a generic error message', async () => {
    const { wrapper, store } = await mountDetails()
    store.detailsStatus = 'error'
    store.detailsError = null
    await nextTick()

    expect(wrapper.get('[data-testid="error-banner"]').text()).toContain('Could not load this show.')
  })

  it('reloads when the route id changes', async () => {
    const { router } = await mountDetails()
    expect(api.fetchShowById).toHaveBeenCalledTimes(1)

    await router.push('/shows/7')
    await nextTick()

    await vi.waitFor(() => {
      expect(api.fetchShowById).toHaveBeenCalledWith('7', expect.any(AbortSignal))
    })
  })

  it('skips loading when the route has no id', async () => {
    await mountPage(ShowDetailsPage, { path: '/' })
    expect(api.fetchShowById).not.toHaveBeenCalled()
  })

  it('goes back through history when there is somewhere to return to', async () => {
    const { wrapper, router } = await mountDetails()
    const back = vi.spyOn(router, 'back').mockImplementation(() => {})
    const push = vi.spyOn(router, 'push')
    vi.spyOn(window.history, 'state', 'get').mockReturnValue({ back: '/' })

    await wrapper.get('[data-testid="details-back"]').trigger('click')

    expect(back).toHaveBeenCalled()
    expect(push).not.toHaveBeenCalled()
  })

  it('falls back to the dashboard when deep linked', async () => {
    const { wrapper, router } = await mountDetails()
    const back = vi.spyOn(router, 'back').mockImplementation(() => {})
    const push = vi.spyOn(router, 'push').mockResolvedValue()
    vi.spyOn(window.history, 'state', 'get').mockReturnValue({ back: null })

    await wrapper.get('[data-testid="details-back"]').trigger('click')

    expect(back).not.toHaveBeenCalled()
    expect(push).toHaveBeenCalledWith({ name: 'dashboard' })
  })
})
