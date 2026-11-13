import { Suspense } from 'react'
import { Outlet } from 'react-router'
import { Navbar } from '@/components/navigation/Navbar'
import { Footer } from './Footer'
import { PageLoader } from './PageLoader'
import { ScrollManager } from './ScrollManager'

export function SiteLayout() {
  return (
    <div className="relative isolate flex min-h-dvh flex-col overflow-x-clip">
      <a
        href="#main"
        className="sr-only z-[100] rounded-lg bg-brand-strong px-4 py-2 text-sm font-medium text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <AmbientBackground />
      <Navbar />
      <main id="main" className="flex-1" tabIndex={-1}>
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <ScrollManager />
    </div>
  )
}

/** Soft ambient lighting at the top of every page. Purely decorative. */
function AmbientBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[1100px] overflow-hidden">
      <div className="absolute -top-[380px] left-[-12%] h-[820px] w-[820px] rounded-full bg-[radial-gradient(closest-side,rgb(63_123_255/0.16),transparent)]" />
      <div className="absolute -top-[320px] right-[-14%] h-[760px] w-[760px] rounded-full bg-[radial-gradient(closest-side,rgb(124_92_255/0.13),transparent)]" />
      <div className="absolute top-[260px] left-[38%] h-[520px] w-[520px] rounded-full bg-[radial-gradient(closest-side,rgb(34_211_238/0.05),transparent)]" />
      <div className="bg-grid mask-radial absolute inset-0 opacity-70" />
    </div>
  )
}
