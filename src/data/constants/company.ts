import { Eye, Gem, Handshake, Lightbulb, ShieldCheck, Target } from 'lucide-react'
import type { CompanyValue } from '@/types/content'

export const ABOUT_COPY = [
  'At Astra Intelligence, we believe technology should eliminate limitations, simplify complexity and unlock new possibilities.',
  'We combine software engineering, artificial intelligence and intelligent automation to create solutions that empower businesses to work smarter, make better decisions and scale confidently.',
]

export const MISSION =
  'To engineer practical, intelligent technology that removes operational limitations and helps businesses work smarter, decide better and scale with confidence.'

export const VISION =
  'A future where every business — whatever its size — can use artificial intelligence and modern software as a genuine competitive advantage.'

export const CORE_VALUES: CompanyValue[] = [
  {
    title: 'Engineering excellence',
    description: 'Clean architecture, tested code and clear documentation are part of the job, not optional extras.',
    icon: Gem,
  },
  {
    title: 'Practical innovation',
    description: 'We apply AI and automation where they create measurable value — never for novelty alone.',
    icon: Lightbulb,
  },
  {
    title: 'Transparency',
    description: 'Clear scope, honest estimates and visible progress at every stage of delivery.',
    icon: Eye,
  },
  {
    title: 'Security by default',
    description: 'Data protection and access control are designed in from the first sprint.',
    icon: ShieldCheck,
  },
  {
    title: 'Long-term partnership',
    description: 'We stay invested after launch, improving the product as your business evolves.',
    icon: Handshake,
  },
  {
    title: 'Outcome focus',
    description: 'Success is measured by the business problems solved, not by lines of code shipped.',
    icon: Target,
  },
]

export const CAPABILITY_DOMAINS = [
  { title: 'Artificial Intelligence', description: 'Conversational agents, prediction, document intelligence and LLM integration.' },
  { title: 'Custom Software', description: 'SaaS platforms, commerce systems, portals and internal tools.' },
  { title: 'Business Automation', description: 'Workflows, ERP modules and integrations that remove manual work.' },
  { title: 'Data & Analytics', description: 'Pipelines, dashboards and models that turn data into decisions.' },
]
