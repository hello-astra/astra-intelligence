import { Component, type ErrorInfo, type ReactNode } from 'react'
import { isChunkLoadError } from '@/utils/chunk-error'

interface BoundaryProps {
  children: ReactNode
  /** Rendered instead of the children after an error. */
  fallback: (props: { error: Error; reset: () => void }) => ReactNode
}

class Boundary extends Component<BoundaryProps, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Render error', error, info.componentStack)
  }

  reset = () => this.setState({ error: null })

  render() {
    if (this.state.error) return this.props.fallback({ error: this.state.error, reset: this.reset })
    return this.props.children
  }
}

function Message({ error, reset, compact }: { error: Error; reset: () => void; compact?: boolean }) {
  const chunk = isChunkLoadError(error)
  return (
    <div role="alert" className={compact ? 'flex min-h-[60vh] items-center justify-center px-4 py-16' : 'flex min-h-dvh items-center justify-center bg-canvas px-4 text-fg'}>
      <div className="max-w-md text-center">
        <p className="font-mono text-xs tracking-[0.2em] text-fg-3 uppercase">{chunk ? 'Connection issue' : 'Something went wrong'}</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-fg">
          {chunk ? 'This page could not be loaded.' : 'This page ran into a problem.'}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-fg-2">
          {chunk
            ? 'Part of the site failed to download — the connection may have dropped, or a newer version was just published. Reloading usually fixes it.'
            : 'An unexpected error stopped this page from rendering. You can try again, or head back to the homepage.'}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => (chunk ? window.location.reload() : reset())}
            className="inline-flex h-10 items-center rounded-lg bg-brand-strong px-4 text-sm font-medium text-on-brand hover:bg-brand-hover"
          >
            {chunk ? 'Reload page' : 'Try again'}
          </button>
          <a href="/" className="inline-flex h-10 items-center rounded-lg px-4 text-sm font-medium text-fg-2 ring-1 ring-ink/10 ring-inset hover:bg-ink/[0.06] hover:text-fg">
            Go to homepage
          </a>
        </div>
      </div>
    </div>
  )
}

/** Last line of defence around the whole app: never leave a blank screen. */
export function AppErrorBoundary({ children }: { children: ReactNode }) {
  return <Boundary fallback={(props) => <Message {...props} />}>{children}</Boundary>
}

/** Around the routed page only, so the navigation and footer stay usable. Key it by pathname. */
export function RouteErrorBoundary({ children }: { children: ReactNode }) {
  return <Boundary fallback={(props) => <Message {...props} compact />}>{children}</Boundary>
}
