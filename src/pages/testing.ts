import { createPinia, setActivePinia, type Pinia } from 'pinia'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import { h, type Component } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import type { Show } from '../domain/types'

const Blank = { render: () => h('div') }

/** Route names mirror the host so pages can navigate by name. */
export function createTestRouter(): Router {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'dashboard', component: Blank },
      { path: '/search', name: 'search', component: Blank },
      { path: '/shows/:id', name: 'show', component: Blank },
      { path: '/:pathMatch(.*)*', name: 'not-found', component: Blank },
    ],
  })
}

export async function mountPage(
  page: Component,
  options: { path?: string; pinia?: Pinia } = {},
): Promise<{ wrapper: VueWrapper; router: Router; pinia: Pinia }> {
  const pinia = options.pinia ?? createPinia()
  setActivePinia(pinia)

  const router = createTestRouter()
  await router.push(options.path ?? '/')
  await router.isReady()

  const wrapper = mount(page, { global: { plugins: [router, pinia] } })
  return { wrapper, router, pinia }
}

export const makeShow = (partial: Partial<Show> & Pick<Show, 'id' | 'name'>): Show => ({
  genres: ['Drama'],
  rating: { average: 8 },
  image: null,
  ...partial,
})
