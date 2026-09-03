<script setup lang="ts">
import { RouterLink } from 'vue-router'
import PageContainer from 'tvmaze_ui/PageContainer'
import EmptyState from 'tvmaze_ui/EmptyState'
</script>

<template>
  <div data-testid="not-found-page" class="contents">
    <PageContainer>
      <EmptyState
        title="Page not found"
        message="That link does not point anywhere in TVmaze Explorer."
      >
        <RouterLink
          :to="{ name: 'dashboard' }"
          class="font-medium text-[var(--tv-accent-2)] underline-offset-2 hover:underline"
          data-testid="not-found-home"
        >
          Back to the dashboard
        </RouterLink>
      </EmptyState>
    </PageContainer>
  </div>
</template>
