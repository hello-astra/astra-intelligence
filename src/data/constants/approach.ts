import {
  Code2,
  Compass,
  LifeBuoy,
  Network,
  Palette,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  TestTubeDiagonal,
  TrendingUp,
} from 'lucide-react'
import type { ApproachStep, CompanyValue } from '@/types/content'

export const APPROACH_STEPS: ApproachStep[] = [
  {
    number: '01',
    title: 'Discovery & Requirement Analysis',
    description: 'We map your goals, users, processes and constraints, and agree on measurable success criteria before any code is written.',
    outputs: ['Requirements document', 'Process maps', 'Success metrics'],
    icon: Search,
  },
  {
    number: '02',
    title: 'Architecture & Planning',
    description: 'We choose the right architecture, technologies and integration approach, then plan delivery as clear milestones.',
    outputs: ['Solution architecture', 'Data model', 'Delivery roadmap'],
    icon: Compass,
  },
  {
    number: '03',
    title: 'UI/UX Design & Prototyping',
    description: 'We design interfaces around real workflows and validate them with clickable prototypes before development starts.',
    outputs: ['Wireframes', 'Design system', 'Interactive prototype'],
    icon: Palette,
  },
  {
    number: '04',
    title: 'Development & Integration',
    description: 'We build in short iterations with regular demos, integrating with your existing systems, data and third-party services.',
    outputs: ['Working increments', 'APIs & integrations', 'Code reviews'],
    icon: Code2,
  },
  {
    number: '05',
    title: 'Testing & Quality Assurance',
    description: 'Automated and manual testing covers functionality, performance, security and accessibility.',
    outputs: ['Automated test suites', 'QA reports', 'Security checks'],
    icon: TestTubeDiagonal,
  },
  {
    number: '06',
    title: 'Deployment & Launch',
    description: 'We set up CI/CD, cloud infrastructure and monitoring, then launch with a rollout and rollback plan.',
    outputs: ['Production environment', 'CI/CD pipelines', 'Launch checklist'],
    icon: Rocket,
  },
  {
    number: '07',
    title: 'Maintenance & Continuous Improvement',
    description: 'After launch we monitor, maintain and evolve the product as your business and users grow.',
    outputs: ['Monitoring & support', 'Updates & patches', 'Improvement roadmap'],
    icon: TrendingUp,
  },
]

export const DELIVERY_PILLARS: CompanyValue[] = [
  {
    title: 'Customized development',
    description: 'Software shaped around your processes, data and users — not a template with your logo on it.',
    icon: Sparkles,
  },
  {
    title: 'Scalable architecture',
    description: 'Modular services, sound data models and cloud infrastructure that grow with demand.',
    icon: Network,
  },
  {
    title: 'Security by design',
    description: 'Access control, encryption, audit trails and secure defaults from the first sprint.',
    icon: ShieldCheck,
  },
  {
    title: 'Long-term technical support',
    description: 'Monitoring, maintenance and continuous improvement long after launch day.',
    icon: LifeBuoy,
  },
]
