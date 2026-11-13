import { AboutSection } from '@/components/sections/AboutSection'
import { ApproachSection } from '@/components/sections/ApproachSection'
import { CapabilityStrip } from '@/components/sections/CapabilityStrip'
import { ContactSection } from '@/components/sections/ContactSection'
import { HeroSection } from '@/components/sections/HeroSection'
import { IndustriesSection } from '@/components/sections/IndustriesSection'
import { LabShowcase } from '@/components/sections/LabShowcase'
import { SolutionsExplorer } from '@/components/sections/SolutionsExplorer'
import { TechStackSection } from '@/components/sections/TechStackSection'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export default function HomePage() {
  useDocumentTitle()
  return (
    <>
      <HeroSection />
      <CapabilityStrip />
      <SolutionsExplorer />
      <LabShowcase />
      <IndustriesSection />
      <ApproachSection />
      <TechStackSection />
      <AboutSection />
      <ContactSection />
    </>
  )
}
