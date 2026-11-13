/** Site-wide brand and contact configuration. */
export const SITE = {
  name: 'Astra Intelligence',
  shortName: 'Astra',
  tagline: 'Technology Beyond Boundaries.',
  description:
    'Astra Intelligence is a technology-driven service organization specializing in Artificial Intelligence, Custom Software Development, Business Automation, Data Analytics and Intelligent Enterprise Solutions.',
  email: 'hello.astraintelligence@gmail.com',
  social: [
    { id: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/in/astra-intelligence-02738a44b' },
    { id: 'reddit', label: 'Reddit', href: 'https://www.reddit.com/user/astraintelligence' },
    { id: 'github', label: 'GitHub', href: 'https://github.com/hello-astra' },
    { id: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/astra_intelligence_' },
  ] as const,
} as const

export type SocialId = (typeof SITE.social)[number]['id']

/** External booking page if configured (VITE_BOOKING_URL), otherwise null. */
export const BOOKING_URL: string | null = import.meta.env.VITE_BOOKING_URL?.trim() || null

export interface NavItem {
  label: string
  to: string
  /** Shows the solutions mega menu on desktop. */
  menu?: 'solutions'
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Home', to: '/' },
  { label: 'Solutions', to: '/solutions', menu: 'solutions' },
  { label: 'Lab', to: '/lab' },
  { label: 'Industries', to: '/industries' },
  { label: 'About Us', to: '/about' },
  { label: 'Contact', to: '/contact' },
]
