import { useState, type DragEvent, type FormEvent } from 'react'
import { ArrowRightLeft, CalendarClock, MessageSquare, Plus, TriangleAlert } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Dropdown } from '@/components/ui/Dropdown'
import { useToast } from '@/components/ui/toast-context'
import type { Task, TaskStatus } from '@/types/collaboration'
import { cn } from '@/utils/cn'
import { formatDateShort } from '@/utils/format'
import type { CollabCtx } from '../context'
import { createTask, dueState, PRIORITY_META, STATUS_META, STATUSES, updateTask, visibleTasks, WIP_LIMIT } from '../logic'
import { TaskFilterBar } from '../TaskFilterBar'

export function BoardView(ctx: CollabCtx) {
  const { state, setState, filters, openTask } = ctx
  const toast = useToast()
  const [over, setOver] = useState<TaskStatus | null>(null)
  const [adding, setAdding] = useState<TaskStatus | null>(null)
  const tasks = visibleTasks(state, filters)

  const move = (taskId: string, status: TaskStatus) => {
    const task = state.tasks.find((t) => t.id === taskId)
    if (!task || task.status === status) return
    setState((s) => updateTask(s, taskId, { status }))
    toast({ title: `${task.key} → ${STATUS_META[status].label}`, description: task.title, duration: 2500 })
  }

  const onDrop = (e: DragEvent, status: TaskStatus) => {
    e.preventDefault()
    setOver(null)
    const id = e.dataTransfer.getData('text/plain')
    if (id) move(id, status)
  }

  return (
    <div>
      <TaskFilterBar {...ctx} />
      <ul className="scrollbar-none -mx-1 flex gap-3 overflow-x-auto px-1 pb-2" aria-label="Kanban board">
        {STATUSES.map((status) => {
          const column = tasks
            .filter((t) => t.status === status)
            .sort((a, b) => PRIORITY_META[b.priority].rank - PRIORITY_META[a.priority].rank || (a.dueDate ?? '9').localeCompare(b.dueDate ?? '9'))
          const overLimit = status === 'in_progress' && column.length > WIP_LIMIT
          return (
            <li key={status} className="flex w-[272px] shrink-0" aria-label={`${STATUS_META[status].label}, ${column.length} tasks`}>
              {/* Drop zone for drag-and-drop; keyboard users move cards with each card's ⇄ menu. */}
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  e.dataTransfer.dropEffect = 'move'
                  if (over !== status) setOver(status)
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(null)
                }}
                onDrop={(e) => onDrop(e, status)}
                data-column={status}
                className={cn(
                  'flex w-full flex-col rounded-xl border bg-white/[0.02] transition-colors',
                  over === status ? 'border-brand/60 bg-brand/[0.06]' : 'border-line',
                )}
              >
                <header className="flex items-center gap-2 px-3 pt-3 pb-2">
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: STATUS_META[status].color }} aria-hidden />
                  <h3 className="text-[13px] font-semibold text-fg">{STATUS_META[status].label}</h3>
                  <span className="rounded-full bg-white/[0.06] px-1.5 text-[11px] text-fg-3 tabular-nums">{column.length}</span>
                  {status === 'in_progress' && (
                    <span className={cn('ml-auto flex items-center gap-1 text-[10px]', overLimit ? 'text-amber-300' : 'text-fg-4')} title="Work-in-progress limit">
                      {overLimit && <TriangleAlert className="size-3" aria-hidden />}
                      WIP {column.length}/{WIP_LIMIT}
                    </span>
                  )}
                </header>
                <div className="flex min-h-[120px] flex-1 flex-col gap-2 px-2 pb-2">
                  {column.map((t) => (
                    <TaskCard key={t.id} task={t} ctx={ctx} onOpen={() => openTask(t.id)} onMove={(s) => move(t.id, s)} />
                  ))}
                  {column.length === 0 && <p className="rounded-lg border border-dashed border-line px-3 py-4 text-center text-[11px] text-fg-4">Drop tasks here</p>}
                </div>
                {adding === status ? (
                  <QuickAdd
                    ctx={ctx}
                    status={status}
                    onDone={(title, projectId) => {
                      if (title) {
                        const created = createTask(state, { projectId, title, status, priority: 'medium', assigneeId: null, dueDate: null, tags: [], description: '' })
                        setState(created.state)
                        toast({ title: `${created.task.key} created`, description: title, duration: 2500 })
                      }
                      setAdding(null)
                    }}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setAdding(status)}
                    className="m-2 mt-0 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-fg-3 hover:bg-white/[0.04] hover:text-fg-2"
                  >
                    <Plus className="size-3.5" aria-hidden /> Add task
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>
      <p className="mt-2 text-[11px] text-fg-4">Drag cards between columns, or use the ⇄ menu on a card. Click a card to edit details, assignee, deadline and comments.</p>
    </div>
  )
}

function TaskCard({ task, ctx, onOpen, onMove }: { task: Task; ctx: CollabCtx; onOpen: () => void; onMove: (s: TaskStatus) => void }) {
  const { state } = ctx
  const project = state.projects.find((p) => p.id === task.projectId)
  const assignee = state.members.find((m) => m.id === task.assigneeId)
  const due = dueState(task)
  return (
    // Drag source only — the card's buttons and ⇄ menu provide the keyboard path.
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <article
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', task.id)
        e.dataTransfer.effectAllowed = 'move'
      }}
      data-task={task.key}
      className="group cursor-grab rounded-lg border border-line bg-[#0c1325] p-2.5 shadow-sm transition-colors hover:border-line-strong active:cursor-grabbing"
    >
      <div className="flex items-start gap-2">
        <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
          <span className="flex items-center gap-1.5 font-mono text-[10px] text-fg-3">
            <span className="size-1.5 rounded-full" style={{ backgroundColor: project?.color }} aria-hidden />
            {task.key}
          </span>
          <span className="mt-1 block text-[13px] leading-snug font-medium text-fg group-hover:text-brand-soft">{task.title}</span>
        </button>
        <Dropdown
          ariaLabel={`Move ${task.key}`}
          align="end"
          buttonClassName="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-fg-4 opacity-70 hover:bg-white/[0.06] hover:text-fg group-hover:opacity-100"
          buttonContent={<ArrowRightLeft className="size-3" />}
          header={<p className="text-[11px] text-fg-3">Move to</p>}
          items={STATUSES.map((s) => ({ id: s, label: STATUS_META[s].label, active: s === task.status, onSelect: () => onMove(s) }))}
          menuClassName="min-w-[160px]"
        />
      </div>
      {task.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {task.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="rounded bg-white/[0.05] px-1.5 py-px text-[10px] text-fg-3">
              {tag}
            </span>
          ))}
        </div>
      )}
      <div className="mt-2.5 flex items-center gap-1.5">
        <Badge tone={PRIORITY_META[task.priority].tone} size="xs">
          {PRIORITY_META[task.priority].label}
        </Badge>
        {task.dueDate && (
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded px-1 text-[10px]',
              due === 'overdue' ? 'bg-red-500/10 text-red-300' : due === 'soon' ? 'bg-amber-400/10 text-amber-200' : 'text-fg-3',
            )}
          >
            <CalendarClock className="size-3" aria-hidden />
            {due === 'overdue' ? 'Overdue · ' : ''}
            {formatDateShort(task.dueDate)}
          </span>
        )}
        {task.comments.length > 0 && (
          <span className="inline-flex items-center gap-0.5 text-[10px] text-fg-4">
            <MessageSquare className="size-3" aria-hidden /> {task.comments.length}
          </span>
        )}
        <span className="ml-auto">{assignee ? <Avatar name={assignee.name} size={22} /> : <span className="text-[10px] text-fg-4">Unassigned</span>}</span>
      </div>
    </article>
  )
}

function QuickAdd({ ctx, status, onDone }: { ctx: CollabCtx; status: TaskStatus; onDone: (title: string, projectId: string) => void }) {
  const { state, filters } = ctx
  const projects = state.projects.filter((p) => p.workspaceId === state.activeWorkspaceId)
  const [title, setTitle] = useState('')
  const [projectId, setProjectId] = useState(filters.projectId !== 'all' ? filters.projectId : projects[0]?.id ?? '')
  const submit = (e: FormEvent) => {
    e.preventDefault()
    onDone(title.trim().length >= 3 ? title.trim() : '', projectId)
  }
  return (
    <form onSubmit={submit} className="m-2 mt-0 space-y-1.5 rounded-lg border border-brand/40 bg-[#0c1325] p-2">
      <input
        // Shown in direct response to the user's "Add task" click, so focus moves with them.
        // oxlint-disable-next-line jsx-a11y/no-autofocus
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && onDone('', projectId)}
        placeholder={`New ${STATUS_META[status].label.toLowerCase()} task…`}
        aria-label="Task title"
        className="w-full bg-transparent text-[13px] text-fg placeholder:text-fg-3 focus:outline-none"
      />
      {filters.projectId === 'all' && (
        <select
          aria-label="Project for new task"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="h-6 w-full rounded border border-line bg-raised px-1 text-[11px] text-fg-2"
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.key} · {p.name}
            </option>
          ))}
        </select>
      )}
      <div className="flex justify-end gap-1.5">
        <button type="button" onClick={() => onDone('', projectId)} className="rounded px-2 py-0.5 text-[11px] text-fg-3 hover:text-fg">
          Cancel
        </button>
        <button type="submit" className="rounded bg-brand-strong px-2 py-0.5 text-[11px] font-medium text-white disabled:opacity-40" disabled={title.trim().length < 3}>
          Add
        </button>
      </div>
    </form>
  )
}
