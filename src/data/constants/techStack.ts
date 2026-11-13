import type { TechCategory, TechId, TechItem } from '@/types/content'

export const TECH_CATEGORIES: { id: TechCategory; label: string; description: string }[] = [
  { id: 'frontend', label: 'Frontend', description: 'Fast, accessible interfaces for web and mobile browsers.' },
  { id: 'backend', label: 'Backend', description: 'APIs, services and business logic.' },
  { id: 'database', label: 'Databases', description: 'Relational, document and in-memory data stores.' },
  { id: 'ai-data', label: 'AI & Data', description: 'Models, intelligence and visualization.' },
  { id: 'infrastructure', label: 'Infrastructure & Automation', description: 'Delivery pipelines, cloud and workflow automation.' },
]

export const TECH_STACK: TechItem[] = [
  { id: 'react', name: 'React.js', category: 'frontend', description: 'Component-based UI library' },
  { id: 'nextjs', name: 'Next.js', category: 'frontend', description: 'Full-stack React framework' },
  { id: 'typescript', name: 'TypeScript', category: 'frontend', description: 'Typed JavaScript at scale' },
  { id: 'javascript', name: 'JavaScript', category: 'frontend', description: 'The language of the web' },
  { id: 'tailwind', name: 'Tailwind CSS', category: 'frontend', description: 'Utility-first styling' },

  { id: 'nodejs', name: 'Node.js', category: 'backend', description: 'JavaScript runtime for services' },
  { id: 'express', name: 'Express.js', category: 'backend', description: 'Minimal web framework' },
  { id: 'python', name: 'Python', category: 'backend', description: 'Services, data and ML' },
  { id: 'fastapi', name: 'FastAPI', category: 'backend', description: 'High-performance Python APIs' },
  { id: 'django', name: 'Django', category: 'backend', description: 'Batteries-included web framework' },

  { id: 'mongodb', name: 'MongoDB', category: 'database', description: 'Document database' },
  { id: 'postgresql', name: 'PostgreSQL', category: 'database', description: 'Relational database' },
  { id: 'mysql', name: 'MySQL', category: 'database', description: 'Relational database' },
  { id: 'redis', name: 'Redis', category: 'database', description: 'In-memory cache & queues' },

  { id: 'openai', name: 'OpenAI APIs', category: 'ai-data', description: 'Hosted foundation models' },
  { id: 'llm', name: 'LLM Integration', category: 'ai-data', description: 'Retrieval, tools and guardrails' },
  { id: 'ml', name: 'Machine Learning', category: 'ai-data', description: 'Classification & prediction' },
  { id: 'predictive', name: 'Predictive Analytics', category: 'ai-data', description: 'Forecasting & anomaly detection' },
  { id: 'dataviz', name: 'Data Visualization', category: 'ai-data', description: 'Dashboards & interactive charts' },
  { id: 'ocr', name: 'OCR', category: 'ai-data', description: 'Text & data extraction from documents' },

  { id: 'docker', name: 'Docker', category: 'infrastructure', description: 'Containerized deployments' },
  { id: 'aws', name: 'AWS', category: 'infrastructure', description: 'Cloud infrastructure' },
  { id: 'vercel', name: 'Vercel', category: 'infrastructure', description: 'Frontend hosting & edge' },
  { id: 'git', name: 'Git', category: 'infrastructure', description: 'Version control' },
  { id: 'cicd', name: 'CI/CD', category: 'infrastructure', description: 'Automated build, test & release' },
  { id: 'kafka', name: 'Kafka', category: 'infrastructure', description: 'Event streaming' },
  { id: 'n8n', name: 'n8n', category: 'infrastructure', description: 'Workflow automation' },
  { id: 'rest', name: 'REST APIs', category: 'infrastructure', description: 'Integration contracts' },
]

export const TECH_BY_ID: Record<TechId, TechItem> = Object.fromEntries(TECH_STACK.map((t) => [t.id, t])) as Record<
  TechId,
  TechItem
>
