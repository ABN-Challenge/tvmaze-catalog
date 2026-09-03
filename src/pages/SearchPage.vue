<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageContainer from 'tvmaze_ui/PageContainer'
import SearchInput from 'tvmaze_ui/SearchInput'
import ShowCardGrid from 'tvmaze_ui/ShowCardGrid'
import EmptyState from 'tvmaze_ui/EmptyState'
import ErrorBanner from 'tvmaze_ui/ErrorBanner'
import SkeletonRow from 'tvmaze_ui/SkeletonRow'
import { useCatalogStore } from '../domain/store'
import type { Show } from '../domain/types'

const route = useRoute()
const router = useRouter()
const store = useCatalogStore()
const query = ref(String(route.query.q ?? ''))

let debounceTimer: ReturnType<typeof setTimeout> | undefined

function scheduleSearch(value: string) {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    void store.runSearch(value)
  }, 350)
}

watch(query, (value) => {
  void router.replace({ path: '/search', query: value.trim() ? { q: value } : {} })
  scheduleSearch(value)
})

onMounted(() => {
  if (query.value.trim()) {
    void store.runSearch(query.value)
  }
})

function onSubmit() {
  clearTimeout(debounceTimer)
  void store.runSearch(query.value)
}

function showLink(show: Show) {
  return `#/shows/${show.id}`
}
</script>

<template>
  <div data-testid="search-page" class="contents">
    <PageContainer class="space-y-6">
      <SearchInput v-model="query" @submit="onSubmit" />

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
        message="Type a show name to search the TVmaze catalog."
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
