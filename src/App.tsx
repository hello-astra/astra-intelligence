import { BrowserRouter } from 'react-router'
import { MotionConfig } from 'framer-motion'
import { ToastProvider } from '@/components/ui/Toast'
import { AppRoutes } from '@/routes/AppRoutes'

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <ToastProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ToastProvider>
    </MotionConfig>
  )
}
