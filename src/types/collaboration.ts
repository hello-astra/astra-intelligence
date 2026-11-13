export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done'
export type Priority = 'low' | 'medium' | 'high' | 'urgent'

export interface Member {
  id: string
  name: string
  role: string
  email: string
  /** Comfortable number of open tasks. */
  capacity: number
}

export interface Workspace {
  id: string
  name: string
  description: string
}

export interface Project {
  id: string
  workspaceId: string
  key: string
  name: string
  description: string
  color: string
  memberIds: string[]
  startDate: string
  dueDate: string
  status: 'active' | 'on_hold' | 'completed'
}

export interface TaskComment {
  id: string
  authorId: string
  text: string
  at: string
}

export interface Task {
  id: string
  key: string
  projectId: string
  title: string
  description: string
  status: TaskStatus
  priority: Priority
  assigneeId: string | null
  dueDate: string | null
  tags: string[]
  createdAt: string
  updatedAt: string
  comments: TaskComment[]
}

export interface Activity {
  id: string
  at: string
  actorId: string
  projectId: string
  taskId?: string
  text: string
}

export interface SharedDoc {
  id: string
  projectId: string
  title: string
  kind: 'Spec' | 'Notes' | 'Decision' | 'Brief'
  content: string
  authorId: string
  updatedAt: string
}

export interface CollabState {
  workspaces: Workspace[]
  activeWorkspaceId: string
  projects: Project[]
  members: Member[]
  tasks: Task[]
  activity: Activity[]
  docs: SharedDoc[]
  currentUserId: string
}
