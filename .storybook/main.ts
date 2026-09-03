import { defineMain } from '@storybook/vue3-vite/node'
import { fileURLToPath, URL } from 'node:url'
import path from 'node:path'
import type { Alias, AliasOptions } from 'vite'

const uiSrc = fileURLToPath(new URL('../../tvmaze-ui/src', import.meta.url))
const catalogSrc = fileURLToPath(new URL('../src', import.meta.url))

const uiExposes: Record<string, string> = {
  'tvmaze_ui/theme': path.join(uiSrc, 'theme.ts'),
  'tvmaze_ui/styles': path.join(uiSrc, 'style.css'),
  'tvmaze_ui/SkipLink': path.join(uiSrc, 'components/atoms/SkipLink.vue'),
  'tvmaze_ui/Button': path.join(uiSrc, 'components/atoms/Button.vue'),
  'tvmaze_ui/RatingBadge': path.join(uiSrc, 'components/atoms/RatingBadge.vue'),
  'tvmaze_ui/LoadingState': path.join(uiSrc, 'components/atoms/LoadingState.vue'),
  'tvmaze_ui/SearchInput': path.join(uiSrc, 'components/molecules/SearchInput.vue'),
  'tvmaze_ui/ResponsiveSearch': path.join(uiSrc, 'components/molecules/ResponsiveSearch.vue'),
  'tvmaze_ui/ShowCard': path.join(uiSrc, 'components/molecules/ShowCard.vue'),
  'tvmaze_ui/ShowCardGrid': path.join(uiSrc, 'components/molecules/ShowCardGrid.vue'),
  'tvmaze_ui/EmptyState': path.join(uiSrc, 'components/molecules/EmptyState.vue'),
  'tvmaze_ui/ErrorBanner': path.join(uiSrc, 'components/molecules/ErrorBanner.vue'),
  'tvmaze_ui/SkeletonRow': path.join(uiSrc, 'components/molecules/SkeletonRow.vue'),
  'tvmaze_ui/AppHeader': path.join(uiSrc, 'components/organisms/AppHeader.vue'),
  'tvmaze_ui/AppFooter': path.join(uiSrc, 'components/organisms/AppFooter.vue'),
  'tvmaze_ui/AppShell': path.join(uiSrc, 'components/organisms/AppShell.vue'),
  'tvmaze_ui/PageContainer': path.join(uiSrc, 'components/organisms/PageContainer.vue'),
  'tvmaze_ui/GenreRow': path.join(uiSrc, 'components/organisms/GenreRow.vue'),
  'tvmaze_ui/ShowHero': path.join(uiSrc, 'components/organisms/ShowHero.vue'),
}

function toAliasList(alias: AliasOptions | undefined): Alias[] {
  if (!alias) return []
  if (Array.isArray(alias)) return [...alias]
  return Object.entries(alias).map(([find, replacement]) => ({
    find,
    replacement: replacement as string,
  }))
}

export default defineMain({
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y', '@storybook/addon-vitest'],
  framework: {
    name: '@storybook/vue3-vite',
    options: {},
  },
  features: {
    experimentalTestSyntax: true,
    componentsManifest: true,
    experimentalComponentsManifest: true,
    experimentalDocgenServer: true,
  },
  tags: {
    live: { defaultFilterSelection: 'exclude' },
  },
  async viteFinal(config, { configType }) {
    config.plugins = config.plugins?.flat().filter((plugin) => {
      if (!plugin || typeof plugin !== 'object' || !('name' in plugin)) return true
      const name = String(plugin.name)
      return !/federation|module-federation|proxyRemoteEntry|^mf/i.test(name)
    })

    config.resolve ??= {}
    const uiAliases: Alias[] = Object.entries(uiExposes).map(([find, replacement]) => ({
      find,
      replacement,
    }))
    config.resolve.alias = [
      ...toAliasList(config.resolve.alias),
      ...uiAliases,
      { find: '@', replacement: catalogSrc },
    ]

    if (configType === 'PRODUCTION') {
      config.base = '/tvmaze-catalog/'
    }

    config.optimizeDeps = {
      ...config.optimizeDeps,
      esbuildOptions: {
        ...(config.optimizeDeps?.esbuildOptions ?? {}),
        target: 'esnext',
      },
    }
    config.esbuild = {
      ...(typeof config.esbuild === 'object' ? config.esbuild : {}),
      target: 'esnext',
    }

    return config
  },
})
