import { lazy, Suspense } from 'react'
import { CapabilityStrip } from '@/components/sections/CapabilityStrip'
import { HeroSection } from '@/components/sections/HeroSection'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { ROUTE_MODULES } from '@/routes/route-modules'

const HomeSections = lazy(ROUTE_MODULES.homeSections)

export default function HomePage() {
  useDocumentTitle()
  return (
    <>
      <HeroSection />
      <CapabilityStrip />
      {/* Tall placeholder keeps the footer out of view until the sections arrive. */}
      <Suspense fallback={<div className="min-h-[150vh]" aria-hidden />}>
        <HomeSections />
      </Suspense>
    </>
  )
}
