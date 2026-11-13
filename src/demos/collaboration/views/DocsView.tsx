import { useState } from 'react'
import { FilePlus2, FileText, Pencil, Save } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Form'
import { Panel } from '@/components/ui/Panel'
import { useToast } from '@/components/ui/toast-context'
import type { SharedDoc } from '@/types/collaboration'
import { cn } from '@/utils/cn'
import { formatRelative } from '@/utils/format'
import { uid } from '@/utils/id'
import type { CollabCtx } from '../context'
import { logActivity } from '../logic'

const KIND_TONE = { Spec: 'blue', Notes: 'neutral', Decision: 'violet', Brief: 'amber' } as const

export function DocsView({ state, setState }: CollabCtx) {
  const toast = useToast()
  const projects = state.projects.filter((p) => p.workspaceId === state.activeWorkspaceId)
  const ids = new Set(projects.map((p) => p.id))
  const docs = state.docs.filter((d) => ids.has(d.projectId)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  const [selectedId, setSelectedId] = useState<string | null>(docs[0]?.id ?? null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({ title: '', content: '' })
  const selected = docs.find((d) => d.id === selectedId) ?? docs[0]

  const startEdit = (doc: SharedDoc) => {
    setDraft({ title: doc.title, content: doc.content })
    setEditing(true)
  }

  const save = () => {
    if (!selected) return
    const title = draft.title.trim() || 'Untitled document'
    setState((s) =>
      logActivity({ ...s, docs: s.docs.map((d) => (d.id === selected.id ? { ...d, title, content: draft.content, updatedAt: new Date().toISOString(), authorId: s.currentUserId } : d)) }, selected.projectId, `updated the document “${title}”`),
    )
    setEditing(false)
    toast({ title: 'Document saved', description: title })
  }

  const create = () => {
    const projectId = selected?.projectId ?? projects[0]?.id
    if (!projectId) return
    const id = uid('d')
    const title = 'Untitled document'
    setState((s) => {
      const doc: SharedDoc = { id, projectId, title, kind: 'Notes', content: '', authorId: s.currentUserId, updatedAt: new Date().toISOString() }
      return logActivity({ ...s, docs: [doc, ...s.docs] }, projectId, 'created a new document')
    })
    setSelectedId(id)
    setDraft({ title, content: '' })
    setEditing(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-fg">Shared documents</h2>
          <p className="text-xs text-fg-3">Specs, decisions and notes kept next to the work.</p>
        </div>
        <Button size="sm" leftIcon={<FilePlus2 className="size-3.5" />} onClick={create}>
          New document
        </Button>
      </div>
      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <Panel flush>
          <ul className="divide-y divide-line">
            {docs.map((d) => {
              const project = state.projects.find((p) => p.id === d.projectId)
              return (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(d.id)
                      setEditing(false)
                    }}
                    aria-current={selected?.id === d.id ? 'true' : undefined}
                    className={cn('flex w-full items-start gap-2.5 px-3.5 py-3 text-left transition-colors', selected?.id === d.id ? 'bg-ink/[0.05]' : 'hover:bg-ink/[0.02]')}
                  >
                    <FileText className="mt-0.5 size-4 shrink-0 text-fg-3" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-fg">{d.title}</span>
                      <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-fg-3">
                        <Badge tone={KIND_TONE[d.kind]} size="xs">
                          {d.kind}
                        </Badge>
                        {project?.key} · {formatRelative(d.updatedAt)}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </Panel>
        {selected ? (
          <Panel
            title={editing ? 'Editing document' : selected.title}
            description={`${state.projects.find((p) => p.id === selected.projectId)?.name} · last edited ${formatRelative(selected.updatedAt)}`}
            actions={
              editing ? (
                <>
                  <Button size="xs" variant="ghost" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                  <Button size="xs" leftIcon={<Save className="size-3" />} onClick={save}>
                    Save
                  </Button>
                </>
              ) : (
                <Button size="xs" variant="secondary" leftIcon={<Pencil className="size-3" />} onClick={() => startEdit(selected)}>
                  Edit
                </Button>
              )
            }
          >
            {editing ? (
              <div className="space-y-3">
                <Input value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} aria-label="Document title" />
                <Select
                  aria-label="Document type"
                  value={selected.kind}
                  onChange={(e) => setState((s) => ({ ...s, docs: s.docs.map((d) => (d.id === selected.id ? { ...d, kind: e.target.value as SharedDoc['kind'] } : d)) }))}
                  wrapperClassName="w-40"
                  controlSize="sm"
                >
                  {(['Spec', 'Notes', 'Decision', 'Brief'] as const).map((k) => (
                    <option key={k}>{k}</option>
                  ))}
                </Select>
                <Textarea rows={16} value={draft.content} onChange={(e) => setDraft((d) => ({ ...d, content: e.target.value }))} aria-label="Document content" className="font-mono text-[13px]" />
              </div>
            ) : (
              <article className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-fg-3">
                  <Avatar name={state.members.find((m) => m.id === selected.authorId)?.name ?? 'Member'} size={22} />
                  {state.members.find((m) => m.id === selected.authorId)?.name}
                  <Badge tone={KIND_TONE[selected.kind]} size="xs">
                    {selected.kind}
                  </Badge>
                </div>
                <div className="text-[14px] leading-relaxed whitespace-pre-wrap text-fg-2">{selected.content || 'This document is empty — select Edit to add content.'}</div>
              </article>
            )}
          </Panel>
        ) : (
          <Panel>
            <p className="text-sm text-fg-3">No documents in this workspace yet.</p>
          </Panel>
        )}
      </div>
    </div>
  )
}
