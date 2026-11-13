/**
 * Build-time entry (not shipped to browsers): renders the first-paint shell that
 * scripts/prerender-shell.mjs injects into dist/index.html.
 *
 * It uses the real layout components, so the HTML painted before any JavaScript runs
 * is exactly what React renders on its first commit. The bootstrap script in
 * index.html shows one variant per URL: the homepage hero, a page skeleton, or the
 * demo-frame skeleton for /lab/:slug.
 */
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router'
import { DemoPageHeader } from '@/components/layout/DemoPageHeader'
import { DemoRouteSkeleton, RouteSkeleton } from '@/components/layout/RouteSkeleton'
import { SiteFrame } from '@/components/layout/SiteLayout'
import { HeroSection } from '@/components/sections/HeroSection'
import { SOLUTION_INDEX as SOLUTIONS } from '@/data/constants/solution-index'

export function renderShell(): string {
  return renderToString(
    // A neutral location: the shell is shared by every URL, so no nav item is marked active.
    <StaticRouter location="/_shell">
      <SiteFrame>
        <div data-shell="home">
          <HeroSection />
        </div>
        <div data-shell="page">
          <RouteSkeleton kind="page" />
        </div>
        <div data-shell="demo">
          {/* One header per product; the bootstrap script reveals the one matching the URL. */}
          <DemoRouteSkeleton
            header={SOLUTIONS.map((s) => (
              <div key={s.slug} data-shell-demo={s.slug}>
                <DemoPageHeader solution={s} />
              </div>
            ))}
          />
        </div>
      </SiteFrame>
    </StaticRouter>,
  )
}

/** URL slug → demo id, for per-route chunk preloading. */
export const DEMO_SLUGS = SOLUTIONS.map((s) => ({ slug: s.slug, demoId: s.demoId }))
