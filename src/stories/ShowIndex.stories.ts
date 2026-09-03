import preview from '../../.storybook/preview'
import { mocked } from 'storybook/test'
import { computed, toRefs } from 'vue'
import PageContainer from 'tvmaze_ui/PageContainer'
import GenreRow from 'tvmaze_ui/GenreRow'
import SkeletonRow from 'tvmaze_ui/SkeletonRow'
import ErrorBanner from 'tvmaze_ui/ErrorBanner'
import EmptyState from 'tvmaze_ui/EmptyState'
import { fetchShowIndex, fetchShowsPage } from '../domain/api'
import { groupShowsByGenre } from '../domain/grouping'
import JsonPanel from '../playground/JsonPanel.vue'
import { useApiExplorer } from '../playground/useApiExplorer'
import { demoShows } from './fixtures'
import { withAppChrome } from './withAppChrome'

const meta = preview.meta({
  title: 'API/ShowIndex',
  decorators: [withAppChrome],
  parameters: {
    docs: {
      description: {
        story:
          'TVmaze Show Index (`/shows?page=`). Live stories hit the public API; mocked stories cover loading, error, empty, and success.',
      },
    },
  },
  argTypes: {
    page: { control: { type: 'number', min: 0, max: 20, step: 1 } },
    includeSecondPage: {
      control: 'boolean',
      description: 'When page is 0, also fetch page 1 and merge (dashboard behaviour).',
    },
  },
  args: {
    page: 0,
    includeSecondPage: true,
  },
  render: (args) => ({
    components: { PageContainer, GenreRow, SkeletonRow, ErrorBanner, EmptyState, JsonPanel },
    setup() {
      const { page, includeSecondPage } = toRefs(args)
      const { status, error, data, reload } = useApiExplorer(
        [page, includeSecondPage],
        async (signal) => {
          if (page.value === 0 && includeSecondPage.value) {
            return fetchShowIndex(signal, { includeSecondPage: true })
          }
          return fetchShowsPage(page.value, signal)
        },
      )

      const groups = computed(() => groupShowsByGenre(data.value ?? []))
      const showLink = (show: { id: number }) => `/shows/${show.id}`

      return { args, status, error, data, groups, showLink, reload }
    },
    template: `
      <PageContainer class="space-y-6">
        <p class="text-sm text-[var(--tv-muted)]">
          GET /shows?page={{ args.page }}
          <span v-if="args.page === 0 && args.includeSecondPage"> (+ page 1 when available)</span>
        </p>

        <ErrorBanner
          v-if="status === 'error'"
          flush
          :message="error ?? 'Request failed.'"
          @retry="reload"
        />
        <div v-if="status === 'loading'" class="space-y-6" aria-busy="true">
          <SkeletonRow flush />
          <SkeletonRow flush />
        </div>
        <template v-else-if="status === 'ready'">
          <EmptyState
            v-if="groups.length === 0"
            title="No shows"
            message="This page returned an empty list."
          />
          <div v-else class="space-y-6">
            <GenreRow
              v-for="group in groups"
              :key="group.genre"
              flush
              :category="group.genre"
              :shows="group.shows"
              :get-show-link="showLink"
            />
          </div>
          <JsonPanel :value="data" label="Raw show index JSON" />
        </template>
      </PageContainer>
    `,
  }),
})

export const Interactive = meta.story({
  tags: ['live'],
})

export const PageOnly = meta.story({
  tags: ['live'],
  args: { page: 1, includeSecondPage: false },
})

export const Loading = meta.story({
  args: { page: 0, includeSecondPage: false },
  async beforeEach() {
    mocked(fetchShowsPage).mockImplementation(() => new Promise(() => {}))
  },
})

export const RateLimited = meta.story({
  args: { page: 0, includeSecondPage: false },
  async beforeEach() {
    const err = new Error('Rate limited by TVmaze. Please try again shortly.')
    err.name = 'TvmazeApiError'
    mocked(fetchShowsPage).mockRejectedValue(err)
  },
})

export const Empty = meta.story({
  args: { page: 0, includeSecondPage: false },
  async beforeEach() {
    mocked(fetchShowsPage).mockResolvedValue([])
  },
})

export const Success = meta.story({
  args: { page: 0, includeSecondPage: false },
  async beforeEach() {
    mocked(fetchShowsPage).mockResolvedValue(demoShows)
  },
})
