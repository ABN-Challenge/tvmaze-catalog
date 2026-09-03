import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { fetchShowById, fetchShowIndex, searchShows, TvmazeApiError } from './api'
import { groupShowsByGenre } from './grouping'
import type { Show } from './types'

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error'
/** Details can additionally resolve to a 404, which is not a failure. */
type DetailsStatus = LoadStatus | 'not-found'

function isAbortError(error: unknown): boolean {
  return (error as Error | undefined)?.name === 'AbortError'
}

export const useCatalogStore = defineStore('catalog', () => {
  const shows = ref<Show[]>([])
  const searchResults = ref<Show[]>([])
  const selectedShow = ref<Show | null>(null)

  const dashboardStatus = ref<LoadStatus>('idle')
  const searchStatus = ref<LoadStatus>('idle')
  const detailsStatus = ref<DetailsStatus>('idle')

  const dashboardError = ref<string | null>(null)
  const searchError = ref<string | null>(null)
  const detailsError = ref<string | null>(null)

  let dashboardAbort: AbortController | null = null
  let searchAbort: AbortController | null = null
  let detailsAbort: AbortController | null = null

  const genreGroups = computed(() => groupShowsByGenre(shows.value))

  async function loadDashboard() {
    dashboardAbort?.abort()
    const controller = new AbortController()
    dashboardAbort = controller

    dashboardStatus.value = 'loading'
    dashboardError.value = null
    try {
      shows.value = await fetchShowIndex(controller.signal)
      if (!controller.signal.aborted) {
        dashboardStatus.value = 'ready'
      }
    } catch (error) {
      if (isAbortError(error)) return
      dashboardError.value = 'Could not load shows from TVmaze. Please try again.'
      dashboardStatus.value = 'error'
    }
  }

  async function runSearch(query: string) {
    searchAbort?.abort()
    const controller = new AbortController()
    searchAbort = controller

    const trimmed = query.trim()
    if (!trimmed) {
      searchResults.value = []
      searchStatus.value = 'idle'
      searchError.value = null
      return
    }

    searchStatus.value = 'loading'
    searchError.value = null
    try {
      searchResults.value = await searchShows(trimmed, controller.signal)
      if (!controller.signal.aborted) {
        searchStatus.value = 'ready'
      }
    } catch (error) {
      if (isAbortError(error)) return
      searchError.value = 'Search failed. Please try again.'
      searchStatus.value = 'error'
    }
  }

  /** Drops an in-flight search so an unmounting page cannot strand `loading`. */
  function cancelSearch() {
    searchAbort?.abort()
    searchAbort = null
    if (searchStatus.value === 'loading') {
      searchStatus.value = 'idle'
    }
  }

  async function loadShow(id: string) {
    detailsAbort?.abort()
    const controller = new AbortController()
    detailsAbort = controller

    detailsStatus.value = 'loading'
    detailsError.value = null
    selectedShow.value = null

    try {
      selectedShow.value = await fetchShowById(id, controller.signal)
      if (!controller.signal.aborted) {
        detailsStatus.value = 'ready'
      }
    } catch (error) {
      if (isAbortError(error)) return
      if (error instanceof TvmazeApiError && error.status === 404) {
        detailsStatus.value = 'not-found'
        return
      }
      detailsError.value = 'Could not load show details.'
      detailsStatus.value = 'error'
    }
  }

  return {
    shows,
    searchResults,
    selectedShow,
    dashboardStatus,
    searchStatus,
    detailsStatus,
    dashboardError,
    searchError,
    detailsError,
    genreGroups,
    loadDashboard,
    runSearch,
    cancelSearch,
    loadShow,
  }
})
