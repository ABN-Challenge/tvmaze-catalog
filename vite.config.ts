/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { federation } from '@module-federation/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isProd = mode === 'production'
  const isTest = Boolean(process.env.VITEST)
  const isStorybook =
    Boolean(process.env.STORYBOOK) || process.argv.some((arg) => arg.includes('storybook'))
  const disableFederation = isTest || isStorybook
  const base = isProd && !isStorybook ? '/tvmaze-catalog/' : '/'
  const uiRemote =
    env.VITE_UI_REMOTE_URL ||
    (isProd
      ? 'https://abn-challenge.github.io/tvmaze-ui/remoteEntry.js'
      : 'http://localhost:5001/remoteEntry.js')

  return {
    base,
    plugins: [
      vue(),
      tailwindcss(),
      !disableFederation &&
        federation({
          name: 'tvmaze_catalog',
          filename: 'remoteEntry.js',
          remotes: {
            tvmaze_ui: {
              type: 'module',
              name: 'tvmaze_ui',
              entry: uiRemote,
              entryGlobalName: 'tvmaze_ui',
              shareScope: 'default',
            },
          },
          exposes: {
            './DashboardPage': './src/pages/DashboardPage.vue',
            './SearchPage': './src/pages/SearchPage.vue',
            './ShowDetailsPage': './src/pages/ShowDetailsPage.vue',
            './styles': './src/load-styles.ts',
          },
          shared: {
            vue: { singleton: true, requiredVersion: '3.5.13' },
            'vue-router': { singleton: true, requiredVersion: '4.5.0' },
            pinia: { singleton: true, requiredVersion: '2.3.1' },
          },
        }),
    ].filter(Boolean),
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5002,
      strictPort: true,
      origin: 'http://localhost:5002',
      cors: true,
    },
    preview: {
      port: 5002,
      strictPort: true,
      cors: true,
    },
    build: {
      target: 'esnext',
      cssCodeSplit: false,
      modulePreload: false,
    },
    optimizeDeps: {
      esbuildOptions: {
        target: 'esnext',
      },
    },
    esbuild: {
      target: 'esnext',
    },
    test: {
      environment: 'jsdom',
      globals: true,
    },
  }
})
