import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { fetchShowById, fetchShowIndex, searchShows } from './api'
import { groupShowsByGenre } from './grouping'
import type { Show } from './types'

export const useCatalogStore = defineStore('catalog', () => {
  const shows = ref<Show[]>([])
  const searchResults = ref<Show[]>([])
  const selectedShow = ref<Show | null>(null)

  const dashboardStatus = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const searchStatus = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const detailsStatus = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')

  const dashboardError = ref<string | null>(null)
  const searchError = ref<string | null>(null)
  const detailsError = ref<string | null>(null)

  let searchAbort: AbortController | null = null
  let detailsAbort: AbortController | null = null

  const genreGroups = computed(() => groupShowsByGenre(shows.value))

  async function loadDashboard() {
    dashboardStatus.value = 'loading'
    dashboardError.value = null
    try {
      shows.value = await fetchShowIndex()
      dashboardStatus.value = 'ready'
    } catch {
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
      if ((error as Error).name === 'AbortError') return
      searchError.value = 'Search failed. Please try again.'
      searchStatus.value = 'error'
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
      if ((error as Error).name === 'AbortError') return
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
    loadShow,
  }
})
