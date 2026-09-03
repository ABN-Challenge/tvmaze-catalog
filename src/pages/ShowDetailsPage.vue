<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageContainer from 'tvmaze_ui/PageContainer'
import ShowHero from 'tvmaze_ui/ShowHero'
import ErrorBanner from 'tvmaze_ui/ErrorBanner'
import EmptyState from 'tvmaze_ui/EmptyState'
import LoadingState from 'tvmaze_ui/LoadingState'
import Button from 'tvmaze_ui/Button'
import { useCatalogStore } from '../domain/store'
import { sanitizeSummaryHtml } from '../domain/sanitize'

const route = useRoute()
const router = useRouter()
const store = useCatalogStore()

const showId = computed(() => String(route.params.id ?? ''))

const heroShow = computed(() => {
  const show = store.selectedShow
  if (!show) return null
  return {
    ...show,
    summary: sanitizeSummaryHtml(show.summary),
  }
})

const castNames = computed(() =>
  (store.selectedShow?._embedded?.cast ?? [])
    .map((item) => item.person?.name)
    .filter((name): name is string => Boolean(name))
    .slice(0, 8),
)

function load() {
  if (showId.value) {
    void store.loadShow(showId.value)
  }
}

onMounted(load)
watch(showId, load)
</script>

<template>
  <div data-testid="details-page" class="contents">
    <PageContainer class="space-y-4">
      <Button variant="ghost" @click="router.back()">← Back</Button>

      <ErrorBanner
        v-if="store.detailsStatus === 'error'"
        flush
        :message="store.detailsError ?? 'Could not load this show.'"
        @retry="load"
      />

      <LoadingState v-if="store.detailsStatus === 'loading'" message="Loading show details…" />

      <ShowHero v-else-if="heroShow" :show="heroShow" :cast-names="castNames" />

      <EmptyState
        v-else-if="store.detailsStatus === 'ready'"
        title="Show not found"
        message="This show could not be loaded from TVmaze."
      />
    </PageContainer>
  </div>
</template>
