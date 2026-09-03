import { defineWorkspace } from 'vitest/config'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineWorkspace([
  {
    extends: './vite.config.ts',
    test: {
      name: 'unit',
      environment: 'jsdom',
      globals: true,
      include: ['src/**/*.{test,spec}.{js,ts}'],
    },
  },
  {
    extends: './vite.config.ts',
    plugins: [
      storybookTest({
        configDir: path.join(dirname, '.storybook'),
        storybookScript: 'npm run storybook -- --no-open',
        tags: {
          include: ['test'],
          exclude: ['live'],
        },
      }),
    ],
    test: {
      name: 'storybook',
      setupFiles: ['./.storybook/vitest.setup.ts'],
      browser: {
        enabled: true,
        provider: 'playwright',
        headless: true,
        instances: [{ browser: 'chromium' }],
      },
    },
  },
])
