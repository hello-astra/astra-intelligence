/**
 * Post-build step (runs after `vite build`, see package.json):
 *
 * 1. Pre-renders the first-paint shell (navigation + hero / route skeletons) from the
 *    real React components (src/entry-shell.tsx) into dist/index.html, so the very
 *    first paint shows meaningful, final-looking content instead of an empty #root.
 * 2. Inlines the stylesheet, so that first paint needs only the HTML response.
 * 3. Preloads the Latin Geist font and the logo used above the fold.
 * 4. Writes a route → chunk map from Vite's manifest; the bootstrap script in
 *    index.html uses it to start downloading the current route's code (e.g. a demo
 *    and its chart library on /lab/:slug) in parallel with the main bundle.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build } from 'vite'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')
const shellOut = path.join(root, 'node_modules', '.cache', 'astra-shell')
const htmlPath = path.join(dist, 'index.html')
const inlineCss = process.env.INLINE_CSS !== '0'

// ---------------------------------------------------------------- 1. render shell
await build({
  root,
  configFile: path.join(root, 'vite.config.ts'),
  logLevel: 'warn',
  build: { ssr: 'src/entry-shell.tsx', outDir: shellOut, emptyOutDir: true, manifest: false, copyPublicDir: false },
})
const shellModule = await import(pathToFileURL(path.join(shellOut, 'entry-shell.js')).href)
const shellHtml = shellModule.renderShell()

// Normalise line endings, drop HTML comments and indentation (newlines are kept: the
// inline bootstrap script relies on automatic semicolon insertion).
let html = fs
  .readFileSync(htmlPath, 'utf8')
  .replace(/\r\n/g, '\n')
  .replace(/<!--[\s\S]*?-->\n?/g, '')
  .replace(/\n[ \t]+/g, '\n')
if (!html.includes('<div id="root"></div>')) throw new Error('index.html: empty #root not found')
html = html.replace('<div id="root"></div>', `<div id="root">${shellHtml}</div>`)

// ----------------------------------------------------------- 2. inline stylesheet
const cssLink = html.match(/<link rel="stylesheet" crossorigin href="\/(assets\/[^"]+\.css)">/)
if (!cssLink) throw new Error('index.html: stylesheet link not found')
if (inlineCss) {
  const css = fs.readFileSync(path.join(dist, cssLink[1]), 'utf8')
  html = html.replace(cssLink[0], `<style>${css}</style>`)
}

// --------------------------------------------------------------- 3. font preload
const assets = fs.readdirSync(path.join(dist, 'assets'))
const font = assets.find((f) => /^geist-latin-wght-normal-.*\.woff2$/.test(f))
if (!font) throw new Error('Geist Latin font asset not found')
const logo = assets.find((f) => /^astra-logo-.*\.png$/.test(f))
if (!logo) throw new Error('logo asset not found')
// The font (above-the-fold text) and the 6 KB logo (navigation) are the only preloads.
const preload = `<link rel="preload" href="/assets/${font}" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/${logo}" as="image" fetchpriority="high">`

// ---------------------------------------------------- 4. route → chunk preloading
const manifestPath = path.join(dist, '.vite', 'manifest.json')
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
const entryKey = Object.keys(manifest).find((k) => manifest[k].isEntry)
const closure = (key, seen = new Set()) => {
  if (!manifest[key] || seen.has(key)) return seen
  seen.add(key)
  for (const dep of manifest[key].imports ?? []) closure(dep, seen)
  return seen
}
const initial = closure(entryKey) // already part of the main bundle
const files = []
const fileIndex = (file) => {
  const i = files.indexOf(file)
  return i >= 0 ? i : files.push(file) - 1
}
const chunksFor = (src) => {
  if (!manifest[src]) throw new Error(`manifest: ${src} not found`)
  return [...closure(src)].filter((k) => !initial.has(k)).map((k) => fileIndex(manifest[k].file))
}
const PAGES = {
  '/': 'src/pages/Home/HomeSections.tsx',
  '/solutions': 'src/pages/Solutions/SolutionsPage.tsx',
  '/solutions/:slug': 'src/pages/Solutions/SolutionDetailPage.tsx',
  '/lab': 'src/pages/Lab/LabPage.tsx',
  '/lab/:slug': 'src/pages/Lab/DemoPage.tsx',
  '/industries': 'src/pages/Industries/IndustriesPage.tsx',
  '/about': 'src/pages/About/AboutPage.tsx',
  '/contact': 'src/pages/Contact/ContactPage.tsx',
}
const routes = Object.fromEntries(Object.entries(PAGES).map(([route, src]) => [route, chunksFor(src)]))
const demos = {}
for (const { slug, demoId } of shellModule.DEMO_SLUGS) {
  const src = Object.keys(manifest).find((k) => k.startsWith(`src/demos/${demoId}/`) && manifest[k].isDynamicEntry)
  if (!src) throw new Error(`demo entry for ${demoId} not found`)
  demos[slug] = chunksFor(src)
}
const routeChunks = `<script>window.ROUTE_CHUNKS=${JSON.stringify({ base: '/', files, routes, demos })}</script>`

// The map must exist before the bootstrap script reads it; the font preload goes right after.
// The route bootstrap (the second inline script; the theme script before it must stay first).
const bootstrap = '<script>\n;(function () {\nvar d = document.documentElement\ntry {\nvar q ='
if (!html.includes(bootstrap)) throw new Error('bootstrap script not found')
html = html.replace(bootstrap, `${routeChunks}\n${bootstrap}`)
html = html.replace('<link rel="icon"', `${preload}\n<link rel="icon"`)

fs.writeFileSync(htmlPath, html)
fs.rmSync(path.join(dist, '.vite'), { recursive: true, force: true })

const kb = (n) => `${(n / 1024).toFixed(1)} KB`
console.log(
  `prerender-shell: shell ${kb(shellHtml.length)}, css ${inlineCss ? 'inlined' : 'linked'}, font preload ${font}, ` +
    `${files.length} route chunks mapped → index.html ${kb(html.length)}`,
)
