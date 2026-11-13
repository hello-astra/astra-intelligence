import type { ReactNode } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Form'
import { SearchInput } from '@/components/ui/SearchInput'
import type { Priority } from '@/types/collaboration'
import type { CollabCtx } from './context'
import { DEFAULT_FILTERS, PRIORITY_META } from './logic'

export function TaskFilterBar({ state, filters, setFilters, newTask, extra }: CollabCtx & { extra?: ReactNode }) {
  const projects = state.projects.filter((p) => p.workspaceId === state.activeWorkspaceId)
  const active = filters.memberId !== 'all' || filters.priority !== 'all' || filters.query !== '' || filters.projectId !== 'all'
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-panel p-3">
      <Select controlSize="sm" aria-label="Project" value={filters.projectId} onChange={(e) => setFilters({ projectId: e.target.value })} wrapperClassName="w-48">
        <option value="all">All projects</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.key} · {p.name}
          </option>
        ))}
      </Select>
      <Select controlSize="sm" aria-label="Team member" value={filters.memberId} onChange={(e) => setFilters({ memberId: e.target.value })} wrapperClassName="w-44">
        <option value="all">Everyone</option>
        <option value={state.currentUserId}>My tasks</option>
        <option value="unassigned">Unassigned</option>
        {state.members
          .filter((m) => m.id !== state.currentUserId)
          .map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
      </Select>
      <Select controlSize="sm" aria-label="Priority" value={filters.priority} onChange={(e) => setFilters({ priority: e.target.value as Priority | 'all' })} wrapperClassName="w-36">
        <option value="all">Any priority</option>
        {(Object.keys(PRIORITY_META) as Priority[]).map((p) => (
          <option key={p} value={p}>
            {PRIORITY_META[p].label}
          </option>
        ))}
      </Select>
      <SearchInput value={filters.query} onChange={(query) => setFilters({ query })} placeholder="Search tasks or tags" className="w-full sm:w-52" />
      {active && (
        <Button size="sm" variant="ghost" leftIcon={<X className="size-3.5" />} onClick={() => setFilters(DEFAULT_FILTERS)}>
          Clear
        </Button>
      )}
      <div className="ml-auto flex items-center gap-2">
        {extra}
        <Button size="sm" leftIcon={<Plus className="size-3.5" />} onClick={() => newTask('todo')}>
          New task
        </Button>
      </div>
    </div>
  )
}
