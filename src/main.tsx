import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { loadRouteChunks } from './routes/route-modules'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element #root not found')

// Start downloading the current page's code (and, for /lab/:slug, its demo) right now,
// in parallel with React's first render, instead of as a waterfall after it.
loadRouteChunks(window.location.pathname)

// From here on, scroll-reveal content may start hidden (it is revealed by an observer).
// Before this point — and if this script never runs — everything stays visible.
document.documentElement.classList.add('js-ready')

// #root holds the pre-rendered shell (see scripts/prerender-shell.mjs). createRoot
// replaces it in React's first commit; the shell matches that first frame, so there
// is no visible jump.
createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
