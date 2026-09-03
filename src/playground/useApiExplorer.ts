import { onUnmounted, ref, shallowRef, watch, type WatchSource } from 'vue'
import { TvmazeApiError } from '../domain/api'

export type ApiExplorerStatus = 'idle' | 'loading' | 'ready' | 'error'

/**
 * Runs an async TVmaze request whenever `deps` change. Aborts in-flight work
 * on dependency change / unmount and exposes status + raw payload for playground stories.
 */
export function useApiExplorer<T>(
  deps: WatchSource<unknown> | WatchSource<unknown>[],
  loader: (signal: AbortSignal) => Promise<T>,
  options?: { immediate?: boolean; enabled?: () => boolean },
) {
  const status = ref<ApiExplorerStatus>('idle')
  const error = ref<string | null>(null)
  const data = shallowRef<T | null>(null)
  let controller: AbortController | null = null

  async function run() {
    if (options?.enabled && !options.enabled()) {
      status.value = 'idle'
      error.value = null
      data.value = null
      return
    }

    controller?.abort()
    const next = new AbortController()
    controller = next

    status.value = 'loading'
    error.value = null

    try {
      const result = await loader(next.signal)
      if (next.signal.aborted) return
      data.value = result
      status.value = 'ready'
    } catch (err) {
      if ((err as Error).name === 'AbortError' || next.signal.aborted) return
      error.value =
        err instanceof TvmazeApiError ||
        (err instanceof Error && err.name === 'TvmazeApiError')
          ? (err as Error).message
          : 'Request failed. Please try again.'
      status.value = 'error'
    }
  }

  watch(deps, () => void run(), { immediate: options?.immediate ?? true, deep: true })

  onUnmounted(() => {
    controller?.abort()
  })

  return { status, error, data, reload: run }
}
