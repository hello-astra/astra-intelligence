import { DEMO_LOADERS } from '@/demos/loaders'
import { SOLUTION_INDEX as SOLUTIONS } from '@/data/constants/solution-index'

/** Dynamic imports for every lazily loaded page. Shared by the router and prefetching. */
export const ROUTE_MODULES = {
  solutions: () => import('@/pages/Solutions/SolutionsPage'),
  solution: () => import('@/pages/Solutions/SolutionDetailPage'),
  lab: () => import('@/pages/Lab/LabPage'),
  demo: () => import('@/pages/Lab/DemoPage'),
  industries: () => import('@/pages/Industries/IndustriesPage'),
  about: () => import('@/pages/About/AboutPage'),
  contact: () => import('@/pages/Contact/ContactPage'),
  notFound: () => import('@/pages/NotFound/NotFoundPage'),
  homeSections: () => import('@/pages/Home/HomeSections'),
} as const

const started = new Set<string>()

function once(key: string, load: () => Promise<unknown>) {
  if (started.has(key)) return
  started.add(key)
  load().catch(() => started.delete(key)) // retry on the next intent if the network failed
}

/**
 * Loads the code for a path: its page chunk and, for a full-screen demo (/lab/:slug),
 * the demo itself. With `includeDemo`, solution pages (/solutions/:slug) fetch their
 * embedded demo too — used for hover prefetch; at boot that demo is below the fold
 * and loads when the visitor approaches it.
 */
export function loadRouteChunks(pathname: string, includeDemo = false): void {
  const [, section, slug] = pathname.split('/')
  if (!section) return once('homeSections', ROUTE_MODULES.homeSections)
  const demoId = slug ? SOLUTIONS.find((s) => s.slug === slug)?.demoId : undefined
  if (section === 'lab') {
    once(slug ? 'demo' : 'lab', slug ? ROUTE_MODULES.demo : ROUTE_MODULES.lab)
  } else if (section === 'solutions') {
    once(slug ? 'solution' : 'solutions', slug ? ROUTE_MODULES.solution : ROUTE_MODULES.solutions)
  } else if (section in ROUTE_MODULES) {
    once(section, ROUTE_MODULES[section as keyof typeof ROUTE_MODULES])
  }
  if (demoId && (section === 'lab' || includeDemo)) once(`demo:${demoId}`, DEMO_LOADERS[demoId])
}

function constrainedNetwork(): boolean {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection
  return Boolean(connection?.saveData) || /(^|-)2g$/.test(connection?.effectiveType ?? '')
}

/**
 * Prefetches a route on hover/focus (user intent) so navigation feels instant.
 * Skipped on Save-Data and 2G connections, where unrequested downloads cost the user.
 */
export function prefetchPath(to: string): void {
  if (constrainedNetwork()) return
  const pathname = to.split(/[?#]/)[0]
  loadRouteChunks(pathname, true)
}
