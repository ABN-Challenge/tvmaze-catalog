import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import { h } from 'vue'

const Blank = { render: () => h('div') }

/**
 * Minimal router so components that render RouterLink (ShowCard, NotFoundPage)
 * work in isolation. Memory history keeps the Storybook URL untouched.
 */
export function createStorybookRouter(): Router {
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

export const storybookRouter = createStorybookRouter()
