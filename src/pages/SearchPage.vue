<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import PageContainer from 'tvmaze_ui/PageContainer'
import ShowCardGrid from 'tvmaze_ui/ShowCardGrid'
import EmptyState from 'tvmaze_ui/EmptyState'
import ErrorBanner from 'tvmaze_ui/ErrorBanner'
import SkeletonRow from 'tvmaze_ui/SkeletonRow'
import { useCatalogStore } from '../domain/store'
import type { Show } from '../domain/types'

const route = useRoute()
const store = useCatalogStore()

const query = computed(() => {
  const q = route.query.q
  return Array.isArray(q) ? String(q[0] ?? '') : String(q ?? '')
})

let debounceTimer: ReturnType<typeof setTimeout> | undefined

function scheduleSearch(value: string) {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    void store.runSearch(value)
  }, 350)
}

watch(
  query,
  (value, previous) => {
    if (previous === undefined) {
      if (value.trim()) void store.runSearch(value)
      return
    }
    scheduleSearch(value)
  },
  { immediate: true },
)

function showLink(show: Show) {
  return `#/shows/${show.id}`
}
</script>

<template>
  <div data-testid="search-page" class="contents">
    <PageContainer class="space-y-6">
      <ErrorBanner
        v-if="store.searchStatus === 'error'"
        flush
        :message="store.searchError ?? 'Search failed.'"
        @retry="store.runSearch(query)"
      />

      <SkeletonRow v-if="store.searchStatus === 'loading'" flush :count="4" />

      <EmptyState
        v-else-if="!query.trim()"
        title="Search TV shows"
        message="Use the search field in the header to find shows."
      />

      <EmptyState
        v-else-if="store.searchStatus === 'ready' && store.searchResults.length === 0"
        title="No matches"
        message="Try a different spelling or a shorter query."
      />

      <ShowCardGrid
        v-else-if="store.searchResults.length > 0"
        label="Search results"
        :shows="store.searchResults"
        :get-show-link="showLink"
      />
    </PageContainer>
  </div>
</template>
