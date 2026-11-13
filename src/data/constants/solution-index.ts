import { Bot, BrainCircuit, Layers, LayoutDashboard, Network, ScanText, ShoppingCart, SquareKanban, Wallet } from 'lucide-react'
import { solutionAccents } from '@/theme/accents'
import type { SolutionSlug, SolutionSummary } from '@/types/content'

/**
 * Lightweight index of the nine solutions — names, taglines, icons, colours.
 *
 * This is all the navigation, hero, footer and previews need, so it is the only
 * solution data in the initial bundle. Long-form page content lives in
 * ./solutions.ts and loads with the pages that show it.
 */
const INDEX = [
  {
    slug: 'saas-development',
    demoId: 'saas',
    number: '01',
    name: 'Custom SaaS Development',
    shortName: 'SaaS Development',
    tagline: 'Multi-tenant platforms engineered to grow with your customers.',
    icon: Layers,
    demo: { productName: 'Astra Console', category: 'SaaS administration' },
  },
  {
    slug: 'ecommerce-inventory',
    demoId: 'ecommerce',
    number: '02',
    name: 'E-commerce & Inventory Management',
    shortName: 'E-commerce & Inventory',
    tagline: 'Storefronts and back-office systems that stay in sync.',
    icon: ShoppingCart,
    demo: { productName: 'Astra Commerce', category: 'Commerce operations' },
  },
  {
    slug: 'business-dashboards',
    demoId: 'analytics',
    number: '03',
    name: 'Smart Business Dashboards',
    shortName: 'Business Dashboards',
    tagline: 'Decision-ready analytics across every part of your business.',
    icon: LayoutDashboard,
    demo: { productName: 'Astra Insights', category: 'Business intelligence' },
  },
  {
    slug: 'ai-chatbots',
    demoId: 'chatbot',
    number: '04',
    name: 'AI Chatbots & Customer Agents',
    shortName: 'AI Chatbots & Agents',
    tagline: 'Conversational agents that resolve, qualify and escalate.',
    icon: Bot,
    demo: { productName: 'Astra Assist', category: 'Customer support AI' },
  },
  {
    slug: 'predictive-analytics',
    demoId: 'predictive',
    number: '05',
    name: 'AI-Powered Predictive Analytics',
    shortName: 'Predictive Analytics',
    tagline: 'Forecasts and early warnings grounded in your history.',
    icon: BrainCircuit,
    demo: { productName: 'Astra Foresight', category: 'Forecasting & insights' },
  },
  {
    slug: 'collaborative-workspace',
    demoId: 'collaboration',
    number: '06',
    name: 'Collaborative Workspace Solutions',
    shortName: 'Collaborative Workspaces',
    tagline: 'Shared workspaces that keep teams, tasks and documents aligned.',
    icon: SquareKanban,
    demo: { productName: 'Astra Workspace', category: 'Project collaboration' },
  },
  {
    slug: 'fintech-automation',
    demoId: 'fintech',
    number: '07',
    name: 'FinTech & Expense Automation',
    shortName: 'FinTech & Expenses',
    tagline: 'Automated money workflows with complete visibility.',
    icon: Wallet,
    demo: { productName: 'Astra Ledger', category: 'Finance automation' },
  },
  {
    slug: 'erp-automation',
    demoId: 'erp',
    number: '08',
    name: 'ERP & Enterprise Automation',
    shortName: 'ERP & Automation',
    tagline: 'One operational backbone for people, purchasing and supply chain.',
    icon: Network,
    demo: { productName: 'Astra ERP', category: 'Enterprise operations' },
  },
  {
    slug: 'document-intelligence',
    demoId: 'ocr',
    number: '09',
    name: 'OCR & Document Intelligence',
    shortName: 'Document Intelligence',
    tagline: 'Turn documents into structured, validated data.',
    icon: ScanText,
    demo: { productName: 'Astra DocIQ', category: 'Document processing' },
  },
] as const satisfies readonly Omit<SolutionSummary, 'accent' | 'accent2' | 'accentSoft' | 'accentInk'>[]

/** Colours come from each product's default theme preset (src/theme/demo-presets.ts). */
export const SOLUTION_INDEX: SolutionSummary[] = INDEX.map((s) => ({ ...s, demo: { ...s.demo }, ...solutionAccents(s.demoId) }))

export const SUMMARY_BY_SLUG = Object.fromEntries(SOLUTION_INDEX.map((s) => [s.slug, s])) as Record<SolutionSlug, SolutionSummary>

export function isSolutionSlug(value: string | null | undefined): value is SolutionSlug {
  return SOLUTION_INDEX.some((s) => s.slug === value)
}
