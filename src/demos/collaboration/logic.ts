import type { Activity, CollabState, Priority, Task, TaskStatus } from '@/types/collaboration'
import { diffInDays, fromISODate, startOfDay } from '@/utils/dates'
import { uid } from '@/utils/id'

export const STATUSES: TaskStatus[] = ['backlog', 'todo', 'in_progress', 'review', 'done']

/** Workflow stages are ordered, so they share one hue stepping from dark (backlog) to light (done). */
export const STATUS_META: Record<TaskStatus, { label: string; color: string }> = {
  backlog: { label: 'Backlog', color: '#1c5cab' },
  todo: { label: 'To do', color: '#2a78d6' },
  in_progress: { label: 'In progress', color: '#5598e7' },
  review: { label: 'Review', color: '#86b6ef' },
  done: { label: 'Done', color: '#b7d3f6' },
}

export const PRIORITY_META: Record<Priority, { label: string; tone: 'neutral' | 'blue' | 'amber' | 'red'; rank: number }> = {
  low: { label: 'Low', tone: 'neutral', rank: 0 },
  medium: { label: 'Medium', tone: 'blue', rank: 1 },
  high: { label: 'High', tone: 'amber', rank: 2 },
  urgent: { label: 'Urgent', tone: 'red', rank: 3 },
}

export const WIP_LIMIT = 6

export function dueState(task: Pick<Task, 'dueDate' | 'status'>): 'none' | 'overdue' | 'soon' | 'ok' {
  if (!task.dueDate || task.status === 'done') return 'none'
  const days = diffInDays(fromISODate(task.dueDate), startOfDay())
  if (days < 0) return 'overdue'
  if (days <= 2) return 'soon'
  return 'ok'
}

export function logActivity(state: CollabState, projectId: string, text: string, taskId?: string): CollabState {
  const entry: Activity = { id: uid('act'), at: new Date().toISOString(), actorId: state.currentUserId, projectId, taskId, text }
  return { ...state, activity: [entry, ...state.activity].slice(0, 80) }
}

export function nextTaskKey(state: CollabState, projectId: string): string {
  const project = state.projects.find((p) => p.id === projectId)
  const prefix = `${project?.key ?? 'TSK'}-`
  const max = state.tasks.filter((t) => t.key.startsWith(prefix)).reduce((m, t) => Math.max(m, Number(t.key.slice(prefix.length)) || 0), 0)
  return `${prefix}${max + 1}`
}

export function createTask(state: CollabState, input: Pick<Task, 'projectId' | 'title' | 'status' | 'priority' | 'assigneeId' | 'dueDate' | 'tags' | 'description'>): { state: CollabState; task: Task } {
  const now = new Date().toISOString()
  const task: Task = { ...input, id: uid('t'), key: nextTaskKey(state, input.projectId), createdAt: now, updatedAt: now, comments: [] }
  const next = logActivity({ ...state, tasks: [task, ...state.tasks] }, task.projectId, `created ${task.key} “${task.title}”`, task.id)
  return { state: next, task }
}

/** Applies a patch and records a human-readable activity entry for each meaningful change. */
export function updateTask(state: CollabState, taskId: string, patch: Partial<Task>): CollabState {
  const before = state.tasks.find((t) => t.id === taskId)
  if (!before) return state
  const after: Task = { ...before, ...patch, updatedAt: new Date().toISOString() }
  let next: CollabState = { ...state, tasks: state.tasks.map((t) => (t.id === taskId ? after : t)) }
  const ref = `${after.key} “${after.title}”`
  const member = (id: string | null) => state.members.find((m) => m.id === id)?.name ?? 'Unassigned'
  if (patch.status && patch.status !== before.status)
    next = logActivity(next, after.projectId, patch.status === 'done' ? `completed ${ref}` : `moved ${ref} to ${STATUS_META[patch.status].label}`, taskId)
  if (patch.priority && patch.priority !== before.priority) next = logActivity(next, after.projectId, `changed the priority of ${ref} to ${PRIORITY_META[patch.priority].label}`, taskId)
  if (patch.assigneeId !== undefined && patch.assigneeId !== before.assigneeId) next = logActivity(next, after.projectId, `assigned ${ref} to ${member(patch.assigneeId)}`, taskId)
  if (patch.dueDate !== undefined && patch.dueDate !== before.dueDate) next = logActivity(next, after.projectId, `set the deadline of ${ref} to ${patch.dueDate ?? 'none'}`, taskId)
  if (patch.title && patch.title !== before.title) next = logActivity(next, after.projectId, `renamed ${before.key} to “${patch.title}”`, taskId)
  return next
}

export function deleteTask(state: CollabState, taskId: string): CollabState {
  const task = state.tasks.find((t) => t.id === taskId)
  if (!task) return state
  return logActivity({ ...state, tasks: state.tasks.filter((t) => t.id !== taskId) }, task.projectId, `deleted ${task.key} “${task.title}”`)
}

export function addComment(state: CollabState, taskId: string, text: string): CollabState {
  const task = state.tasks.find((t) => t.id === taskId)
  if (!task) return state
  const comment = { id: uid('c'), authorId: state.currentUserId, text, at: new Date().toISOString() }
  const next = { ...state, tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, comments: [...t.comments, comment], updatedAt: comment.at } : t)) }
  return logActivity(next, task.projectId, `commented on ${task.key} “${task.title}”`, taskId)
}

export function projectProgress(state: CollabState, projectId: string) {
  const tasks = state.tasks.filter((t) => t.projectId === projectId)
  const done = tasks.filter((t) => t.status === 'done').length
  const counts = STATUSES.map((s) => ({ status: s, count: tasks.filter((t) => t.status === s).length }))
  const overdue = tasks.filter((t) => dueState(t) === 'overdue').length
  return { total: tasks.length, done, pct: tasks.length ? Math.round((done / tasks.length) * 100) : 0, counts, overdue }
}

export interface TaskFilters {
  projectId: string | 'all'
  memberId: string | 'all' | 'unassigned'
  priority: Priority | 'all'
  query: string
}

export const DEFAULT_FILTERS: TaskFilters = { projectId: 'all', memberId: 'all', priority: 'all', query: '' }

export function visibleTasks(state: CollabState, f: TaskFilters): Task[] {
  const projectIds = new Set(state.projects.filter((p) => p.workspaceId === state.activeWorkspaceId).map((p) => p.id))
  const q = f.query.trim().toLowerCase()
  return state.tasks.filter(
    (t) =>
      projectIds.has(t.projectId) &&
      (f.projectId === 'all' || t.projectId === f.projectId) &&
      (f.memberId === 'all' || (f.memberId === 'unassigned' ? t.assigneeId === null : t.assigneeId === f.memberId)) &&
      (f.priority === 'all' || t.priority === f.priority) &&
      (!q || t.title.toLowerCase().includes(q) || t.key.toLowerCase().includes(q) || t.tags.some((tag) => tag.includes(q))),
  )
}
