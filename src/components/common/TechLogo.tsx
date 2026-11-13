import type { LucideIcon } from 'lucide-react'
import { Bot, BrainCircuit, Braces, ChartColumnBig, ChartSpline, Cloud, GitMerge, ScanText, Sparkles } from 'lucide-react'
import reactSvg from 'simple-icons/icons/react.svg?raw'
import nextSvg from 'simple-icons/icons/nextdotjs.svg?raw'
import tsSvg from 'simple-icons/icons/typescript.svg?raw'
import jsSvg from 'simple-icons/icons/javascript.svg?raw'
import tailwindSvg from 'simple-icons/icons/tailwindcss.svg?raw'
import nodeSvg from 'simple-icons/icons/nodedotjs.svg?raw'
import expressSvg from 'simple-icons/icons/express.svg?raw'
import pythonSvg from 'simple-icons/icons/python.svg?raw'
import fastapiSvg from 'simple-icons/icons/fastapi.svg?raw'
import djangoSvg from 'simple-icons/icons/django.svg?raw'
import mongoSvg from 'simple-icons/icons/mongodb.svg?raw'
import postgresSvg from 'simple-icons/icons/postgresql.svg?raw'
import mysqlSvg from 'simple-icons/icons/mysql.svg?raw'
import redisSvg from 'simple-icons/icons/redis.svg?raw'
import dockerSvg from 'simple-icons/icons/docker.svg?raw'
import vercelSvg from 'simple-icons/icons/vercel.svg?raw'
import gitSvg from 'simple-icons/icons/git.svg?raw'
import kafkaSvg from 'simple-icons/icons/apachekafka.svg?raw'
import n8nSvg from 'simple-icons/icons/n8n.svg?raw'
import type { TechId } from '@/types/content'
import { cn } from '@/utils/cn'

/** Pulls the single path out of a Simple Icons SVG file. */
function pathOf(svg: string): string {
  return /\sd="([^"]+)"/.exec(svg)?.[1] ?? ''
}

type LogoDef = { kind: 'brand'; path: string; color: string } | { kind: 'icon'; icon: LucideIcon; color: string }

// Brand marks from Simple Icons (CC0). Brands whose marks are not distributed
// there (OpenAI, AWS) and generic concepts use neutral icons instead of copies.
const LOGOS: Record<TechId, LogoDef> = {
  react: { kind: 'brand', path: pathOf(reactSvg), color: '#61DAFB' },
  nextjs: { kind: 'brand', path: pathOf(nextSvg), color: '#FFFFFF' },
  typescript: { kind: 'brand', path: pathOf(tsSvg), color: '#3178C6' },
  javascript: { kind: 'brand', path: pathOf(jsSvg), color: '#F7DF1E' },
  tailwind: { kind: 'brand', path: pathOf(tailwindSvg), color: '#06B6D4' },
  nodejs: { kind: 'brand', path: pathOf(nodeSvg), color: '#5FA04E' },
  express: { kind: 'brand', path: pathOf(expressSvg), color: '#FFFFFF' },
  python: { kind: 'brand', path: pathOf(pythonSvg), color: '#4B8BBE' },
  fastapi: { kind: 'brand', path: pathOf(fastapiSvg), color: '#009688' },
  django: { kind: 'brand', path: pathOf(djangoSvg), color: '#44B78B' },
  mongodb: { kind: 'brand', path: pathOf(mongoSvg), color: '#47A248' },
  postgresql: { kind: 'brand', path: pathOf(postgresSvg), color: '#6B8FE8' },
  mysql: { kind: 'brand', path: pathOf(mysqlSvg), color: '#5D8FC2' },
  redis: { kind: 'brand', path: pathOf(redisSvg), color: '#FF4438' },
  openai: { kind: 'icon', icon: Sparkles, color: '#E8EDF7' },
  llm: { kind: 'icon', icon: Bot, color: '#9DBCFF' },
  ml: { kind: 'icon', icon: BrainCircuit, color: '#C4B5FD' },
  predictive: { kind: 'icon', icon: ChartSpline, color: '#67E8F9' },
  dataviz: { kind: 'icon', icon: ChartColumnBig, color: '#9DBCFF' },
  ocr: { kind: 'icon', icon: ScanText, color: '#67E8F9' },
  docker: { kind: 'brand', path: pathOf(dockerSvg), color: '#2496ED' },
  aws: { kind: 'icon', icon: Cloud, color: '#FF9900' },
  vercel: { kind: 'brand', path: pathOf(vercelSvg), color: '#FFFFFF' },
  git: { kind: 'brand', path: pathOf(gitSvg), color: '#F05032' },
  cicd: { kind: 'icon', icon: GitMerge, color: '#9DBCFF' },
  kafka: { kind: 'brand', path: pathOf(kafkaSvg), color: '#FFFFFF' },
  n8n: { kind: 'brand', path: pathOf(n8nSvg), color: '#EA4B71' },
  rest: { kind: 'icon', icon: Braces, color: '#C4B5FD' },
}

interface TechLogoProps {
  id: TechId
  size?: number
  /** "brand" renders brand colors; "mono" uses currentColor. */
  tone?: 'brand' | 'mono'
  className?: string
  title?: string
}

export function TechLogo({ id, size = 20, tone = 'brand', className, title }: TechLogoProps) {
  const def = LOGOS[id]
  const color = tone === 'brand' ? def.color : 'currentColor'
  if (def.kind === 'icon') {
    const Icon = def.icon
    return <Icon size={size} color={color} strokeWidth={1.75} className={cn('shrink-0', className)} aria-hidden={!title} aria-label={title} />
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={cn('shrink-0', className)}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <path d={def.path} fill={color} />
    </svg>
  )
}

