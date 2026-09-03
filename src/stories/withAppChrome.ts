import type { Decorator } from '@storybook/vue3'
import { ref } from 'vue'
import AppShell from 'tvmaze_ui/AppShell'
import AppHeader from 'tvmaze_ui/AppHeader'
import AppFooter from 'tvmaze_ui/AppFooter'
import ResponsiveSearch from 'tvmaze_ui/ResponsiveSearch'

/**
 * Mirrors the host shell (tvmaze App.vue): AppShell + header search + footer.
 * Page content stays in the story body (PageContainer, results, etc.).
 */
export const withAppChrome: Decorator = () => ({
  components: { AppShell, AppHeader, AppFooter, ResponsiveSearch },
  setup() {
    const headerQuery = ref('')
    return { headerQuery }
  },
  template: `
    <AppShell>
      <template #header>
        <AppHeader>
          <ResponsiveSearch v-model="headerQuery" />
        </AppHeader>
      </template>
      <story />
      <template #footer>
        <AppFooter />
      </template>
    </AppShell>
  `,
})
