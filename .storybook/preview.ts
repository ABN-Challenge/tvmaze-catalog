import { definePreview } from '@storybook/vue3-vite'
import addonA11y from '@storybook/addon-a11y'
import addonDocs from '@storybook/addon-docs'
import addonVitest from '@storybook/addon-vitest'
import { sb } from 'storybook/test'
import 'tvmaze_ui/styles'

sb.mock(import('../src/domain/api.ts'), { spy: true })

export default definePreview({
  addons: [addonDocs(), addonA11y(), addonVitest()],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'abn',
      values: [
        { name: 'abn', value: '#f3f7f6' },
        { name: 'white', value: '#ffffff' },
        { name: 'header', value: '#004d41' },
      ],
    },
    docs: {
      toc: true,
    },
    a11y: {
      // Fail Vitest on axe violations, except brand ABN yellow/muted tokens
      // that intentionally sit near/under WCAG contrast thresholds.
      test: 'error',
      config: {
        rules: [{ id: 'color-contrast', enabled: false }],
      },
    },
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: { width: '375px', height: '667px' },
          type: 'mobile',
        },
        tablet: {
          name: 'Tablet',
          styles: { width: '768px', height: '1024px' },
          type: 'tablet',
        },
        desktop: {
          name: 'Desktop',
          styles: { width: '1280px', height: '800px' },
          type: 'desktop',
        },
      },
    },
  },
  tags: ['autodocs', 'test'],
})
