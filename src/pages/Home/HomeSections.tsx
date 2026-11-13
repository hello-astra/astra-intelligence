import type { ReactNode } from 'react'
import { AboutSection } from '@/components/sections/AboutSection'
import { ApproachSection } from '@/components/sections/ApproachSection'
import { ContactSection } from '@/components/sections/ContactSection'
import { IndustriesSection } from '@/components/sections/IndustriesSection'
import { LabShowcase } from '@/components/sections/LabShowcase'
import { SolutionsExplorer } from '@/components/sections/SolutionsExplorer'
import { TechStackSection } from '@/components/sections/TechStackSection'

/** Lets the browser skip layout and paint for a section until it nears the viewport. */
function Lazy({ children }: { children: ReactNode }) {
  return <div className="cv-auto">{children}</div>
}

/**
 * Everything below the homepage hero. Code-split from the main bundle: it starts
 * downloading in parallel at boot (see loadRouteChunks) and renders in its own
 * commit, so the hero becomes interactive sooner on slow devices.
 */
export default function HomeSections() {
  return (
    <>
      <Lazy>
        <SolutionsExplorer />
      </Lazy>
      <Lazy>
        <LabShowcase />
      </Lazy>
      <Lazy>
        <IndustriesSection />
      </Lazy>
      <Lazy>
        <ApproachSection />
      </Lazy>
      <Lazy>
        <TechStackSection />
      </Lazy>
      <Lazy>
        <AboutSection />
      </Lazy>
      <Lazy>
        <ContactSection />
      </Lazy>
    </>
  )
}
