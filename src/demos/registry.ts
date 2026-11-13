import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import type { DemoId } from '@/types/content'
import { DEMO_LOADERS } from './loaders'

/**
 * Each demo is an independent, lazily-loaded application. Adding a demo means
 * adding a loader in ./loaders.ts, a theme preset in src/theme/demo-presets.ts and
 * a solution entry in data/constants/solutions.ts.
 */
export const DEMO_COMPONENTS = Object.fromEntries(
  Object.entries(DEMO_LOADERS).map(([id, load]) => [id, lazy(load)]),
) as Record<DemoId, LazyExoticComponent<ComponentType>>

/** Demo storage keys all start with this prefix + the demo id. */
export const demoStoragePrefix = (demoId: DemoId) => `astra:demo:${demoId}`
