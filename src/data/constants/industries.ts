import { Briefcase, Building2, Factory, GraduationCap, HeartPulse, Landmark, Rocket, ShoppingBag, Truck } from 'lucide-react'
import type { Industry, IndustryId } from '@/types/content'

export const INDUSTRIES: Industry[] = [
  {
    id: 'banking',
    name: 'Banking & Financial Services',
    shortName: 'Banking',
    icon: Landmark,
    summary: 'Secure automation for high-volume, compliance-heavy financial operations.',
    challenges: [
      'High volumes of customer queries across branches, apps and phone',
      'Manual KYC and loan document verification',
      'Fragmented views of portfolio, collections and risk',
    ],
    solutions: [
      'AI agents that answer account FAQs and route service requests',
      'OCR pipelines for KYC and loan documents',
      'Real-time dashboards and forecasts for collections and liquidity',
    ],
    services: ['ai-chatbots', 'document-intelligence', 'business-dashboards', 'predictive-analytics', 'fintech-automation'],
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    shortName: 'Healthcare',
    icon: HeartPulse,
    summary: 'Less paperwork and better operational visibility for care providers.',
    challenges: [
      'Paper-heavy patient intake and insurance claims',
      'Complex staff scheduling, attendance and payroll',
      'Limited visibility into patient flow and utilization',
    ],
    solutions: [
      'Digitized intake and claims with document extraction',
      'HR, rostering and payroll modules',
      'Operational dashboards for departments and facilities',
    ],
    services: ['document-intelligence', 'erp-automation', 'business-dashboards', 'ai-chatbots', 'saas-development'],
  },
  {
    id: 'retail',
    name: 'Retail & E-commerce',
    shortName: 'Retail',
    icon: ShoppingBag,
    summary: 'Connected commerce, from storefront to stockroom.',
    challenges: [
      'Overselling and stock-outs across sales channels',
      'Repetitive order-status and return queries',
      'Seasonal demand that is hard to plan for',
    ],
    solutions: [
      'Inventory-synced storefronts and order workflows',
      'Support agents for order tracking and returns',
      'Demand forecasting for replenishment',
    ],
    services: ['ecommerce-inventory', 'ai-chatbots', 'predictive-analytics', 'business-dashboards'],
  },
  {
    id: 'education',
    name: 'Education & EdTech',
    shortName: 'Education',
    icon: GraduationCap,
    summary: 'Platforms and automation for institutions and learning businesses.',
    challenges: [
      'Admission enquiries that peak in short windows',
      'Disconnected tools for courses, staff and fees',
      'Little insight into learner engagement',
    ],
    solutions: [
      'Admissions assistants with lead qualification',
      'Multi-campus SaaS platforms and staff workspaces',
      'Engagement and performance dashboards',
    ],
    services: ['ai-chatbots', 'saas-development', 'business-dashboards', 'collaborative-workspace', 'erp-automation'],
  },
  {
    id: 'manufacturing',
    name: 'Manufacturing',
    shortName: 'Manufacturing',
    icon: Factory,
    summary: 'Integrated planning across procurement, production and suppliers.',
    challenges: [
      'Procurement and vendor coordination over email',
      'Production planned without reliable demand signals',
      'Shop-floor data that never reaches management',
    ],
    solutions: [
      'Procurement, vendor and supply chain ERP modules',
      'Order and demand forecasting',
      'Production and downtime dashboards',
    ],
    services: ['erp-automation', 'predictive-analytics', 'business-dashboards', 'ecommerce-inventory'],
  },
  {
    id: 'logistics',
    name: 'Logistics & Supply Chain',
    shortName: 'Logistics',
    icon: Truck,
    summary: 'Real-time visibility and less paperwork across the supply chain.',
    challenges: [
      'Limited real-time visibility of shipments',
      'Paper delivery notes and proofs of delivery',
      'Capacity planning without volume forecasts',
    ],
    solutions: [
      'Shipment tracking with status workflows and alerts',
      'Document capture for delivery paperwork',
      'Volume forecasting for fleet and warehouse capacity',
    ],
    services: ['erp-automation', 'document-intelligence', 'predictive-analytics', 'business-dashboards'],
  },
  {
    id: 'real-estate',
    name: 'Real Estate',
    shortName: 'Real Estate',
    icon: Building2,
    summary: 'From first enquiry to project handover and property accounts.',
    challenges: [
      'Enquiries arriving through portals, calls and messaging apps',
      'Project handovers tracked in spreadsheets',
      'Property income and expenses scattered across files',
    ],
    solutions: [
      'Enquiry agents that qualify buyers and book site visits',
      'Collaborative workspaces for project delivery',
      'Property-level financial ledgers and reports',
    ],
    services: ['ai-chatbots', 'collaborative-workspace', 'fintech-automation', 'business-dashboards'],
  },
  {
    id: 'professional-services',
    name: 'Professional Services',
    shortName: 'Prof. Services',
    icon: Briefcase,
    summary: 'Client delivery, documents and finances in one place.',
    challenges: [
      'Client work tracked across email and chat',
      'Time-consuming expense and invoice processing',
      'Client reports assembled manually',
    ],
    solutions: [
      'Client portals and engagement workspaces',
      'Receipt and invoice automation',
      'Automated, client-ready dashboards',
    ],
    services: ['collaborative-workspace', 'document-intelligence', 'saas-development', 'business-dashboards', 'fintech-automation'],
  },
  {
    id: 'startups',
    name: 'Startups & SMEs',
    shortName: 'Startups',
    icon: Rocket,
    summary: 'Production-grade engineering without building a large in-house team.',
    challenges: [
      'Limited engineering capacity for the core product',
      'Finance and operations handled manually',
      'The need to validate ideas quickly',
    ],
    solutions: [
      'MVP-to-scale SaaS product engineering',
      'Expense automation and lightweight ERP',
      'Prototype-first delivery on solid foundations',
    ],
    services: ['saas-development', 'fintech-automation', 'ecommerce-inventory', 'ai-chatbots', 'collaborative-workspace'],
  },
]

export const INDUSTRY_BY_ID: Record<IndustryId, Industry> = Object.fromEntries(
  INDUSTRIES.map((i) => [i.id, i]),
) as Record<IndustryId, Industry>
