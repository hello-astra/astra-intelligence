import { ArrowLeft, Compass, FlaskConical } from 'lucide-react'
import { Container } from '@/components/common/Container'
import { ButtonLink } from '@/components/ui/Button'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { paths } from '@/routes/paths'

export default function NotFoundPage() {
  useDocumentTitle('Page not found')
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-white/[0.04] ring-1 ring-white/10">
        <Compass className="size-7 text-brand-soft" aria-hidden />
      </span>
      <p className="mt-6 font-mono text-sm text-fg-3">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">This page is beyond our boundaries.</h1>
      <p className="mt-3 max-w-md text-fg-2">The page you’re looking for doesn’t exist or has moved.</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <ButtonLink to={paths.home} leftIcon={<ArrowLeft className="size-4" />}>
          Back to home
        </ButtonLink>
        <ButtonLink to={paths.lab} variant="secondary" leftIcon={<FlaskConical className="size-4" />}>
          Explore the Lab
        </ButtonLink>
      </div>
    </Container>
  )
}
