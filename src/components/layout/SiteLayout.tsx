import { Suspense, type ReactNode } from 'react'
import { Outlet, useLocation } from 'react-router'
import { Navbar } from '@/components/navigation/Navbar'
import { RouteErrorBoundary } from './ErrorBoundary'
import { Footer } from './Footer'
import { routeSkeletonKind } from './route-kind'
import { RouteSkeleton } from './RouteSkeleton'
import { ScrollManager } from './ScrollManager'

/**
 * Page frame shared by the live app and the build-time pre-rendered shell
 * (src/entry-shell.tsx), so the first paint and the hydrated app line up exactly.
 */
export function SiteFrame({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="relative isolate flex min-h-dvh flex-col overflow-x-clip">
      {/* Scroll sentinel: the navbar turns solid once this leaves the viewport. */}
      <span id="top-sentinel" aria-hidden className="pointer-events-none absolute top-0 left-0 h-2 w-px" />
      <a
        href="#main"
        className="sr-only z-[100] rounded-lg bg-brand-strong px-4 py-2 text-sm font-medium text-on-brand focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <AmbientBackground />
      <Navbar />
      <main id="main" className="flex-1" tabIndex={-1}>
        {children}
      </main>
      {footer}
    </div>
  )
}

export function SiteLayout() {
  const { pathname } = useLocation()
  return (
    <SiteFrame footer={<Footer />}>
      <RouteErrorBoundary key={pathname}>
        <Suspense fallback={<RouteSkeleton kind={routeSkeletonKind(pathname)} slug={pathname.split('/')[2]} />}>
          <Outlet />
        </Suspense>
      </RouteErrorBoundary>
      <ScrollManager />
    </SiteFrame>
  )
}

/** Soft, static ambient lighting at the top of every page. Purely decorative — no animation. */
export function AmbientBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[1100px] overflow-hidden">
      <div className="absolute -top-[380px] left-[-12%] h-[820px] w-[820px] rounded-full bg-[radial-gradient(closest-side,rgb(63_123_255/0.16),transparent)] light:bg-[radial-gradient(closest-side,rgb(63_123_255/0.12),transparent)]" />
      <div className="absolute -top-[320px] right-[-14%] h-[760px] w-[760px] rounded-full bg-[radial-gradient(closest-side,rgb(124_92_255/0.13),transparent)] light:bg-[radial-gradient(closest-side,rgb(124_92_255/0.09),transparent)]" />
      <div className="absolute top-[260px] left-[38%] h-[520px] w-[520px] rounded-full bg-[radial-gradient(closest-side,rgb(34_211_238/0.05),transparent)]" />
      <div className="bg-grid mask-radial absolute inset-0 opacity-70" />
    </div>
  )
}
