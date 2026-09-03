<script setup lang="ts">
import { onMounted } from 'vue'
import PageContainer from 'tvmaze_ui/PageContainer'
import GenreRow from 'tvmaze_ui/GenreRow'
import SkeletonRow from 'tvmaze_ui/SkeletonRow'
import ErrorBanner from 'tvmaze_ui/ErrorBanner'
import EmptyState from 'tvmaze_ui/EmptyState'
import { useCatalogStore } from '../domain/store'
import type { Show } from '../domain/types'

const store = useCatalogStore()

function showLink(show: Show) {
  return `/shows/${show.id}`
}

onMounted(() => {
  if (store.dashboardStatus === 'idle') {
    void store.loadDashboard()
  }
})
</script>

<template>
  <div data-testid="dashboard-page" class="contents">
    <PageContainer class="space-y-8">
      <ErrorBanner
        v-if="store.dashboardStatus === 'error'"
        flush
        :message="store.dashboardError ?? 'Something went wrong.'"
        @retry="store.loadDashboard()"
      />

      <div v-if="store.dashboardStatus === 'loading'" class="space-y-8" aria-busy="true">
        <SkeletonRow flush />
        <SkeletonRow flush />
        <SkeletonRow flush />
      </div>

      <template v-else-if="store.dashboardStatus === 'ready'">
        <EmptyState
          v-if="store.genreGroups.length === 0"
          title="No shows found"
          message="TVmaze returned an empty catalog for the requested pages."
        />
        <GenreRow
          v-for="group in store.genreGroups"
          :key="group.genre"
          flush
          :category="group.genre"
          :shows="group.shows"
          :get-show-link="showLink"
        />
      </template>
    </PageContainer>
  </div>
</template>
