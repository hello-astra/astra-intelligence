import { lazy } from 'react'
import { Route, Routes } from 'react-router'
import { SiteLayout } from '@/components/layout/SiteLayout'
import HomePage from '@/pages/Home/HomePage'
import DemoRoute from './DemoRoute'
import { ROUTE_MODULES } from './route-modules'

const SolutionsPage = lazy(ROUTE_MODULES.solutions)
const SolutionDetailPage = lazy(ROUTE_MODULES.solution)
const LabPage = lazy(ROUTE_MODULES.lab)
const IndustriesPage = lazy(ROUTE_MODULES.industries)
const AboutPage = lazy(ROUTE_MODULES.about)
const ContactPage = lazy(ROUTE_MODULES.contact)
const NotFoundPage = lazy(ROUTE_MODULES.notFound)

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<HomePage />} />
        <Route path="solutions" element={<SolutionsPage />} />
        <Route path="solutions/:slug" element={<SolutionDetailPage />} />
        <Route path="lab" element={<LabPage />} />
        <Route path="lab/:slug" element={<DemoRoute />} />
        <Route path="industries" element={<IndustriesPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
