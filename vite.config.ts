import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'

/** Recharts and its runtime dependencies — only demos load these. */
const CHART_LIBS =
  /[\\/]node_modules[\\/](recharts|d3-[^\\/]+|victory-vendor|decimal\.js-light|es-toolkit|@reduxjs|immer|redux|redux-thunk|reselect|react-redux|eventemitter3|internmap|tiny-invariant|clsx|react-is|use-sync-external-store)[\\/]/

/**
 * Serves api/contact.ts during `npm run dev` / `npm run preview`, so the contact form works
 * locally exactly as it does on Vercel. Server-only variables (GMAIL_USER, GMAIL_APP_PASSWORD,
 * CONTACT_TO) are read from .env.local and never reach the client bundle.
 */
function contactApi(): Plugin {
  type Handler = (req: unknown, res: unknown) => Promise<void>
  const route = '/api/contact'
  return {
    name: 'astra-contact-api',
    config(_, { mode }) {
      const env = loadEnv(mode, process.cwd(), '')
      for (const key of ['GMAIL_USER', 'GMAIL_APP_PASSWORD', 'CONTACT_TO']) {
        if (env[key] && !process.env[key]) process.env[key] = env[key]
      }
    },
    configureServer(server) {
      server.middlewares.use(route, (req, res, next) => {
        server
          .ssrLoadModule('/api/contact.ts')
          .then((mod) => (mod.default as Handler)(req, res))
          .catch(next)
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use(route, (req, res, next) => {
        import('./api/contact.ts').then((mod) => (mod.default as unknown as Handler)(req, res)).catch(next)
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), contactApi()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 700,
    // Read by scripts/prerender-shell.mjs to map routes to chunks (removed from dist afterwards).
    manifest: true,
    rolldownOptions: {
      output: {
        // Shared chunks get short, hash-only names (their auto names list every importer).
        chunkFileNames: (chunk) => (chunk.name.startsWith('shared') ? 'assets/shared-[hash].js' : 'assets/[name]-[hash].js'),
        codeSplitting: {
          groups: [
            // Everything the first page needs stays together and is claimed first, so the lazy
            // groups below can never pull initial code apart (or drag lazy code into the first load).
            { name: 'app', tags: ['$initial'], priority: 30 },
            // One cached chart library for all nine demos (instead of a chunk per chart type).
            { name: 'charts', test: CHART_LIBS, priority: 20 },
            // Lazily loaded code shared between routes (UI kit, icons, utilities): group by the
            // set of pages that use it and fold sub-12 KB fragments into a neighbour, so a demo
            // needs a handful of requests rather than dozens of sub-kilobyte files.
            { name: 'shared', minShareCount: 2, entriesAware: true, entriesAwareMergeThreshold: 12 * 1024, priority: 10 },
          ],
        },
      },
    },
  },
})
