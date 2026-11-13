import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
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
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}>
            <Eyebrow>{eyebrow}</Eyebrow>
            <h1 className="mt-5 max-w-4xl text-4xl leading-[1.06] font-semibold tracking-[-0.03em] text-balance text-fg sm:text-5xl lg:text-[3.5rem]">
              {title}
            </h1>
            {description && <div className="mt-5 max-w-2xl text-lg leading-relaxed text-pretty text-fg-2">{description}</div>}
            {children && <div className="mt-8">{children}</div>}
          </motion.div>
          {aside && (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.1 }}>
              {aside}
            </motion.div>
          )}
        </div>
      </Container>
    </section>
  )
}
