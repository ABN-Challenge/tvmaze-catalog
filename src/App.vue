<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppShell from 'tvmaze_ui/AppShell'
import AppHeader from 'tvmaze_ui/AppHeader'
import AppFooter from 'tvmaze_ui/AppFooter'
import ResponsiveSearch from 'tvmaze_ui/ResponsiveSearch'

/** Standalone catalog playground only — federated pages stay content-only. */
const router = useRouter()
const route = useRoute()

function queryFromRoute(q: unknown): string {
  if (Array.isArray(q)) return String(q[0] ?? '')
  return String(q ?? '')
}

const headerQuery = ref(queryFromRoute(route.query.q))

watch(
  () => [route.path, route.query.q] as const,
  () => {
    if (route.path !== '/search') return
    const next = queryFromRoute(route.query.q)
    if (next !== headerQuery.value) headerQuery.value = next
  },
)

watch(headerQuery, (value) => {
  if (route.path !== '/search') return
  const next = value.trim()
  const current = queryFromRoute(route.query.q)
  if (next === current) return
  void router.replace({ path: '/search', query: next ? { q: next } : {} })
})

function goSearch() {
  const q = headerQuery.value.trim()
  void router.push({ path: '/search', query: q ? { q } : {} })
}
</script>

<template>
  <AppShell>
    <template #header>
      <AppHeader subtitle="Catalog remote playground">
        <ResponsiveSearch v-model="headerQuery" @submit="goSearch" />
      </AppHeader>
    </template>

    <RouterView />

    <template #footer>
      <AppFooter />
    </template>
  </AppShell>
</template>
