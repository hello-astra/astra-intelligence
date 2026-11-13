import { useState, type FormEvent } from 'react'
import { CalendarClock, FolderPlus, KanbanSquare, TriangleAlert } from 'lucide-react'
import { AvatarGroup } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Field, Input, Textarea } from '@/components/ui/Form'
import { SegmentedBar } from '@/components/ui/Meter'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/toast-context'
import type { CollabState, Project } from '@/types/collaboration'
import { cn } from '@/utils/cn'
import { diffInDays, fromISODate, isoDateFromToday, startOfDay } from '@/utils/dates'
import { formatDate } from '@/utils/format'
import { uid } from '@/utils/id'
import type { CollabCtx } from '../context'
import { logActivity, projectProgress, STATUS_META } from '../logic'

const COLORS = ['#4f86ff', '#8b74ff', '#2dd4bf', '#f59e0b', '#f472b6', '#38bdf8']

export function ProjectsView({ state, setState, setFilters, goTo }: CollabCtx) {
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const projects = state.projects.filter((p) => p.workspaceId === state.activeWorkspaceId)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-fg">Projects</h2>
          <p className="text-xs text-fg-3">{state.workspaces.find((w) => w.id === state.activeWorkspaceId)?.name}</p>
        </div>
        <Button size="sm" leftIcon={<FolderPlus className="size-3.5" />} onClick={() => setOpen(true)}>
          New project
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
        {projects.map((p) => {
          const prog = projectProgress(state, p.id)
          const daysLeft = diffInDays(fromISODate(p.dueDate), startOfDay())
          return (
            <article key={p.id} className="flex flex-col rounded-xl border border-line bg-panel p-4">
              <div className="flex items-start gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg font-mono text-[11px] font-semibold text-white" style={{ background: `linear-gradient(135deg, ${p.color}, ${p.color}99)` }}>
                  {p.key}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-fg">{p.name}</h3>
                  <p className="line-clamp-2 text-xs text-fg-3">{p.description}</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="mb-1.5 flex items-baseline justify-between text-xs">
                  <span className="text-fg-2">
                    {prog.done} of {prog.total} tasks done
                  </span>
                  <span className="text-sm font-semibold text-fg tabular-nums">{prog.pct}%</span>
                </div>
                <SegmentedBar parts={prog.counts.map((c) => ({ label: STATUS_META[c.status].label, value: c.count, color: STATUS_META[c.status].color }))} />
                <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                  {prog.counts.map((c) => (
                    <li key={c.status} className="flex items-center gap-1 text-[10px] text-fg-3">
                      <span className="size-1.5 rounded-full" style={{ backgroundColor: STATUS_META[c.status].color }} aria-hidden />
                      {STATUS_META[c.status].label} {c.count}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                <AvatarGroup names={state.members.filter((m) => p.memberIds.includes(m.id)).map((m) => m.name)} max={5} />
                <span className={cn('flex items-center gap-1 text-xs', daysLeft < 0 ? 'text-red-300' : daysLeft <= 14 ? 'text-amber-200' : 'text-fg-3')}>
                  <CalendarClock className="size-3.5" aria-hidden />
                  {daysLeft < 0 ? `${-daysLeft} d overdue` : `${daysLeft} d left`} · {formatDate(p.dueDate)}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                {prog.overdue > 0 ? (
                  <span className="flex items-center gap-1 text-[11px] text-red-300">
                    <TriangleAlert className="size-3" aria-hidden /> {prog.overdue} overdue task{prog.overdue === 1 ? '' : 's'}
                  </span>
                ) : (
                  <span className="text-[11px] text-fg-4">No overdue tasks</span>
                )}
                <Button
                  size="xs"
                  variant="secondary"
                  leftIcon={<KanbanSquare className="size-3" />}
                  onClick={() => {
                    setFilters({ projectId: p.id, memberId: 'all', priority: 'all', query: '' })
                    goTo('board')
                  }}
                >
                  Open board
                </Button>
              </div>
            </article>
          )
        })}
      </div>
      <NewProjectModal
        open={open}
        state={state}
        onClose={() => setOpen(false)}
        onCreate={(project) => {
          setState((s) => logActivity({ ...s, projects: [...s.projects, project] }, project.id, `created the project “${project.name}”`))
          setOpen(false)
          toast({ title: `Project ${project.key} created`, description: 'Open its board to start adding tasks.' })
        }}
      />
      <p className="text-[11px] text-fg-4">Stage colors step from dark (backlog) to light (done) because the workflow is ordered.</p>
    </div>
  )
}

function NewProjectModal({ open, state, onClose, onCreate }: { open: boolean; state: CollabState; onClose: () => void; onCreate: (p: Project) => void }) {
  const [name, setName] = useState('')
  const [key, setKey] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState(isoDateFromToday(45))
  const [memberIds, setMemberIds] = useState<string[]>([state.currentUserId])
  const [error, setError] = useState<string | null>(null)

  const autoKey = name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 3)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const k = (key || autoKey).toUpperCase()
    if (name.trim().length < 3) return setError('Enter a project name (3+ characters).')
    if (!/^[A-Z]{2,5}$/.test(k)) return setError('Project key must be 2–5 letters.')
    if (state.projects.some((p) => p.key === k)) return setError(`Key ${k} is already used by another project.`)
    onCreate({
      id: uid('p'),
      workspaceId: state.activeWorkspaceId,
      key: k,
      name: name.trim(),
      description: description.trim() || 'New project',
      color: COLORS[state.projects.length % COLORS.length],
      memberIds,
      startDate: isoDateFromToday(0),
      dueDate,
      status: 'active',
    })
    setName('')
    setKey('')
    setDescription('')
    setError(null)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New project"
      description="Projects group tasks, documents and people."
      footer={
        <>
          <Button size="sm" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" type="submit" form="project-form">
            Create project
          </Button>
        </>
      }
    >
      <form id="project-form" onSubmit={submit} noValidate className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_110px]">
          <Field label="Project name" htmlFor="proj-name" error={error} required>
            <Input id="proj-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Loyalty Programme" aria-invalid={Boolean(error)} />
          </Field>
          <Field label="Key" htmlFor="proj-key">
            <Input id="proj-key" value={key} onChange={(e) => setKey(e.target.value.toUpperCase().slice(0, 5))} placeholder={autoKey || 'KEY'} />
          </Field>
        </div>
        <Field label="Description" htmlFor="proj-desc">
          <Textarea id="proj-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <Field label="Target date" htmlFor="proj-due">
          <Input id="proj-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </Field>
        <fieldset>
          <legend className="text-[13px] font-medium text-fg-2">Team members</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {state.members.map((m) => (
              <label key={m.id} className="flex cursor-pointer items-center gap-2 rounded-lg border border-line px-2.5 py-2 text-xs text-fg-2 hover:bg-white/[0.03]">
                <input
                  type="checkbox"
                  className="accent-[#4f86ff]"
                  checked={memberIds.includes(m.id)}
                  onChange={() => setMemberIds((ids) => (ids.includes(m.id) ? ids.filter((x) => x !== m.id) : [...ids, m.id]))}
                />
                <span className="truncate">{m.name}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </form>
    </Modal>
  )
}
