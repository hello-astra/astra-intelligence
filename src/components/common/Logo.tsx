import { cn } from '@/utils/cn'
import logoUrl from '@/assets/astra-logo.png'

/**
 * The Astra mark: a 160×100 silver PNG (6 KB) drawn for dark backgrounds — `logo-mark`
 * renders it in graphite on light themes. `size` is the rendered height in px; explicit
 * width/height reserve its box before it loads (no layout shift).
 */
export function LogoMark({ size = 30, className }: { size?: number; className?: string }) {
  return (
    <img
      src={logoUrl}
      alt=""
      width={Math.round(size * 1.6)}
      height={size}
      decoding="async"
      draggable={false}
      className={cn('logo-mark shrink-0 object-contain', className)}
      style={{ height: size, width: Math.round(size * 1.6) }}
    />
  )
}

export function Logo({ className, size = 34 }: { className?: string; size?: number }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark size={size} />
      <span className="text-[15px] leading-none font-semibold tracking-tight text-fg">
        Astra <span className="font-normal text-fg-2">Intelligence</span>
      </span>
    </span>
  )
}
