import type { SolutionSlug } from '@/types/content'

export const paths = {
  home: '/',
  solutions: '/solutions',
  solution: (slug: SolutionSlug) => `/solutions/${slug}`,
  lab: '/lab',
  demo: (slug: SolutionSlug) => `/lab/${slug}`,
  industries: '/industries',
  about: '/about',
  contact: '/contact',
} as const

/** /contact with optional pre-selected service and/or consultation intent. */
export function contactPath(options: { service?: SolutionSlug; consultation?: boolean } = {}): string {
  const params = new URLSearchParams()
  if (options.service) params.set('service', options.service)
  if (options.consultation) params.set('intent', 'consultation')
  const query = params.toString()
  return query ? `/contact?${query}#enquiry` : '/contact#enquiry'
}
