import { BlockShape, type ContributionLevel, GraphSize } from '~/enums'

import type { Theme, ThemePreset, Themes } from './types'

export const levels = {
  Null: -1,
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
} satisfies Record<ContributionLevel, -1 | 0 | 1 | 2 | 3 | 4>

export const sizeProperties = {
  [GraphSize.Small]: {
    ['--block-size']: '10px',
    ['--block-round']: '2px',
    ['--block-gap']: '2px',
  },
  [GraphSize.Medium]: {
    ['--block-size']: '11px',
    ['--block-round']: '3px',
    ['--block-gap']: '2.5px',
  },
  [GraphSize.Large]: {
    ['--block-size']: '12px',
    ['--block-round']: '3px',
    ['--block-gap']: '4px',
  },
} as const satisfies Record<
  GraphSize,
  {
    ['--block-size']: string
    ['--block-round']: string
    ['--block-gap']: string
  }
>

export const DEFAULT_SIZE: GraphSize = GraphSize.Small

export const DEFAULT_THEME: Themes = 'Classic'

export const DEFAULT_BLOCK_SHAPE: BlockShape = BlockShape.Square

export const THEMES = [
  {
    name: 'Classic',
    textColor: '#24292f',
    levelColors: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
    background: '#fff',
  },
  {
    name: 'Midnight',
    textColor: '#fafafa',
    levelColors: ['#233133', '#3a5c60', '#589198', '#6ab2ba', '#87e7f2'],
    background: '#091617',
  },
  {
    name: 'Sunset',
    textColor: '#fafafa',
    levelColors: ['#331b1b', '#794b49', '#ab6e69', '#c9837d', '#fba59d'],
    background: '#1d1210',
  },
  {
    name: 'Violet',
    textColor: '#fafafa',
    levelColors: ['#262640', '#505073', '#6d6d98', '#7f7fae', '#9c9cd2'],
    background: '#17151f',
  },
  {
    name: 'PostSpark',
    textColor: 'hsl(0 0% 12%)',
    // Level 0 uses a light muted background; higher levels derive from primary teal
    levelColors: [
      'hsl(60 4.8% 97%)',
      'hsl(180 45% 80%)',
      'hsl(180 45% 60%)',
      'hsl(180 45% 45%)',
      'hsl(180 45% 35%)',
    ],
    background: 'hsl(0 0% 100%)',
  },
] satisfies Theme[]

export const THEME_PRESETS = [
  {
    name: 'Classic',
    mode: 'light',
    colorForeground: '#24292f',
    colorBackground: '#fff',
    colorSecondary: 'rgba(245, 245, 245, 0.38)',
    colorPrimary: 'rgb(56, 56, 56)',
    colorBorder: 'color-mix(in srgb, rgba(218, 218, 218, 0.48), transparent 0%)',
    colorBackgroundContainer:
      'linear-gradient(140deg, rgb(241 245 249 / 0.8) 0%, rgb(241 245 249 / 0.5) 100%)',
    levelColors: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
  },
  {
    name: 'Midnight',
    mode: 'dark',
    colorForeground: 'rgba(255, 255, 255, 0.98)',
    colorBackground: 'rgba(0, 0, 0, 0.76)',
    colorSecondary: 'rgba(115, 115, 115, 0.15)',
    colorPrimary: 'rgba(135, 231, 242, 1)',
    colorBorder: 'rgba(105, 105, 105, 0.5)',
    colorBackgroundContainer: 'linear-gradient(140deg, rgb(76, 200, 200) 0%, rgb(32, 32, 51) 100%)',
    levelColors: [
      'var(--theme-secondary)',
      'color-mix(in srgb, var(--theme-primary) 35%, var(--theme-secondary))',
      'color-mix(in srgb, var(--theme-primary) 60%, var(--theme-secondary))',
      'color-mix(in srgb, var(--theme-primary) 75%, var(--theme-secondary))',
      'var(--theme-primary)',
    ],
  },
  {
    name: 'Sunset',
    mode: 'dark',
    colorForeground: '#fff',
    colorBackground: 'rgba(16, 4, 4, 0.84)',
    colorSecondary: 'rgba(60, 32, 32, 0.85)',
    colorPrimary: 'rgba(251, 165, 157, 1)',
    colorBorder: 'color-mix(in srgb, rgba(176, 172, 172, 0.36), transparent 0%)',
    colorBackgroundContainer: 'url(/images/background/sunset.webp) no-repeat center center / cover',
    levelColors: [
      'var(--theme-secondary)',
      'color-mix(in srgb, var(--theme-primary) 35%, var(--theme-secondary))',
      'color-mix(in srgb, var(--theme-primary) 60%, var(--theme-secondary))',
      'color-mix(in srgb, var(--theme-primary) 75%, var(--theme-secondary))',
      'var(--theme-primary)',
    ],
  },
  {
    name: 'Violet',
    mode: 'dark',
    colorForeground: 'rgb(235, 234, 234)',
    colorBackground: 'rgba(21, 21, 39, 0.92)',
    colorSecondary: 'rgba(48, 48, 80, 0.8)',
    colorPrimary: 'rgba(156, 156, 210, 1)',
    colorBorder: 'color-mix(in srgb, rgba(97, 97, 121, 0.55), transparent 0%)',
    colorBackgroundContainer: 'url(/images/background/lead.webp) no-repeat center center / cover',
    levelColors: [
      'var(--theme-secondary)',
      'color-mix(in srgb, var(--theme-primary) 35%, var(--theme-secondary))',
      'color-mix(in srgb, var(--theme-primary) 60%, var(--theme-secondary))',
      'color-mix(in srgb, var(--theme-primary) 75%, var(--theme-secondary))',
      'var(--theme-primary)',
    ],
  },
  {
    name: 'PostSpark',
    mode: 'light',
    colorForeground: 'hsl(0 0% 12%)',
    colorBackground: 'hsl(0 0% 100%)',
    colorSecondary: 'hsl(60 4.8% 97%)',
    colorPrimary: 'hsl(180 45% 45%)',
    colorBorder: 'hsl(20 5.9% 93%)',
    colorBackgroundContainer: 'linear-gradient(140deg, hsl(60 4.8% 97%) 0%, hsl(60 4.8% 92%) 100%)',
    levelColors: [
      'var(--theme-secondary)',
      'color-mix(in srgb, var(--theme-primary) 35%, var(--theme-secondary))',
      'color-mix(in srgb, var(--theme-primary) 60%, var(--theme-secondary))',
      'color-mix(in srgb, var(--theme-primary) 75%, var(--theme-secondary))',
      'var(--theme-primary)',
    ],
  },
] satisfies ThemePreset[]
