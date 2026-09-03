import preview from '../../.storybook/preview'
import { mocked } from 'storybook/test'
import { computed, toRefs } from 'vue'
import PageContainer from 'tvmaze_ui/PageContainer'
import ShowHero from 'tvmaze_ui/ShowHero'
import ErrorBanner from 'tvmaze_ui/ErrorBanner'
import LoadingState from 'tvmaze_ui/LoadingState'
import EmptyState from 'tvmaze_ui/EmptyState'
import { fetchShowById } from '../domain/api'
import { sanitizeSummaryHtml } from '../domain/sanitize'
import JsonPanel from '../playground/JsonPanel.vue'
import { useApiExplorer } from '../playground/useApiExplorer'
import { demoShow } from './fixtures'
import { withAppChrome } from './withAppChrome'

const meta = preview.meta({
  title: 'API/ShowDetails',
  decorators: [withAppChrome],
  parameters: {
    docs: {
      description: {
        story:
          'TVmaze show details (`/shows/:id`). Live stories hit the public API; mocked stories cover loading, error, empty, and success.',
      },
    },
  },
  argTypes: {
    id: { control: { type: 'number', min: 1, step: 1 } },
    embedCast: { control: 'boolean' },
  },
  args: {
    id: 82,
    embedCast: true,
  },
  render: (args) => ({
    components: { PageContainer, ShowHero, ErrorBanner, LoadingState, EmptyState, JsonPanel },
    setup() {
      const { id, embedCast } = toRefs(args)
      const { status, error, data, reload } = useApiExplorer([id, embedCast], (signal) =>
        fetchShowById(id.value, { signal, embedCast: embedCast.value }),
      )

      const heroShow = computed(() => {
        if (!data.value) return null
        return {
          ...data.value,
          summary: sanitizeSummaryHtml(data.value.summary),
        }
      })

      const castNames = computed(() =>
        (data.value?._embedded?.cast ?? [])
          .map((item) => item.person?.name)
          .filter((name): name is string => Boolean(name))
          .slice(0, 8),
      )

      return { args, status, error, data, heroShow, castNames, reload }
    },
    template: `
      <PageContainer class="space-y-6">
        <p class="text-sm text-[var(--tv-muted)]">
          GET /shows/{{ args.id }}{{ args.embedCast ? '?embed[]=cast' : '' }}
        </p>

        <ErrorBanner
          v-if="status === 'error'"
          flush
          :message="error ?? 'Could not load show.'"
          @retry="reload"
        />
        <LoadingState v-if="status === 'loading'" message="Loading show details…" />

        <ShowHero v-else-if="heroShow" :show="heroShow" :cast-names="castNames" />
        <EmptyState
          v-else-if="status === 'ready'"
          title="Show not found"
          message="TVmaze returned no show for this id."
        />

        <JsonPanel v-if="status === 'ready'" :value="data" label="Raw show details JSON" />
      </PageContainer>
    `,
  }),
})

export const Interactive = meta.story({
  tags: ['live'],
})

export const WithoutCast = meta.story({
  tags: ['live'],
  args: { id: 82, embedCast: false },
})

export const Loading = meta.story({
  async beforeEach() {
    mocked(fetchShowById).mockImplementation(() => new Promise(() => {}))
  },
})

export const RateLimited = meta.story({
  async beforeEach() {
    const err = new Error('Rate limited by TVmaze. Please try again shortly.')
    err.name = 'TvmazeApiError'
    mocked(fetchShowById).mockRejectedValue(err)
  },
})

export const Empty = meta.story({
  async beforeEach() {
    // Force the ready + no-hero path that renders EmptyState.
    mocked(fetchShowById).mockResolvedValue(null as unknown as Awaited<ReturnType<typeof fetchShowById>>)
  },
})

export const Success = meta.story({
  async beforeEach() {
    mocked(fetchShowById).mockResolvedValue(demoShow)
  },
})
