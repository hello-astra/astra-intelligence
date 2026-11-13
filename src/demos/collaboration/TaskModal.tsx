import { useState, type FormEvent } from 'react'
import { MessageSquare, Save, Send, Trash2 } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Form'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/toast-context'
import type { CollabState, Priority, TaskStatus } from '@/types/collaboration'
import { formatRelative } from '@/utils/format'
import { addComment, createTask, deleteTask, PRIORITY_META, STATUS_META, STATUSES, updateTask } from './logic'

export type TaskModalTarget = { mode: 'edit'; taskId: string } | { mode: 'create'; status: TaskStatus; projectId: string | null } | null

interface Props {
  target: TaskModalTarget
  state: CollabState
  onClose: () => void
  onChange: (next: CollabState) => void
}

export function TaskModal({ target, state, onClose, onChange }: Props) {
  const task = target?.mode === 'edit' ? state.tasks.find((t) => t.id === target.taskId) : undefined
  const [confirmDelete, setConfirmDelete] = useState(false)
  const toast = useToast()
  const project = task ? state.projects.find((p) => p.id === task.projectId) : undefined

  return (
    <Modal
      open={target !== null && (target.mode === 'create' || Boolean(task))}
      onClose={() => {
        setConfirmDelete(false)
        onClose()
      }}
      variant="drawer"
      title={task ? `${task.key} · ${project?.name ?? ''}` : 'New task'}
      description={task ? `Created ${formatRelative(task.createdAt)} · updated ${formatRelative(task.updatedAt)}` : 'Tasks appear on the board immediately.'}
      footer={
        confirmDelete && task ? (
          <>
            <span className="mr-auto text-xs text-fg-2">Delete {task.key} permanently?</span>
            <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>
              Keep
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => {
                onChange(deleteTask(state, task.id))
                toast({ title: `${task.key} deleted`, tone: 'info' })
                setConfirmDelete(false)
                onClose()
              }}
            >
              Delete task
            </Button>
          </>
        ) : (
          <>
            {task && (
              <Button size="sm" variant="ghost" className="mr-auto text-red-300 hover:text-red-200" leftIcon={<Trash2 className="size-3.5" />} onClick={() => setConfirmDelete(true)}>
                Delete
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" type="submit" form="task-form" leftIcon={<Save className="size-3.5" />}>
              {task ? 'Save changes' : 'Create task'}
            </Button>
          </>
        )
      }
    >
      {target && (
        <TaskForm
          key={target.mode === 'edit' ? target.taskId : `new-${target.status}`}
          target={target}
          state={state}
          onSubmit={(next, message) => {
            onChange(next)
            toast({ title: message })
            onClose()
          }}
        />
      )}
      {task && <Comments state={state} taskId={task.id} onChange={onChange} />}
    </Modal>
  )
}

function TaskForm({ target, state, onSubmit }: { target: NonNullable<TaskModalTarget>; state: CollabState; onSubmit: (next: CollabState, message: string) => void }) {
  const task = target.mode === 'edit' ? state.tasks.find((t) => t.id === target.taskId) : undefined
  const workspaceProjects = state.projects.filter((p) => p.workspaceId === state.activeWorkspaceId)
  const [title, setTitle] = useState(task?.title ?? '')
  const [projectId, setProjectId] = useState(task?.projectId ?? (target.mode === 'create' && target.projectId ? target.projectId : workspaceProjects[0]?.id ?? ''))
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? (target.mode === 'create' ? target.status : 'todo'))
  const [priority, setPriority] = useState<Priority>(task?.priority ?? 'medium')
  const [assigneeId, setAssigneeId] = useState<string>(task?.assigneeId ?? '')
  const [dueDate, setDueDate] = useState(task?.dueDate ?? '')
  const [tags, setTags] = useState(task?.tags.join(', ') ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [error, setError] = useState<string | null>(null)

  const project = state.projects.find((p) => p.id === projectId)
  const members = state.members.filter((m) => project?.memberIds.includes(m.id))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (title.trim().length < 3) return setError('Enter a task title (at least 3 characters).')
    const input = {
      projectId,
      title: title.trim(),
      status,
      priority,
      assigneeId: assigneeId || null,
      dueDate: dueDate || null,
      tags: tags
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 6),
      description: description.trim(),
    }
    if (task) onSubmit(updateTask(state, task.id, input), `${task.key} updated`)
    else {
      const created = createTask(state, input)
      onSubmit(created.state, `${created.task.key} created in ${project?.name}`)
    }
  }

  return (
    <form id="task-form" onSubmit={submit} noValidate className="grid gap-4">
      <Field label="Title" htmlFor="task-title" error={error} required>
        <Input
          id="task-title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            setError(null)
          }}
          placeholder="What needs to be done?"
          aria-invalid={Boolean(error)}
        />
      </Field>
      {!task && (
        <Field label="Project" htmlFor="task-project">
          <Select id="task-project" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            {workspaceProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.key} · {p.name}
              </option>
            ))}
          </Select>
        </Field>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Status" htmlFor="task-status">
          <Select id="task-status" value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_META[s].label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Priority" htmlFor="task-priority">
          <Select id="task-priority" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
            {(Object.keys(PRIORITY_META) as Priority[]).map((p) => (
              <option key={p} value={p}>
                {PRIORITY_META[p].label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Assignee" htmlFor="task-assignee">
          <Select id="task-assignee" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} — {m.role}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Deadline" htmlFor="task-due">
          <Input id="task-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </Field>
      </div>
      <Field label="Tags" htmlFor="task-tags" hint="Comma-separated, e.g. frontend, api">
        <Input id="task-tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="frontend, design" />
      </Field>
      <Field label="Description" htmlFor="task-desc">
        <Textarea id="task-desc" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Context, acceptance criteria, links…" />
      </Field>
    </form>
  )
}

function Comments({ state, taskId, onChange }: { state: CollabState; taskId: string; onChange: (next: CollabState) => void }) {
  const [text, setText] = useState('')
  const task = state.tasks.find((t) => t.id === taskId)
  if (!task) return null
  const me = state.members.find((m) => m.id === state.currentUserId)
  return (
    <section className="mt-6 border-t border-line pt-5" aria-labelledby="comments-title">
      <h3 id="comments-title" className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-fg-3 uppercase">
        <MessageSquare className="size-3.5" aria-hidden /> Comments ({task.comments.length})
      </h3>
      <ul className="mt-3 space-y-3">
        {task.comments.map((c) => {
          const author = state.members.find((m) => m.id === c.authorId)
          return (
            <li key={c.id} className="flex gap-2.5">
              <Avatar name={author?.name ?? 'Member'} size={26} />
              <div className="min-w-0 flex-1 rounded-lg bg-white/[0.03] px-3 py-2">
                <p className="text-[11px] text-fg-3">
                  <span className="font-medium text-fg-2">{author?.name}</span> · {formatRelative(c.at)}
                </p>
                <p className="mt-0.5 text-[13px] text-fg-2">{c.text}</p>
              </div>
            </li>
          )
        })}
        {task.comments.length === 0 && <li className="text-xs text-fg-3">No comments yet.</li>}
      </ul>
      <form
        className="mt-3 flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (!text.trim()) return
          onChange(addComment(state, taskId, text.trim()))
          setText('')
        }}
      >
        <Avatar name={me?.name ?? 'You'} size={26} />
        <Input controlSize="sm" value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a comment…" aria-label="Comment" />
        <Button size="sm" type="submit" variant="secondary" aria-label="Post comment" disabled={!text.trim()}>
          <Send className="size-3.5" />
        </Button>
      </form>
    </section>
  )
}
