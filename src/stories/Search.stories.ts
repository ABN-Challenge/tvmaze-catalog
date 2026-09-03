import preview from '../../.storybook/preview'
import { mocked } from 'storybook/test'
import { toRefs } from 'vue'
import PageContainer from 'tvmaze_ui/PageContainer'
import ShowCardGrid from 'tvmaze_ui/ShowCardGrid'
import EmptyState from 'tvmaze_ui/EmptyState'
import ErrorBanner from 'tvmaze_ui/ErrorBanner'
import SkeletonRow from 'tvmaze_ui/SkeletonRow'
import { searchShows } from '../domain/api'
import JsonPanel from '../playground/JsonPanel.vue'
import { useApiExplorer } from '../playground/useApiExplorer'
import { demoShows } from './fixtures'
import { withAppChrome } from './withAppChrome'

const meta = preview.meta({
  title: 'API/Search',
  decorators: [withAppChrome],
  parameters: {
    docs: {
      description: {
        story:
          'TVmaze search (`/search/shows?q=`). Live stories hit the public API; mocked stories cover loading, error, empty, and success. Chrome matches the host (AppShell / header ResponsiveSearch).',
      },
    },
  },
  argTypes: {
    query: { control: 'text' },
  },
  args: {
    query: 'girls',
  },
  render: (args) => ({
    components: {
      PageContainer,
      ShowCardGrid,
      EmptyState,
      ErrorBanner,
      SkeletonRow,
      JsonPanel,
    },
    setup() {
      const { query } = toRefs(args)
      const { status, error, data, reload } = useApiExplorer(
        query,
        (signal) => searchShows(query.value, signal),
        {
          enabled: () => Boolean(query.value.trim()),
        },
      )

      const encodeQuery = encodeURIComponent
      const showLink = (show: { id: number }) => `#/shows/${show.id}`

      return { args, query, status, error, data, reload, encodeQuery, showLink }
    },
    template: `
      <PageContainer class="space-y-6">
        <p class="text-sm text-[var(--tv-muted)]">
          GET /search/shows?q={{ encodeQuery(query.trim() || '') }}
        </p>

        <ErrorBanner
          v-if="status === 'error'"
          flush
          :message="error ?? 'Search failed.'"
          @retry="reload"
        />
        <SkeletonRow v-if="status === 'loading'" flush :count="4" />

        <EmptyState
          v-else-if="!query.trim()"
          title="Enter a query"
          message="Use the header search or the query control to search TVmaze."
        />
        <EmptyState
          v-else-if="status === 'ready' && (!data || data.length === 0)"
          title="No matches"
          message="Try a different spelling or a shorter query."
        />
        <ShowCardGrid
          v-else-if="data && data.length > 0"
          label="Search results"
          :shows="data"
          :get-show-link="showLink"
        />

        <JsonPanel v-if="status === 'ready'" :value="data" label="Raw search JSON" />
      </PageContainer>
    `,
  }),
})

export const Interactive = meta.story({
  tags: ['live'],
})

export const EmptyQuery = meta.story({
  args: { query: '' },
})

export const Loading = meta.story({
  async beforeEach() {
    mocked(searchShows).mockImplementation(() => new Promise(() => {}))
  },
})

export const RateLimited = meta.story({
  async beforeEach() {
    const err = new Error('Rate limited by TVmaze. Please try again shortly.')
    err.name = 'TvmazeApiError'
    mocked(searchShows).mockRejectedValue(err)
  },
})

export const Empty = meta.story({
  async beforeEach() {
    mocked(searchShows).mockResolvedValue([])
  },
})

export const Success = meta.story({
  async beforeEach() {
    mocked(searchShows).mockResolvedValue(demoShows)
  },
})
