import { fileURLToPath, URL } from 'node:url'
import path from 'node:path'

const uiSrc = fileURLToPath(new URL('../tvmaze-ui/src', import.meta.url))

/**
 * Maps the federated `tvmaze_ui/*` specifiers onto the sibling design-system
 * source. Storybook and the unit tests both need this because federation is
 * disabled outside the dev/build server.
 */
export const uiExposes: Record<string, string> = {
  'tvmaze_ui/theme': path.join(uiSrc, 'theme.ts'),
  'tvmaze_ui/styles': path.join(uiSrc, 'style.css'),
  'tvmaze_ui/SkipLink': path.join(uiSrc, 'components/atoms/SkipLink.vue'),
  'tvmaze_ui/Button': path.join(uiSrc, 'components/atoms/Button.vue'),
  'tvmaze_ui/RatingBadge': path.join(uiSrc, 'components/atoms/RatingBadge.vue'),
  'tvmaze_ui/LoadingState': path.join(uiSrc, 'components/atoms/LoadingState.vue'),
  'tvmaze_ui/SearchInput': path.join(uiSrc, 'components/molecules/SearchInput.vue'),
  'tvmaze_ui/ResponsiveSearch': path.join(uiSrc, 'components/molecules/ResponsiveSearch.vue'),
  'tvmaze_ui/ShowCard': path.join(uiSrc, 'components/molecules/ShowCard.vue'),
  'tvmaze_ui/ShowCardGrid': path.join(uiSrc, 'components/molecules/ShowCardGrid.vue'),
  'tvmaze_ui/EmptyState': path.join(uiSrc, 'components/molecules/EmptyState.vue'),
  'tvmaze_ui/ErrorBanner': path.join(uiSrc, 'components/molecules/ErrorBanner.vue'),
  'tvmaze_ui/SkeletonRow': path.join(uiSrc, 'components/molecules/SkeletonRow.vue'),
  'tvmaze_ui/AppHeader': path.join(uiSrc, 'components/organisms/AppHeader.vue'),
  'tvmaze_ui/AppFooter': path.join(uiSrc, 'components/organisms/AppFooter.vue'),
  'tvmaze_ui/AppShell': path.join(uiSrc, 'components/organisms/AppShell.vue'),
  'tvmaze_ui/PageContainer': path.join(uiSrc, 'components/organisms/PageContainer.vue'),
  'tvmaze_ui/GenreRow': path.join(uiSrc, 'components/organisms/GenreRow.vue'),
  'tvmaze_ui/ShowHero': path.join(uiSrc, 'components/organisms/ShowHero.vue'),
}
