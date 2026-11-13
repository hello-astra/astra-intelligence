import { useDeferredValue, useMemo, useState } from 'react'
import { ListTodo } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { Panel } from '@/components/ui/Panel'
import { SortableTH, Table, TBody, TD, TH, THead, TR, type SortDirection } from '@/components/ui/Table'
import type { Priority, Task, TaskStatus } from '@/types/collaboration'
import { cn } from '@/utils/cn'
import type { CollabCtx } from '../context'
import { dueState, PRIORITY_META, STATUS_META, STATUSES, updateTask, visibleTasks } from '../logic'
import { TaskFilterBar } from '../TaskFilterBar'

type SortKey = 'key' | 'title' | 'status' | 'priority' | 'dueDate'

export function ListView(ctx: CollabCtx) {
  const { state, setState, filters, openTask } = ctx
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all' | 'open'>('open')
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDirection }>({ key: 'dueDate', dir: 'asc' })

  const deferredFilters = useDeferredValue(filters)
  const rows = useMemo(() => {
    const list = visibleTasks(state, deferredFilters).filter((t) => (statusFilter === 'all' ? true : statusFilter === 'open' ? t.status !== 'done' : t.status === statusFilter))
    const value = (t: Task): string | number =>
      sort.key === 'priority' ? PRIORITY_META[t.priority].rank : sort.key === 'status' ? STATUSES.indexOf(t.status) : sort.key === 'dueDate' ? (t.dueDate ?? '9999') : t[sort.key]
    return [...list].sort((a, b) => {
      const va = value(a)
      const vb = value(b)
      const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb), undefined, { numeric: true })
      return sort.dir === 'asc' ? cmp : -cmp
    })
  }, [state, deferredFilters, statusFilter, sort])

  const toggle = (key: SortKey) => setSort((s) => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }))
  const patch = (id: string, p: Partial<Task>) => setState((s) => updateTask(s, id, p))
  const selectCls = 'h-7 rounded-md border border-line bg-raised px-1.5 text-xs text-fg outline-none focus:border-brand/70'

  return (
    <div>
      <TaskFilterBar
        {...ctx}
        extra={
          <select aria-label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'all' | 'open')} className={cn(selectCls, 'h-8')}>
            <option value="open">Open tasks</option>
            <option value="all">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_META[s].label}
              </option>
            ))}
          </select>
        }
      />
      <Panel flush>
        {rows.length === 0 ? (
          <EmptyState icon={ListTodo} title="No tasks match" description="Adjust the filters or create a new task." />
        ) : (
          <Table minWidth={900}>
            <THead>
              <tr>
                <SortableTH label="Key" active={sort.key === 'key'} direction={sort.dir} onSort={() => toggle('key')} />
                <SortableTH label="Task" active={sort.key === 'title'} direction={sort.dir} onSort={() => toggle('title')} />
                <TH>Assignee</TH>
                <SortableTH label="Status" active={sort.key === 'status'} direction={sort.dir} onSort={() => toggle('status')} />
                <SortableTH label="Priority" active={sort.key === 'priority'} direction={sort.dir} onSort={() => toggle('priority')} />
                <SortableTH label="Deadline" active={sort.key === 'dueDate'} direction={sort.dir} onSort={() => toggle('dueDate')} />
              </tr>
            </THead>
            <TBody>
              {rows.map((t) => {
                const project = state.projects.find((p) => p.id === t.projectId)
                const assignee = state.members.find((m) => m.id === t.assigneeId)
                const due = dueState(t)
                return (
                  <TR key={t.id}>
                    <TD className="font-mono text-xs whitespace-nowrap">
                      <span className="mr-1.5 inline-block size-1.5 rounded-full" style={{ backgroundColor: project?.color }} aria-hidden />
                      {t.key}
                    </TD>
                    <TD>
                      <button type="button" onClick={() => openTask(t.id)} className="text-left font-medium text-fg hover:text-brand-soft">
                        {t.title}
                      </button>
                      <span className="block text-[11px] text-fg-4">{project?.name}</span>
                    </TD>
                    <TD>
                      <span className="flex items-center gap-2">
                        {assignee ? <Avatar name={assignee.name} size={22} /> : null}
                        <span className="text-xs">{assignee?.name ?? 'Unassigned'}</span>
                      </span>
                    </TD>
                    <TD>
                      <select aria-label={`Status of ${t.key}`} value={t.status} onChange={(e) => patch(t.id, { status: e.target.value as TaskStatus })} className={selectCls}>
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {STATUS_META[s].label}
                          </option>
                        ))}
                      </select>
                    </TD>
                    <TD>
                      <select aria-label={`Priority of ${t.key}`} value={t.priority} onChange={(e) => patch(t.id, { priority: e.target.value as Priority })} className={selectCls}>
                        {(Object.keys(PRIORITY_META) as Priority[]).map((p) => (
                          <option key={p} value={p}>
                            {PRIORITY_META[p].label}
                          </option>
                        ))}
                      </select>
                    </TD>
                    <TD>
                      <input
                        type="date"
                        aria-label={`Deadline of ${t.key}`}
                        value={t.dueDate ?? ''}
                        onChange={(e) => patch(t.id, { dueDate: e.target.value || null })}
                        className={cn(selectCls, due === 'overdue' && 'border-red-400/50 text-red-300', due === 'soon' && 'border-amber-400/40 text-amber-200')}
                      />
                    </TD>
                  </TR>
                )
              })}
            </TBody>
          </Table>
        )}
      </Panel>
    </div>
  )
}
