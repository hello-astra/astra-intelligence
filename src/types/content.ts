import type { LucideIcon } from 'lucide-react'

/** The nine solution areas — slugs are shared by /solutions/:slug and /lab/:slug. */
export type SolutionSlug =
  | 'saas-development'
  | 'ecommerce-inventory'
  | 'business-dashboards'
  | 'ai-chatbots'
  | 'predictive-analytics'
  | 'collaborative-workspace'
  | 'fintech-automation'
  | 'erp-automation'
  | 'document-intelligence'

/** Internal identifiers of the nine demo applications. */
export type DemoId =
  | 'saas'
  | 'ecommerce'
  | 'analytics'
  | 'chatbot'
  | 'predictive'
  | 'collaboration'
  | 'fintech'
  | 'erp'
  | 'ocr'

export type IndustryId =
  | 'banking'
  | 'healthcare'
  | 'retail'
  | 'education'
  | 'manufacturing'
  | 'logistics'
  | 'real-estate'
  | 'professional-services'
  | 'startups'

export type TechId =
  | 'react'
  | 'nextjs'
  | 'typescript'
  | 'javascript'
  | 'tailwind'
  | 'nodejs'
  | 'express'
  | 'python'
  | 'fastapi'
  | 'django'
  | 'mongodb'
  | 'postgresql'
  | 'mysql'
  | 'redis'
  | 'openai'
  | 'llm'
  | 'ml'
  | 'predictive'
  | 'dataviz'
  | 'ocr'
  | 'docker'
  | 'aws'
  | 'vercel'
  | 'git'
  | 'cicd'
  | 'kafka'
  | 'n8n'
  | 'rest'

export type TechCategory = 'frontend' | 'backend' | 'database' | 'ai-data' | 'infrastructure'

export interface Capability {
  title: string
  description: string
  icon: LucideIcon
}

export interface UseCase {
  industry: IndustryId
  title: string
  description: string
}

/** Identity of a solution — everything navigation, previews and the hero need. */
export interface SolutionSummary {
  slug: SolutionSlug
  demoId: DemoId
  number: string
  name: string
  shortName: string
  tagline: string
  icon: LucideIcon
  /** Vivid primary (icons, glows) — derived from the product's default theme. */
  accent: string
  /** Secondary identity colour. */
  accent2: string
  /** Primary tint for text on dark surfaces. */
  accentSoft: string
  /** Primary shade for text/icons on light surfaces. */
  accentInk: string
  demo: {
    productName: string
    category: string
  }
}

export interface Solution extends SolutionSummary {
  description: string
  whatItIs: string
  whyItMatters: string[]
  capabilities: Capability[]
  problemsSolved: string[]
  technologies: TechId[]
  useCases: UseCase[]
  deliverables: string[]
  demo: SolutionSummary['demo'] & {
    summary: string
    tryThis: string[]
    simulated: string[]
  }
}

export interface Industry {
  id: IndustryId
  name: string
  shortName: string
  icon: LucideIcon
  summary: string
  challenges: string[]
  solutions: string[]
  services: SolutionSlug[]
}

export interface TechItem {
  id: TechId
  name: string
  category: TechCategory
  description: string
}

export interface ApproachStep {
  number: string
  title: string
  description: string
  outputs: string[]
  icon: LucideIcon
}

export interface CompanyValue {
  title: string
  description: string
  icon: LucideIcon
}
