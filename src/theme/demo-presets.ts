import type { DemoId } from '@/types/content'

/**
 * Theme presets for the nine product demos — pure data, no colour maths.
 *
 * Every product offers four templates:
 * - "Astra Classic" (the default): the Astra Intelligence website theme, shared by all
 *   demos — it uses the site's own design tokens, so a demo looks exactly like the site.
 * - Three product templates: a signature identity (listed first) plus two alternatives.
 *   A product preset only names the brand colours, the neutral "temperature" of its
 *   surfaces and two structural choices; src/theme/demo-theme-engine.ts derives complete,
 *   contrast-checked light and dark palettes (surfaces, text, chart series, status) from it.
 */

/** How the app chrome (top bar + sidebar) relates to the content area. */
export type ChromeStyle =
  /** Chrome carries a faint wash of the primary colour. */
  | 'tinted'
  /** Chrome matches the content background — quiet, document-like. */
  | 'flat'
  /** A deep sidebar against the content, in light mode too (classic enterprise layout). */
  | 'contrast'

/** Corner radius family for panels, inputs and buttons. */
export type RadiusStyle = 'sharp' | 'default' | 'round'

export interface DemoThemePreset {
  id: string
  name: string
  description: string
  /** Primary brand colour: actions, active navigation, first chart series. */
  primary: string
  /** Secondary identity colour: highlights, secondary accents, badges. */
  secondary: string
  /** Hue (degrees) and chroma (OKLCH) of the neutral surfaces. 0 chroma = pure grey. */
  neutral: { hue: number; chroma: number }
  /** Leading chart series after the primary; remaining slots are filled with distinct hues. */
  chart: string[]
  chrome: ChromeStyle
  radius: RadiusStyle
  /** Use the website's design tokens as-is instead of a generated palette. */
  site?: boolean
}

/** The Astra Intelligence website theme, available (and the default) in every demo. */
export const SITE_PRESET: DemoThemePreset = {
  id: 'astra-classic',
  name: 'Astra Classic',
  description: 'The Astra Intelligence website theme',
  primary: '#4F86FF',
  secondary: '#8B74FF',
  neutral: { hue: 265, chroma: 0.035 },
  chart: [],
  chrome: 'tinted',
  radius: 'default',
  site: true,
}

/** Product-specific templates; the first of each list is the product's signature identity. */
const PRODUCT_PRESETS: Record<DemoId, readonly DemoThemePreset[]> = {
  saas: [
    {
      id: 'midnight-indigo',
      name: 'Midnight Indigo',
      description: 'Enterprise admin console on deep navy',
      primary: '#6366F1',
      secondary: '#818CF8',
      neutral: { hue: 272, chroma: 0.038 },
      chart: ['#F59E0B', '#22D3EE'],
      chrome: 'tinted',
      radius: 'default',
    },
    {
      id: 'graphite',
      name: 'Graphite',
      description: 'Neutral charcoal with indigo actions',
      primary: '#6366F1',
      secondary: '#A5B4FC',
      neutral: { hue: 265, chroma: 0.006 },
      chart: ['#14B8A6', '#F59E0B'],
      chrome: 'flat',
      radius: 'sharp',
    },
    {
      id: 'electric',
      name: 'Electric',
      description: 'Indigo and cyan with a contrast sidebar',
      primary: '#4F46E5',
      secondary: '#22D3EE',
      neutral: { hue: 255, chroma: 0.03 },
      chart: ['#22D3EE', '#F472B6'],
      chrome: 'contrast',
      radius: 'round',
    },
  ],
  ecommerce: [
    {
      id: 'emerald',
      name: 'Emerald',
      description: 'Fresh green commerce on deep charcoal',
      primary: '#10B981',
      secondary: '#34D399',
      neutral: { hue: 165, chroma: 0.008 },
      chart: ['#6366F1', '#F59E0B'],
      chrome: 'flat',
      radius: 'round',
    },
    {
      id: 'fresh-mint',
      name: 'Fresh Mint',
      description: 'Green and lime with a tinted chrome',
      primary: '#059669',
      secondary: '#A3E635',
      neutral: { hue: 155, chroma: 0.022 },
      chart: ['#F59E0B', '#0EA5E9'],
      chrome: 'tinted',
      radius: 'round',
    },
    {
      id: 'boutique',
      name: 'Boutique',
      description: 'Warm neutrals with emerald and blush',
      primary: '#10B981',
      secondary: '#F472B6',
      neutral: { hue: 40, chroma: 0.01 },
      chart: ['#F472B6', '#6366F1'],
      chrome: 'contrast',
      radius: 'default',
    },
  ],
  analytics: [
    {
      id: 'royal-insight',
      name: 'Royal Insight',
      description: 'Royal blue and cyan on navy slate',
      primary: '#2563EB',
      secondary: '#06B6D4',
      neutral: { hue: 256, chroma: 0.035 },
      chart: ['#06B6D4', '#F59E0B'],
      chrome: 'tinted',
      radius: 'default',
    },
    {
      id: 'arctic-slate',
      name: 'Arctic Slate',
      description: 'Cool neutral slate, crisp corners',
      primary: '#3B82F6',
      secondary: '#22D3EE',
      neutral: { hue: 230, chroma: 0.012 },
      chart: ['#F97316', '#22D3EE'],
      chrome: 'flat',
      radius: 'sharp',
    },
    {
      id: 'executive',
      name: 'Executive',
      description: 'Deep blue with gold highlights',
      primary: '#1D4ED8',
      secondary: '#F59E0B',
      neutral: { hue: 262, chroma: 0.022 },
      chart: ['#F59E0B', '#06B6D4'],
      chrome: 'contrast',
      radius: 'default',
    },
  ],
  chatbot: [
    {
      id: 'violet-pulse',
      name: 'Violet Pulse',
      description: 'Futuristic violet on deep purple',
      primary: '#8B5CF6',
      secondary: '#C084FC',
      neutral: { hue: 295, chroma: 0.045 },
      chart: ['#2DD4BF', '#F472B6'],
      chrome: 'tinted',
      radius: 'round',
    },
    {
      id: 'orchid',
      name: 'Orchid',
      description: 'Purple and pink, soft and conversational',
      primary: '#A855F7',
      secondary: '#F472B6',
      neutral: { hue: 320, chroma: 0.028 },
      chart: ['#F472B6', '#38BDF8'],
      chrome: 'flat',
      radius: 'round',
    },
    {
      id: 'midnight-neon',
      name: 'Midnight Neon',
      description: 'Violet and cyan on a dark neutral',
      primary: '#8B5CF6',
      secondary: '#22D3EE',
      neutral: { hue: 280, chroma: 0.006 },
      chart: ['#22D3EE', '#F59E0B'],
      chrome: 'contrast',
      radius: 'default',
    },
  ],
  predictive: [
    {
      id: 'deep-teal',
      name: 'Deep Teal',
      description: 'Teal and turquoise on dark teal slate',
      primary: '#0D9488',
      secondary: '#2DD4BF',
      neutral: { hue: 200, chroma: 0.03 },
      chart: ['#F59E0B', '#A78BFA'],
      chrome: 'tinted',
      radius: 'default',
    },
    {
      id: 'lagoon',
      name: 'Lagoon',
      description: 'Turquoise and sky blue, airy',
      primary: '#14B8A6',
      secondary: '#38BDF8',
      neutral: { hue: 215, chroma: 0.018 },
      chart: ['#A78BFA', '#F59E0B'],
      chrome: 'flat',
      radius: 'round',
    },
    {
      id: 'signal',
      name: 'Signal',
      description: 'Teal with amber signal colour',
      primary: '#0F766E',
      secondary: '#F59E0B',
      neutral: { hue: 190, chroma: 0.008 },
      chart: ['#F59E0B', '#6366F1'],
      chrome: 'contrast',
      radius: 'sharp',
    },
  ],
  collaboration: [
    {
      id: 'amber-studio',
      name: 'Amber Studio',
      description: 'Warm amber on warm charcoal',
      primary: '#F59E0B',
      secondary: '#FBBF24',
      neutral: { hue: 60, chroma: 0.01 },
      chart: ['#6366F1', '#14B8A6'],
      chrome: 'tinted',
      radius: 'round',
    },
    {
      id: 'terracotta',
      name: 'Terracotta',
      description: 'Burnt orange and peach',
      primary: '#EA580C',
      secondary: '#FDBA74',
      neutral: { hue: 40, chroma: 0.016 },
      chart: ['#0EA5E9', '#84CC16'],
      chrome: 'flat',
      radius: 'round',
    },
    {
      id: 'honey-ink',
      name: 'Honey & Ink',
      description: 'Amber actions with an ink sidebar',
      primary: '#F59E0B',
      secondary: '#6366F1',
      neutral: { hue: 265, chroma: 0.024 },
      chart: ['#6366F1', '#14B8A6'],
      chrome: 'contrast',
      radius: 'default',
    },
  ],
  fintech: [
    {
      id: 'blue-mint',
      name: 'Blue Mint',
      description: 'Sky blue and mint on dark navy',
      primary: '#0EA5E9',
      secondary: '#34D399',
      neutral: { hue: 248, chroma: 0.035 },
      chart: ['#FB7185', '#34D399'],
      chrome: 'tinted',
      radius: 'default',
    },
    {
      id: 'sapphire-gold',
      name: 'Sapphire & Gold',
      description: 'Private-banking blue with gold',
      primary: '#1D4ED8',
      secondary: '#EAB308',
      neutral: { hue: 255, chroma: 0.02 },
      chart: ['#F97316', '#10B981'],
      chrome: 'contrast',
      radius: 'sharp',
    },
    {
      id: 'glacier',
      name: 'Glacier',
      description: 'Ice blue and mint on cool grey',
      primary: '#0284C7',
      secondary: '#6EE7B7',
      neutral: { hue: 220, chroma: 0.01 },
      chart: ['#FB7185', '#10B981'],
      chrome: 'flat',
      radius: 'round',
    },
  ],
  erp: [
    {
      id: 'steel-blue',
      name: 'Steel Blue',
      description: 'Steel blue and cyan on slate navy',
      primary: '#0284C7',
      secondary: '#22D3EE',
      neutral: { hue: 236, chroma: 0.03 },
      chart: ['#F59E0B', '#22D3EE'],
      chrome: 'tinted',
      radius: 'sharp',
    },
    {
      id: 'carbon',
      name: 'Carbon',
      description: 'Neutral carbon with steel accents',
      primary: '#0284C7',
      secondary: '#94A3B8',
      neutral: { hue: 240, chroma: 0.005 },
      chart: ['#22D3EE', '#F59E0B'],
      chrome: 'flat',
      radius: 'sharp',
    },
    {
      id: 'industrial',
      name: 'Industrial',
      description: 'Deep blue with safety amber',
      primary: '#0369A1',
      secondary: '#F59E0B',
      neutral: { hue: 225, chroma: 0.02 },
      chart: ['#F59E0B', '#14B8A6'],
      chrome: 'contrast',
      radius: 'default',
    },
  ],
  ocr: [
    {
      id: 'rose',
      name: 'Rose',
      description: 'Rose and coral on neutral charcoal',
      primary: '#F43F5E',
      secondary: '#FB7185',
      neutral: { hue: 15, chroma: 0.008 },
      chart: ['#38BDF8', '#F59E0B'],
      chrome: 'flat',
      radius: 'default',
    },
    {
      id: 'coral-paper',
      name: 'Coral Paper',
      description: 'Coral and peach on warm paper tones',
      primary: '#FB7185',
      secondary: '#FDBA74',
      neutral: { hue: 35, chroma: 0.014 },
      chart: ['#2DD4BF', '#6366F1'],
      chrome: 'tinted',
      radius: 'round',
    },
    {
      id: 'ruby-slate',
      name: 'Ruby Slate',
      description: 'Ruby with sky accents on slate',
      primary: '#E11D48',
      secondary: '#38BDF8',
      neutral: { hue: 250, chroma: 0.02 },
      chart: ['#38BDF8', '#F59E0B'],
      chrome: 'contrast',
      radius: 'sharp',
    },
  ],
}

/** All templates offered in each demo; the first one is the default. */
export const DEMO_THEME_PRESETS = Object.fromEntries(
  Object.entries(PRODUCT_PRESETS).map(([id, presets]) => [id, [SITE_PRESET, ...presets]]),
) as unknown as Record<DemoId, readonly DemoThemePreset[]>

export const DEFAULT_PRESET = (demoId: DemoId): DemoThemePreset => DEMO_THEME_PRESETS[demoId][0]

/**
 * The product's signature template. The marketing site uses its colours to give each
 * solution an identity (navigation icons, previews, hero map) independent of the demo default.
 */
export const SIGNATURE_PRESET = (demoId: DemoId): DemoThemePreset => PRODUCT_PRESETS[demoId][0]
