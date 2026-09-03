<script setup lang="ts">
defineProps<{
  value: unknown
  label?: string
}>()
</script>

<template>
  <section class="space-y-2" data-testid="json-panel">
    <h3 class="text-sm font-semibold uppercase tracking-wide text-[var(--tv-muted)]">
      {{ label ?? 'Raw JSON' }}
    </h3>
    <pre
      tabindex="0"
      class="max-h-[28rem] overflow-auto rounded-[var(--tv-radius)] border border-[var(--tv-border)] bg-[var(--tv-surface)] p-3 text-xs leading-relaxed text-[var(--tv-text)]"
    >{{ JSON.stringify(value, null, 2) }}</pre>
  </section>
</template>
