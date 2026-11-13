import { BrowserRouter } from 'react-router'
import { AppErrorBoundary } from '@/components/layout/ErrorBoundary'
import { ToastProvider } from '@/components/ui/Toast'
import { AppRoutes } from '@/routes/AppRoutes'
import { ColorModeProvider } from '@/theme/ColorModeProvider'

export default function App() {
  return (
    <AppErrorBoundary>
      <ColorModeProvider>
        <ToastProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </ToastProvider>
      </ColorModeProvider>
    </AppErrorBoundary>
  )
}
