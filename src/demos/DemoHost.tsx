import { Component, Suspense, useEffect, useRef, useState, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react'
import { isChunkLoadError } from '@/utils/chunk-error'
import { DemoFrameSkeleton } from '@/components/layout/RouteSkeleton'
import { Button } from '@/components/ui/Button'
import { storage } from '@/services/storage'
import type { DemoId } from '@/types/content'
import { DEMO_LOADERS } from './loaders'
import { DEMO_COMPONENTS, demoStoragePrefix } from './registry'
import { DemoFrameContext, type DemoVariant } from './shared/demo-context'
import { DemoThemeProvider } from './shared/DemoThemeProvider'

interface DemoHostProps {
  demoId: DemoId
  variant: DemoVariant
}

/**
 * Mounts a demo inside its product theme. While the demo's code downloads, a
 * skeleton of the exact same frame (already in the product's colours) holds its
 * place, so nothing shifts when the demo appears.
 */
export function DemoHost({ demoId, variant }: DemoHostProps) {
  const Demo = DEMO_COMPONENTS[demoId]
  const [attempt, setAttempt] = useState(0)

  const recover = () => {
    storage.clearPrefix(demoStoragePrefix(demoId))
    setAttempt((a) => a + 1)
  }

  return (
    <DemoThemeProvider demoId={demoId}>
      <DemoFrameContext.Provider value={{ variant }}>
        <DemoErrorBoundary key={`${demoId}-${attempt}`} onRecover={recover}>
          <Suspense
            fallback={
              <div role="status" aria-label="Loading demo">
                <DemoFrameSkeleton variant={variant} />
              </div>
            }
          >
            <Demo />
          </Suspense>
        </DemoErrorBoundary>
      </DemoFrameContext.Provider>
    </DemoThemeProvider>
  )
}

/**
 * For demos embedded further down a page: holds the demo's exact footprint with a
 * themed skeleton and only mounts the demo (downloading its code and charts, and
 * running its first render) when the visitor scrolls near it. The code is fetched
 * ahead of time when the browser is idle, unless the visitor has Save-Data on.
 */
export function DeferredDemoHost({ demoId, variant }: DemoHostProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (mounted) return
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setMounted(true)
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setMounted(true)
        io.disconnect()
      },
      { rootMargin: '600px 0px' },
    )
    io.observe(el)

    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData
    const warm = () => void DEMO_LOADERS[demoId]().catch(() => {})
    // requestIdleCallback is missing in older Safari; fall back to a delayed timer.
    const ric = typeof window.requestIdleCallback === 'function'
    const handle = saveData ? 0 : ric ? window.requestIdleCallback(warm, { timeout: 4000 }) : window.setTimeout(warm, 2500)
    return () => {
      io.disconnect()
      if (!handle) return
      if (ric) window.cancelIdleCallback(handle)
      else window.clearTimeout(handle)
    }
  }, [mounted, demoId])

  if (mounted) return <DemoHost demoId={demoId} variant={variant} />
  return (
    <div ref={ref}>
      <DemoThemeProvider demoId={demoId}>
        <div role="status" aria-label="Demo loads when you scroll to it">
          <DemoFrameSkeleton variant={variant} />
        </div>
      </DemoThemeProvider>
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
    const { error } = this.state
    if (!error) return this.props.children
    if (isChunkLoadError(error)) {
      return (
        <div role="alert" className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-line bg-base p-8 text-center">
          <AlertTriangle className="size-8 text-amber-300" aria-hidden />
          <p className="mt-4 text-base font-semibold text-fg">This demo could not be downloaded</p>
          <p className="mt-1 max-w-md text-sm text-fg-3">The connection may have dropped, or a newer version of the site was just published.</p>
          <Button className="mt-6" onClick={() => window.location.reload()} leftIcon={<RefreshCw className="size-4" />}>
            Reload page
          </Button>
        </div>
      )
    }
    return (
      <div role="alert" className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-red-500/20 bg-base p-8 text-center">
        <AlertTriangle className="size-8 text-red-300" aria-hidden />
        <p className="mt-4 text-base font-semibold text-fg">This demo ran into a problem</p>
        <p className="mt-1 max-w-md text-sm text-fg-3">Saved demo data may be incompatible with this version. Restoring the sample data usually fixes it.</p>
        <Button className="mt-6" onClick={this.props.onRecover} leftIcon={<RotateCcw className="size-4" />}>
          Restore sample data
        </Button>
      </div>
    )
  }
}
