import { CheckCircle2, PlugZap, TriangleAlert, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import type { IntegrationStatus } from '@/types/saas'

const MAP = {
  operational: { label: 'Operational', tone: 'green', icon: CheckCircle2 },
  degraded: { label: 'Degraded', tone: 'amber', icon: TriangleAlert },
  down: { label: 'Down', tone: 'red', icon: XCircle },
  disconnected: { label: 'Disconnected', tone: 'neutral', icon: PlugZap },
} as const

export function IntegrationStatusBadge({ status }: { status: IntegrationStatus }) {
  const s = MAP[status]
  const Icon = s.icon
  return (
    <Badge tone={s.tone} icon={<Icon className="size-3" aria-hidden />}>
      {s.label}
    </Badge>
  )
}
