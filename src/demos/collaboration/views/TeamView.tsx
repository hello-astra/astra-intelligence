import { ListFilter, TriangleAlert } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Meter, SegmentedBar } from '@/components/ui/Meter'
import type { CollabCtx } from '../context'
import { dueState, STATUS_META, STATUSES } from '../logic'

export function TeamView({ state, setFilters, goTo }: CollabCtx) {
  const projectIds = new Set(state.projects.filter((p) => p.workspaceId === state.activeWorkspaceId).map((p) => p.id))
  const members = state.members.filter((m) => state.projects.some((p) => projectIds.has(p.id) && p.memberIds.includes(m.id)))

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-fg">Team & workload</h2>
        <p className="text-xs text-fg-3">Open tasks against each person’s comfortable capacity, across this workspace.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
        {members.map((m) => {
          const tasks = state.tasks.filter((t) => t.assigneeId === m.id && projectIds.has(t.projectId))
          const open = tasks.filter((t) => t.status !== 'done')
          const overdue = tasks.filter((t) => dueState(t) === 'overdue').length
          const load = open.length / m.capacity
          return (
            <article key={m.id} className="rounded-xl border border-line bg-panel p-4">
              <div className="flex items-center gap-3">
                <Avatar name={m.name} size={38} />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-fg">
                    {m.name}
                    {m.id === state.currentUserId && <span className="ml-1.5 text-xs font-normal text-fg-3">(you)</span>}
                  </h3>
                  <p className="truncate text-xs text-fg-3">{m.role}</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="mb-1.5 flex justify-between text-xs">
                  <span className="text-fg-2">Workload</span>
                  <span className={load > 1 ? 'font-medium text-red-300' : load >= 0.8 ? 'text-amber-200' : 'text-fg-3'}>
                    {open.length} open / {m.capacity} capacity
                  </span>
                </div>
                <Meter value={open.length} max={m.capacity} tone="auto" thresholds={[0.8, 1.0001]} label={`${m.name} workload`} />
              </div>
              <div className="mt-4">
                <SegmentedBar height={6} parts={STATUSES.map((s) => ({ label: STATUS_META[s].label, value: tasks.filter((t) => t.status === s).length, color: STATUS_META[s].color }))} />
                <p className="mt-1.5 text-[11px] text-fg-4">
                  {STATUSES.map((s) => `${STATUS_META[s].label} ${tasks.filter((t) => t.status === s).length}`).join(' · ')}
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                {overdue > 0 ? (
                  <span className="flex items-center gap-1 text-[11px] text-red-300">
                    <TriangleAlert className="size-3" aria-hidden /> {overdue} overdue
                  </span>
                ) : (
                  <span className="text-[11px] text-fg-4">On schedule</span>
                )}
                <Button
                  size="xs"
                  variant="secondary"
                  leftIcon={<ListFilter className="size-3" />}
                  onClick={() => {
                    setFilters({ memberId: m.id, projectId: 'all', priority: 'all', query: '' })
                    goTo('board')
                  }}
                >
                  View tasks
                </Button>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
