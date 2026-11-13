import { useMemo, useState } from 'react'
import { Download, UserPlus, Users } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Select } from '@/components/ui/Form'
import { Panel } from '@/components/ui/Panel'
import { SearchInput } from '@/components/ui/SearchInput'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/Table'
import type { EmployeeStatus } from '@/types/erp'
import { dateStamp, downloadCSV } from '@/utils/export'
import { formatDate, formatINRCompact } from '@/utils/format'
import type { ErpCtx } from '../context'

const STATUS_BADGE: Record<EmployeeStatus, { label: string; tone: 'green' | 'blue' | 'violet' | 'amber' }> = {
  active: { label: 'Active', tone: 'green' },
  probation: { label: 'Probation', tone: 'blue' },
  on_leave: { label: 'On leave', tone: 'violet' },
  notice: { label: 'Notice period', tone: 'amber' },
}

export function EmployeesView({ state, openEmployee }: ErpCtx) {
  const [query, setQuery] = useState('')
  const [dept, setDept] = useState('all')
  const [status, setStatus] = useState<EmployeeStatus | 'all'>('all')
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return state.employees.filter(
      (e) =>
        (dept === 'all' || e.departmentId === dept) &&
        (status === 'all' || e.status === status) &&
        (!q || e.name.toLowerCase().includes(q) || e.id.toLowerCase().includes(q) || e.designation.toLowerCase().includes(q)),
    )
  }, [state.employees, query, dept, status])
  const deptName = (id: string) => state.departments.find((d) => d.id === id)?.name ?? '—'

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-fg">Employee directory</h2>
          <p className="text-xs text-fg-3">
            {state.employees.length} employees across {state.departments.length} departments
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<Download className="size-3.5" />}
            onClick={() =>
              downloadCSV(`employees-${dateStamp()}`, rows, [
                { key: 'id', label: 'Employee ID', value: (e) => e.id },
                { key: 'name', label: 'Name', value: (e) => e.name },
                { key: 'dept', label: 'Department', value: (e) => deptName(e.departmentId) },
                { key: 'designation', label: 'Designation', value: (e) => e.designation },
                { key: 'status', label: 'Status', value: (e) => e.status },
                { key: 'join', label: 'Joined', value: (e) => e.joinDate },
                { key: 'location', label: 'Location', value: (e) => e.location },
              ])
            }
          >
            Export
          </Button>
          <Button size="sm" leftIcon={<UserPlus className="size-3.5" />} onClick={() => openEmployee('new')}>
            Add employee
          </Button>
        </div>
      </div>
      <Panel flush>
        <div className="flex flex-wrap items-center gap-2 border-b border-line p-3">
          <SearchInput value={query} onChange={setQuery} placeholder="Name, ID or designation" className="w-full sm:w-60" />
          <Select controlSize="sm" aria-label="Department" value={dept} onChange={(e) => setDept(e.target.value)} wrapperClassName="w-44">
            <option value="all">All departments</option>
            {state.departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
          <Select controlSize="sm" aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value as EmployeeStatus | 'all')} wrapperClassName="w-40">
            <option value="all">Any status</option>
            {(Object.keys(STATUS_BADGE) as EmployeeStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_BADGE[s].label}
              </option>
            ))}
          </Select>
          <span className="ml-auto text-xs text-fg-3">{rows.length} shown</span>
        </div>
        {rows.length === 0 ? (
          <EmptyState icon={Users} title="No employees match" />
        ) : (
          <Table minWidth={860}>
            <THead>
              <tr>
                <TH>Employee</TH>
                <TH>Department</TH>
                <TH>Location</TH>
                <TH>Joined</TH>
                <TH align="right">Annual CTC</TH>
                <TH>Status</TH>
              </tr>
            </THead>
            <TBody>
              {rows.map((e) => (
                <TR key={e.id} className="cursor-pointer" onClick={() => openEmployee(e.id)}>
                  <TD>
                    <button type="button" className="flex items-center gap-2.5 text-left" aria-label={`Open ${e.name}`}>
                      <Avatar name={e.name} size={28} title="" />
                      <span>
                        <span className="block font-medium text-fg">{e.name}</span>
                        <span className="block text-[11px] text-fg-3">
                          {e.id} · {e.designation}
                        </span>
                      </span>
                    </button>
                  </TD>
                  <TD>{deptName(e.departmentId)}</TD>
                  <TD className="text-xs">{e.location}</TD>
                  <TD className="text-xs whitespace-nowrap">{formatDate(e.joinDate)}</TD>
                  <TD align="right">{formatINRCompact(e.ctc)}</TD>
                  <TD>
                    <Badge tone={STATUS_BADGE[e.status].tone}>{STATUS_BADGE[e.status].label}</Badge>
                    {e.employmentType !== 'Full-time' && <span className="ml-1.5 text-[11px] text-fg-4">{e.employmentType}</span>}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Panel>
    </div>
  )
}
