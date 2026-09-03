import { addons } from 'storybook/manager-api'
import { create } from 'storybook/theming'

addons.setConfig({
  theme: create({
    base: 'light',
    brandTitle: 'tvmaze-catalog · API',
    brandUrl: './',
    brandTarget: '_self',
    colorPrimary: '#004d41',
    colorSecondary: '#009286',
    appBg: '#f3f7f6',
    appContentBg: '#ffffff',
    appBorderColor: '#c5d5d1',
    appBorderRadius: 8,
    textColor: '#0f1f1c',
    textMutedColor: '#5a716c',
    barTextColor: '#0f1f1c',
    barSelectedColor: '#004d41',
    barBg: '#ffffff',
    inputBg: '#ffffff',
    inputBorder: '#c5d5d1',
    inputTextColor: '#0f1f1c',
    inputBorderRadius: 8,
  }),
})
