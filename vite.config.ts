import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

/** Recharts and its runtime dependencies — only demos load these. */
const CHART_LIBS =
  /[\\/]node_modules[\\/](recharts|d3-[^\\/]+|victory-vendor|decimal\.js-light|es-toolkit|@reduxjs|immer|redux|redux-thunk|reselect|react-redux|eventemitter3|internmap|tiny-invariant|clsx|react-is|use-sync-external-store)[\\/]/

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
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
