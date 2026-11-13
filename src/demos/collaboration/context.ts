import type { Dispatch, SetStateAction } from 'react'
import type { CollabState, TaskStatus } from '@/types/collaboration'
import type { TaskFilters } from './logic'

export type CollabView = 'board' | 'list' | 'projects' | 'team' | 'activity' | 'docs'

export interface CollabCtx {
  state: CollabState
  setState: Dispatch<SetStateAction<CollabState>>
  filters: TaskFilters
  setFilters: (patch: Partial<TaskFilters>) => void
  openTask: (taskId: string) => void
  newTask: (status?: TaskStatus) => void
  goTo: (view: CollabView) => void
}
