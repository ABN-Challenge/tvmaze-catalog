<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from 'tvmaze_ui/AppShell'
import AppHeader from 'tvmaze_ui/AppHeader'
import AppFooter from 'tvmaze_ui/AppFooter'
import ResponsiveSearch from 'tvmaze_ui/ResponsiveSearch'

/** Standalone catalog playground only — federated pages stay content-only. */
const router = useRouter()
const headerQuery = ref('')

function goSearch() {
  const q = headerQuery.value.trim()
  void router.push({ path: '/search', query: q ? { q } : {} })
}
</script>

<template>
  <AppShell>
    <template #header>
      <AppHeader subtitle="Catalog remote playground">
        <ResponsiveSearch
          v-model="headerQuery"
          @submit="goSearch"
          @mobile-search="router.push('/search')"
        />
      </AppHeader>
    </template>

    <RouterView />

    <template #footer>
      <AppFooter />
    </template>
  </AppShell>
</template>
