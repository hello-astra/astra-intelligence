import { cn } from '@/utils/cn'
import type { ReactNode } from 'react'
import { SUMMARY_BY_SLUG } from '@/data/constants/solution-index'
import type { SolutionSlug } from '@/types/content'
import { DemoPageHeader } from './DemoPageHeader'
import type { RouteSkeletonKind } from './route-kind'

const Bar = ({ className }: { className?: string }) => <div className={cn('skeleton rounded-md', className)} />

/**
 * Placeholder shown while a page's code downloads. It mirrors the geometry of the
 * page header (or the full-screen demo frame) so nothing jumps when the real page
 * arrives, and it is tall enough to keep the footer below the fold.
 *
 * The same component is pre-rendered into index.html, so direct visits to any URL
 * show this layout on the very first paint.
 */
export function RouteSkeleton({ kind = 'page', slug }: { kind?: RouteSkeletonKind; slug?: string }) {
  if (kind === 'demo') {
    const solution = slug ? SUMMARY_BY_SLUG[slug as SolutionSlug] : undefined
    return <DemoRouteSkeleton header={solution ? <DemoPageHeader solution={solution} /> : <DemoHeaderBars />} />
  }
  return (
    <div role="status" aria-label="Loading page" className="min-h-dvh">
      <div className="mx-auto w-full max-w-7xl px-4 pt-12 pb-12 sm:px-6 sm:pt-16 lg:px-8 lg:pt-20">
        <Bar className="h-3 w-40" />
        <Bar className="mt-6 h-10 w-[min(42rem,100%)] sm:h-12" />
        <Bar className="mt-3 h-10 w-[min(30rem,80%)] sm:h-12" />
        <Bar className="mt-7 h-4 w-[min(36rem,100%)]" />
        <Bar className="mt-2.5 h-4 w-[min(32rem,90%)]" />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-44 rounded-2xl border border-ink/[0.06] bg-panel/50" />
          ))}
        </div>
      </div>
    </div>
  )
}

/** A full-screen demo route while its code loads: the real page header, then the demo frame skeleton. */
export function DemoRouteSkeleton({ header }: { header: ReactNode }) {
  return (
    <>
      {header}
      <DemoBodySkeleton />
    </>
  )
}

/** Placeholder for the demo page body (same size as the demo frame; keeps the footer below the fold). */
export function DemoBodySkeleton() {
  return (
    <div className="min-h-dvh">
      <div role="status" aria-label="Loading demo" className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <DemoFrameSkeleton variant="full" />
      </div>
    </div>
  )
}

function DemoHeaderBars() {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 pt-5 pb-4 sm:px-6 lg:px-8">
      <Bar className="h-3 w-28" />
      <Bar className="mt-3 h-7 w-80 max-w-full" />
    </div>
  )
}

/**
 * The demo application frame (top bar, sidebar, content) at the exact size of the
 * real demo shell. Used while a demo's code loads.
 */
export function DemoFrameSkeleton({ variant }: { variant: 'full' | 'embedded' }) {
  return (
    <div
      className={cn(
        'flex h-[560px] flex-col overflow-hidden rounded-2xl border border-ink/[0.09] bg-base',
        variant === 'full' ? 'lg:h-[calc(100dvh-148px)] lg:min-h-[640px]' : 'lg:h-[780px]',
      )}
    >
      <div className="flex items-center gap-3 border-b border-line bg-chrome px-4 py-3">
        <div className="size-8 rounded-lg bg-brand/20" />
        <div className="space-y-1.5">
          <Bar className="h-3 w-28" />
          <Bar className="h-2.5 w-20" />
        </div>
        <Bar className="ml-auto h-7 w-24 rounded-lg" />
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="hidden w-52 shrink-0 space-y-2 border-r border-line bg-chrome p-3 lg:block">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Bar key={i} className="h-8 rounded-lg" />
          ))}
        </div>
        <div className="flex-1 space-y-4 p-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-xl border border-line bg-panel" />
            ))}
          </div>
          <div className="h-64 rounded-xl border border-line bg-panel" />
        </div>
      </div>
    </div>
  )
}
