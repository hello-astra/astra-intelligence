import { useCallback, useState } from 'react'
import { Activity, ChevronsUpDown, FileText, FolderKanban, KanbanSquare, List, Users } from 'lucide-react'
import { Dropdown } from '@/components/ui/Dropdown'
import { useToast } from '@/components/ui/toast-context'
import { SOLUTION_BY_SLUG } from '@/data/constants/solutions'
import { createInitialCollabState } from '@/data/mock/collaboration'
import { usePersistentState } from '@/hooks/usePersistentState'
import type { TaskStatus } from '@/types/collaboration'
import { DemoShell } from '../shared/DemoShell'
import type { DemoView } from '../shared/demo-context'
import type { CollabCtx, CollabView } from './context'
import { DEFAULT_FILTERS, dueState, type TaskFilters } from './logic'
import { TaskModal, type TaskModalTarget } from './TaskModal'
import { ActivityView } from './views/ActivityView'
import { BoardView } from './views/BoardView'
import { DocsView } from './views/DocsView'
import { ListView } from './views/ListView'
import { ProjectsView } from './views/ProjectsView'
import { TeamView } from './views/TeamView'

const solution = SOLUTION_BY_SLUG['collaborative-workspace']

export default function CollaborationDemo() {
  const toast = useToast()
  const [state, setState, reset] = usePersistentState('collaboration', createInitialCollabState, 1)
  const [view, setView] = useState<CollabView>('board')
  const [filters, setFiltersState] = useState<TaskFilters>(DEFAULT_FILTERS)
  const [modal, setModal] = useState<TaskModalTarget>(null)

  const setFilters = useCallback((patch: Partial<TaskFilters>) => setFiltersState((f) => ({ ...f, ...patch })), [])
  const workspace = state.workspaces.find((w) => w.id === state.activeWorkspaceId) ?? state.workspaces[0]
  const projectIds = new Set(state.projects.filter((p) => p.workspaceId === workspace.id).map((p) => p.id))
  const overdue = state.tasks.filter((t) => projectIds.has(t.projectId) && dueState(t) === 'overdue').length

  const views: DemoView<CollabView>[] = [
    { id: 'board', label: 'Board', icon: KanbanSquare },
    { id: 'list', label: 'List', icon: List },
    { id: 'projects', label: 'Projects', icon: FolderKanban, badge: projectIds.size },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'activity', label: 'Activity & deadlines', icon: Activity, badge: overdue || undefined },
    { id: 'docs', label: 'Documents', icon: FileText },
  ]

  const ctx: CollabCtx = {
    state,
    setState,
    filters,
    setFilters,
    openTask: (taskId) => setModal({ mode: 'edit', taskId }),
    newTask: (status: TaskStatus = 'todo') => setModal({ mode: 'create', status, projectId: filters.projectId === 'all' ? null : filters.projectId }),
    goTo: setView,
  }

  return (
    <DemoShell
      solution={solution}
      views={views}
      activeView={view}
      onViewChange={setView}
      onReset={() => {
        reset()
        setFiltersState(DEFAULT_FILTERS)
        setModal(null)
        setView('board')
      }}
      toolbar={
        <Dropdown
          ariaLabel="Switch workspace"
          align="end"
          buttonClassName="flex h-8 w-full items-center gap-2 rounded-lg bg-white/[0.05] px-2.5 text-left ring-1 ring-white/[0.08] hover:bg-white/[0.08] sm:w-auto"
          buttonContent={
            <>
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-fg sm:max-w-[220px]">{workspace.name}</span>
              <ChevronsUpDown className="size-3.5 shrink-0 text-fg-3" aria-hidden />
            </>
          }
          header={<p className="text-[11px] font-medium tracking-wide text-fg-3 uppercase">Workspaces</p>}
          items={state.workspaces.map((w) => ({
            id: w.id,
            label: w.name,
            description: w.description,
            active: w.id === workspace.id,
            onSelect: () => {
              if (w.id === workspace.id) return
              setState((s) => ({ ...s, activeWorkspaceId: w.id }))
              setFiltersState(DEFAULT_FILTERS)
              toast({ title: `Switched to ${w.name}`, tone: 'info' })
            },
          }))}
        />
      }
    >
      {view === 'board' && <BoardView {...ctx} />}
      {view === 'list' && <ListView {...ctx} />}
      {view === 'projects' && <ProjectsView {...ctx} />}
      {view === 'team' && <TeamView {...ctx} />}
      {view === 'activity' && <ActivityView {...ctx} />}
      {view === 'docs' && <DocsView {...ctx} />}
      <TaskModal target={modal} state={state} onClose={() => setModal(null)} onChange={setState} />
    </DemoShell>
  )
}
