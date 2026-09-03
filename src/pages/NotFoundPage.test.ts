import { describe, expect, it } from 'vitest'
import NotFoundPage from './NotFoundPage.vue'
import { mountPage } from './testing'

describe('NotFoundPage', () => {
  it('explains the dead link and offers a way home', async () => {
    const { wrapper } = await mountPage(NotFoundPage, { path: '/nope' })

    expect(wrapper.get('[data-testid="empty-state"]').text()).toContain('Page not found')

    const home = wrapper.get('[data-testid="not-found-home"]')
    expect(home.attributes('href')).toBe('/')
    expect(home.text()).toBe('Back to the dashboard')
  })
})
