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

/** A deep-linked details page has no in-app history to return to. */
function goBack() {
  if (window.history.state?.back) {
    router.back()
    return
  }
  void router.push({ name: 'dashboard' })
}

onMounted(load)
watch(showId, load)
</script>

<template>
  <div data-testid="details-page" class="contents">
    <PageContainer class="space-y-4">
      <Button variant="ghost" data-testid="details-back" @click="goBack()">← Back</Button>

      <ErrorBanner
        v-if="store.detailsStatus === 'error'"
        flush
        :message="store.detailsError ?? 'Could not load this show.'"
        @retry="load"
      />

      <LoadingState v-if="store.detailsStatus === 'loading'" message="Loading show details…" />

      <EmptyState
        v-else-if="store.detailsStatus === 'not-found'"
        title="Show not found"
        message="This show does not exist on TVmaze, or it has been removed."
      />

      <ShowHero v-else-if="heroShow" :show="heroShow" :cast-names="castNames" />
    </PageContainer>
  </div>
</template>
