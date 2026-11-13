import { Spinner } from '@/components/ui/Spinner'

export function PageLoader({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-live="polite">
      <div className="flex items-center gap-3 text-sm text-fg-3">
        <Spinner className="size-5 text-brand" />
        {label}…
      </div>
    </div>
  )
}
