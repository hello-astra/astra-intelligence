import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { Container } from './Container'
import { Eyebrow } from './SectionHeading'

interface PageHeroProps {
  eyebrow: string
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  aside?: ReactNode
  className?: string
}

export function PageHero({ eyebrow, title, description, children, aside, className }: PageHeroProps) {
  return (
    <section className={cn('relative pt-12 pb-12 sm:pt-16 sm:pb-16 lg:pt-20', className)}>
      <Container>
        <div className={cn('grid items-center gap-10', aside ? 'lg:grid-cols-[1.1fr_1fr]' : undefined)}>
          <div>
            <Eyebrow>{eyebrow}</Eyebrow>
            <h1 className="mt-5 max-w-4xl text-4xl leading-[1.06] font-semibold tracking-[-0.03em] text-balance text-fg sm:text-5xl lg:text-[3.5rem]">
              {title}
            </h1>
            {description && <div className="mt-5 max-w-2xl text-lg leading-relaxed text-pretty text-fg-2">{description}</div>}
            {children && <div className="mt-8">{children}</div>}
          </div>
          {aside && <div className="animate-enter">{aside}</div>}
        </div>
      </Container>
    </section>
  )
}
