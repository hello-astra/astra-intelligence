import githubSvg from 'simple-icons/icons/github.svg?raw'
import redditSvg from 'simple-icons/icons/reddit.svg?raw'
import instagramSvg from 'simple-icons/icons/instagram.svg?raw'
import type { SocialId } from '@/data/constants/site'

const pathOf = (svg: string) => /\sd="([^"]+)"/.exec(svg)?.[1] ?? ''

// LinkedIn is not distributed by Simple Icons; this is a simple "in" glyph.
const LINKEDIN_PATH =
  'M5 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 10h4v11H3V10Zm7 0h3.8v1.6h.06c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.77 2.65 4.77 6.1V21h-4v-4.7c0-1.12-.02-2.56-1.56-2.56-1.56 0-1.8 1.22-1.8 2.48V21H10V10Z'

const PATHS: Record<SocialId, string> = {
  linkedin: LINKEDIN_PATH,
  reddit: pathOf(redditSvg),
  github: pathOf(githubSvg),
  instagram: pathOf(instagramSvg),
}

export function SocialIcon({ id, size = 16 }: { id: SocialId; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path d={PATHS[id]} fill="currentColor" />
    </svg>
  )
}
