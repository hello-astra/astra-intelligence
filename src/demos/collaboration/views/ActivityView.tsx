import { useState } from 'react'
import { CalendarClock, TriangleAlert } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Select } from '@/components/ui/Form'
import { Panel } from '@/components/ui/Panel'
import { addDays, diffInDays, fromISODate, startOfDay, toISODate } from '@/utils/dates'
import { formatDate, formatRelative, formatTime, formatWeekday } from '@/utils/format'
import type { CollabCtx } from '../context'
import { dueState, PRIORITY_META } from '../logic'
import { Badge } from '@/components/ui/Badge'

function dayLabel(iso: string): string {
  const diff = diffInDays(new Date(iso), startOfDay())
  if (diff === 0) return 'Today'
  if (diff === -1) return 'Yesterday'
  return formatDate(iso)
}

export function ActivityView({ state, openTask }: CollabCtx) {
  const [projectId, setProjectId] = useState<string>('all')
  const projects = state.projects.filter((p) => p.workspaceId === state.activeWorkspaceId)
  const ids = new Set(projects.map((p) => p.id))

  const items = state.activity.filter((a) => ids.has(a.projectId) && (projectId === 'all' || a.projectId === projectId))
  const byDay = new Map<string, typeof items>()
  for (const a of items) {
    const k = dayLabel(a.at)
    byDay.set(k, [...(byDay.get(k) ?? []), a])
  }
  const groups = [...byDay.entries()]

  const today = startOfDay()
  const horizon = toISODate(addDays(today, 14))
  const tasks = state.tasks.filter((t) => ids.has(t.projectId) && (projectId === 'all' || t.projectId === projectId) && t.status !== 'done' && t.dueDate)
  const overdue = tasks.filter((t) => dueState(t) === 'overdue').sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''))
  const upcoming = tasks.filter((t) => dueState(t) !== 'overdue' && (t.dueDate ?? '') <= horizon).sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''))
  const byDate = new Map<string, typeof upcoming>()
  for (const t of upcoming) byDate.set(t.dueDate as string, [...(byDate.get(t.dueDate as string) ?? []), t])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-fg">Activity & deadlines</h2>
          <p className="text-xs text-fg-3">Everything that changed, and what’s due in the next 14 days.</p>
        </div>
        <Select controlSize="sm" aria-label="Filter by project" value={projectId} onChange={(e) => setProjectId(e.target.value)} wrapperClassName="w-52">
          <option value="all">All projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.key} · {p.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Panel title="Activity timeline">
          {groups.length === 0 && <p className="text-sm text-fg-3">No activity yet.</p>}
          <div className="space-y-5">
            {groups.map(([label, items]) => (
              <section key={label}>
                <h3 className="text-[11px] font-semibold tracking-wide text-fg-3 uppercase">{label}</h3>
                <ol className="mt-2.5 space-y-3 border-l border-line pl-4">
                  {items.map((a) => {
                    const actor = state.members.find((m) => m.id === a.actorId)
                    const project = state.projects.find((p) => p.id === a.projectId)
                    return (
                      <li key={a.id} className="relative">
                        <span className="absolute top-1.5 -left-[21px] size-2.5 rounded-full ring-4 ring-panel" style={{ backgroundColor: project?.color }} aria-hidden />
                        <div className="flex items-start gap-2.5">
                          <Avatar name={actor?.name ?? 'Member'} size={24} />
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] text-fg-2">
                              <span className="font-medium text-fg">{actor?.id === state.currentUserId ? 'You' : actor?.name}</span>{' '}
                              {a.taskId && state.tasks.some((t) => t.id === a.taskId) ? (
                                <button type="button" onClick={() => a.taskId && openTask(a.taskId)} className="text-left hover:text-brand-soft">
                                  {a.text}
                                </button>
                              ) : (
                                a.text
                              )}
                            </p>
                            <p className="text-[11px] text-fg-4">
                              {formatTime(a.at)} · {project?.name} · {formatRelative(a.at)}
                            </p>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ol>
              </section>
            ))}
          </div>
        </Panel>
        <div className="space-y-4">
          <Panel title="Overdue" description={overdue.length ? `${overdue.length} task${overdue.length === 1 ? '' : 's'} past deadline` : 'Nothing overdue'}>
            <ul className="space-y-2">
              {overdue.map((t) => (
                <li key={t.id}>
                  <button type="button" onClick={() => openTask(t.id)} className="flex w-full items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/[0.06] px-2.5 py-2 text-left hover:bg-red-500/10">
                    <TriangleAlert className="size-3.5 shrink-0 text-red-300" aria-hidden />
                    <span className="min-w-0 flex-1 truncate text-xs text-fg-2">
                      <span className="font-mono text-fg-3">{t.key}</span> {t.title}
                    </span>
                    <span className="shrink-0 text-[11px] text-red-300">{-diffInDays(fromISODate(t.dueDate as string), today)} d late</span>
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Upcoming deadlines" description="Next 14 days">
            {byDate.size === 0 && <p className="text-sm text-fg-3">No deadlines in the next two weeks.</p>}
            <ol className="space-y-3">
              {[...byDate.entries()].map(([date, items]) => (
                <li key={date}>
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold text-fg-3">
                    <CalendarClock className="size-3" aria-hidden /> {formatWeekday(date)}, {formatDate(date)}
                    {date === toISODate(today) && <Badge tone="amber" size="xs">Today</Badge>}
                  </p>
                  <ul className="mt-1.5 space-y-1.5">
                    {items.map((t) => (
                      <li key={t.id}>
                        <button type="button" onClick={() => openTask(t.id)} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-white/[0.03]">
                          <Badge tone={PRIORITY_META[t.priority].tone} size="xs">
                            {PRIORITY_META[t.priority].label}
                          </Badge>
                          <span className="min-w-0 flex-1 truncate text-xs text-fg-2">{t.title}</span>
                          {t.assigneeId && <Avatar name={state.members.find((m) => m.id === t.assigneeId)?.name ?? ''} size={20} />}
                        </button>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </Panel>
        </div>
      </div>
    </div>
  )
}
