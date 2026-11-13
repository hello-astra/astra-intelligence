import type { ComponentType } from 'react'
import type { DemoId } from '@/types/content'

type DemoModule = Promise<{ default: ComponentType }>

/**
 * Dynamic imports for the nine demos. Only these function references live in the
 * main bundle; each demo (and its chart library) downloads when first called — by
 * React.lazy in the registry, or earlier by route prefetching.
 */
export const DEMO_LOADERS: Record<DemoId, () => DemoModule> = {
  saas: () => import('./saas/SaasDemo'),
  ecommerce: () => import('./ecommerce/EcommerceDemo'),
  analytics: () => import('./analytics/AnalyticsDemo'),
  chatbot: () => import('./chatbot/ChatbotDemo'),
  predictive: () => import('./predictive/PredictiveDemo'),
  collaboration: () => import('./collaboration/CollaborationDemo'),
  fintech: () => import('./fintech/FintechDemo'),
  erp: () => import('./erp/ErpDemo'),
  ocr: () => import('./ocr/OcrDemo'),
}
