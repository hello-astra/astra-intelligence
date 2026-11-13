import { lazy, Suspense } from 'react'
import { useParams } from 'react-router'
import { DemoPageHeader } from '@/components/layout/DemoPageHeader'
import { DemoBodySkeleton } from '@/components/layout/RouteSkeleton'
import { SUMMARY_BY_SLUG } from '@/data/constants/solution-index'
import type { SolutionSlug } from '@/types/content'
import { ROUTE_MODULES } from './route-modules'

const DemoPage = lazy(ROUTE_MODULES.demo)
const NotFoundPage = lazy(ROUTE_MODULES.notFound)

/**
 * /lab/:slug. The header (breadcrumb + title — the page's largest text) is in the
 * main bundle and mounts once; only the body below it waits for the page and demo
 * chunks. This matches the pre-rendered first paint exactly, so the title appears
 * with the HTML and is never replaced.
 */
export default function DemoRoute() {
  const { slug } = useParams()
  const solution = slug ? SUMMARY_BY_SLUG[slug as SolutionSlug] : undefined
  if (!solution) return <NotFoundPage />
  return (
    <>
      <DemoPageHeader solution={solution} />
      <Suspense fallback={<DemoBodySkeleton />}>
        <DemoPage />
      </Suspense>
    </>
  )
}
