import type { SearchResult, Show } from './types'

const API_BASE = 'https://api.tvmaze.com'

export class TvmazeApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message)
    this.name = 'TvmazeApiError'
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  if (response.status === 404) {
    throw new TvmazeApiError('Not found', 404)
  }

  if (response.status === 429) {
    throw new TvmazeApiError('Rate limited by TVmaze. Please try again shortly.', 429)
  }

  if (!response.ok) {
    throw new TvmazeApiError(`TVmaze request failed (${response.status})`, response.status)
  }

  return (await response.json()) as T
}

export async function fetchShowsPage(page = 0, signal?: AbortSignal): Promise<Show[]> {
  return request<Show[]>(`/shows?page=${page}`, { signal })
}

/** Fetch page 0 and optionally page 1. Stops on 404. */
export async function fetchShowIndex(
  signal?: AbortSignal,
  options?: { includeSecondPage?: boolean },
): Promise<Show[]> {
  const includeSecondPage = options?.includeSecondPage !== false
  const first = await fetchShowsPage(0, signal)
  if (!includeSecondPage) return first

  try {
    const second = await fetchShowsPage(1, signal)
    const seen = new Set(first.map((s) => s.id))
    return [...first, ...second.filter((s) => !seen.has(s.id))]
  } catch (error) {
    if (error instanceof TvmazeApiError && error.status === 404) {
      return first
    }
    throw error
  }
}

export async function searchShows(query: string, signal?: AbortSignal): Promise<Show[]> {
  const trimmed = query.trim()
  if (!trimmed) return []
  const results = await request<SearchResult[]>(
    `/search/shows?q=${encodeURIComponent(trimmed)}`,
    { signal },
  )
  return results.map((result) => result.show)
}

export type FetchShowByIdOptions = {
  signal?: AbortSignal
  /** When true (default), request `?embed[]=cast`. */
  embedCast?: boolean
}

function normalizeShowOptions(
  signalOrOptions?: AbortSignal | FetchShowByIdOptions,
): FetchShowByIdOptions {
  if (signalOrOptions instanceof AbortSignal || signalOrOptions === undefined) {
    return { signal: signalOrOptions, embedCast: true }
  }
  return { embedCast: true, ...signalOrOptions }
}

export async function fetchShowById(
  id: number | string,
  signalOrOptions?: AbortSignal | FetchShowByIdOptions,
): Promise<Show> {
  const { signal, embedCast = true } = normalizeShowOptions(signalOrOptions)
  const query = embedCast ? '?embed[]=cast' : ''
  return request<Show>(`/shows/${id}${query}`, { signal })
}
