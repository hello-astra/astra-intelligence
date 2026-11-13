import { Component, Suspense, useState, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { storage } from '@/services/storage'
import type { DemoId } from '@/types/content'
import { cn } from '@/utils/cn'
import { DEMO_COMPONENTS, demoStoragePrefix } from './registry'
import { DemoFrameContext, type DemoVariant } from './shared/demo-context'

interface DemoHostProps {
  demoId: DemoId
  variant: DemoVariant
}

export function DemoHost({ demoId, variant }: DemoHostProps) {
  const Demo = DEMO_COMPONENTS[demoId]
  const [attempt, setAttempt] = useState(0)

  const recover = () => {
    storage.clearPrefix(demoStoragePrefix(demoId))
    setAttempt((a) => a + 1)
  }

  return (
    <DemoFrameContext.Provider value={{ variant }}>
      <DemoErrorBoundary key={`${demoId}-${attempt}`} onRecover={recover}>
        <Suspense fallback={<DemoLoading variant={variant} />}>
          <Demo />
        </Suspense>
      </DemoErrorBoundary>
    </DemoFrameContext.Provider>
  )
}

function DemoLoading({ variant }: { variant: DemoVariant }) {
  return (
    <div
      className={cn(
        'flex h-[560px] items-center justify-center rounded-2xl border border-white/[0.09] bg-base',
        variant === 'full' ? 'lg:h-[calc(100dvh-148px)] lg:min-h-[640px]' : 'lg:h-[780px]',
      )}
      role="status"
    >
      <div className="flex items-center gap-3 text-sm text-fg-3">
        <Spinner className="size-5 text-brand" />
        Loading demo…
      </div>
    </div>
  )
}

interface BoundaryProps {
  children: ReactNode
  onRecover: () => void
}

class DemoErrorBoundary extends Component<BoundaryProps, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Demo crashed', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-red-500/20 bg-base p-8 text-center">
          <AlertTriangle className="size-8 text-red-300" aria-hidden />
          <p className="mt-4 text-base font-semibold text-fg">This demo ran into a problem</p>
          <p className="mt-1 max-w-md text-sm text-fg-3">
            Saved demo data may be incompatible with this version. Restoring the sample data usually fixes it.
          </p>
          <Button className="mt-6" onClick={this.props.onRecover} leftIcon={<RotateCcw className="size-4" />}>
            Restore sample data
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}
