import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import type { DemoId } from '@/types/content'

/**
 * Each demo is an independent, lazily-loaded application. Adding a demo means
 * adding an entry here and a solution entry in data/constants/solutions.ts.
 */
export const DEMO_COMPONENTS: Record<DemoId, LazyExoticComponent<ComponentType>> = {
  saas: lazy(() => import('./saas/SaasDemo')),
  ecommerce: lazy(() => import('./ecommerce/EcommerceDemo')),
  analytics: lazy(() => import('./analytics/AnalyticsDemo')),
  chatbot: lazy(() => import('./chatbot/ChatbotDemo')),
  predictive: lazy(() => import('./predictive/PredictiveDemo')),
  collaboration: lazy(() => import('./collaboration/CollaborationDemo')),
  fintech: lazy(() => import('./fintech/FintechDemo')),
  erp: lazy(() => import('./erp/ErpDemo')),
  ocr: lazy(() => import('./ocr/OcrDemo')),
}

/** Demo storage keys all start with this prefix + the demo id. */
export const demoStoragePrefix = (demoId: DemoId) => `astra:demo:${demoId}`
