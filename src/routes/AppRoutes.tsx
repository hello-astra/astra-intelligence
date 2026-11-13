import { lazy } from 'react'
import { Route, Routes } from 'react-router'
import { SiteLayout } from '@/components/layout/SiteLayout'
import HomePage from '@/pages/Home/HomePage'

const SolutionsPage = lazy(() => import('@/pages/Solutions/SolutionsPage'))
const SolutionDetailPage = lazy(() => import('@/pages/Solutions/SolutionDetailPage'))
const LabPage = lazy(() => import('@/pages/Lab/LabPage'))
const DemoPage = lazy(() => import('@/pages/Lab/DemoPage'))
const IndustriesPage = lazy(() => import('@/pages/Industries/IndustriesPage'))
const AboutPage = lazy(() => import('@/pages/About/AboutPage'))
const ContactPage = lazy(() => import('@/pages/Contact/ContactPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFound/NotFoundPage'))

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<HomePage />} />
        <Route path="solutions" element={<SolutionsPage />} />
        <Route path="solutions/:slug" element={<SolutionDetailPage />} />
        <Route path="lab" element={<LabPage />} />
        <Route path="lab/:slug" element={<DemoPage />} />
        <Route path="industries" element={<IndustriesPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
