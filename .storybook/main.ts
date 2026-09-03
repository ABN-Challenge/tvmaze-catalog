import { defineMain } from '@storybook/vue3-vite/node'
import { fileURLToPath, URL } from 'node:url'
import type { Alias, AliasOptions } from 'vite'
import { uiExposes } from '../uiAliases'

const catalogSrc = fileURLToPath(new URL('../src', import.meta.url))

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
