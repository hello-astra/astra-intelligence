export type RouteSkeletonKind = 'page' | 'demo'

/** Which loading skeleton fits a URL: the full-screen demo frame, or a generic page header. */
export function routeSkeletonKind(pathname: string): RouteSkeletonKind {
  return /^\/lab\/[^/]+/.test(pathname) ? 'demo' : 'page'
}
