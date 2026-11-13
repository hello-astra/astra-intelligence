import { useState, type FormEvent } from 'react'
import { useToday } from '@/hooks/useToday'
import { Save } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select } from '@/components/ui/Form'
import { Modal } from '@/components/ui/Modal'
import type { Employee, EmployeeStatus, ErpState } from '@/types/erp'
import { toISODate } from '@/utils/dates'
import { formatDate, formatINR } from '@/utils/format'
import { nextSequentialId } from '@/utils/id'
import { attendanceRate, workingDays } from './logic'

const STATUSES: { value: EmployeeStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'probation', label: 'Probation' },
  { value: 'on_leave', label: 'On leave' },
  { value: 'notice', label: 'Notice period' },
]

interface Props {
  target: string | 'new' | null
  state: ErpState
  onClose: () => void
  onSave: (next: ErpState, message: string) => void
}

export function EmployeeDrawer({ target, state, onClose, onSave }: Props) {
  const employee = target && target !== 'new' ? state.employees.find((e) => e.id === target) : undefined
  return (
    <Modal
      open={target !== null}
      onClose={onClose}
      variant="drawer"
      title={employee ? employee.name : 'Add employee'}
      description={employee ? `${employee.id} · ${employee.designation}` : 'A new record is created in HR, attendance and payroll.'}
      leading={employee ? <Avatar name={employee.name} size={36} /> : undefined}
      footer={
        <>
          <Button size="sm" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" type="submit" form="employee-form" leftIcon={<Save className="size-3.5" />}>
            {employee ? 'Save changes' : 'Add employee'}
          </Button>
        </>
      }
    >
      {target !== null && <EmployeeForm key={target} employee={employee} state={state} onSave={onSave} />}
    </Modal>
  )
}

function EmployeeForm({ employee, state, onSave }: { employee?: Employee; state: ErpState; onSave: Props['onSave'] }) {
  const today = useToday()
  const [form, setForm] = useState(() => ({
    name: employee?.name ?? '',
    email: employee?.email ?? '',
    phone: employee?.phone ?? '',
    departmentId: employee?.departmentId ?? state.departments[0].id,
    designation: employee?.designation ?? '',
    ctc: employee ? String(employee.ctc) : '',
    joinDate: employee?.joinDate ?? toISODate(today),
    status: employee?.status ?? ('probation' as EmployeeStatus),
    location: employee?.location ?? 'Chakan plant',
    employmentType: employee?.employmentType ?? ('Full-time' as Employee['employmentType']),
  }))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (form.name.trim().length < 3) errs.name = 'Enter the full name.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) errs.email = 'Enter a valid email.'
    else if (state.employees.some((x) => x.email === form.email.trim().toLowerCase() && x.id !== employee?.id)) errs.email = 'Another employee uses this email.'
    if (form.designation.trim().length < 2) errs.designation = 'Enter a designation.'
    const ctc = Number(form.ctc)
    if (!Number.isFinite(ctc) || ctc < 1_20_000) errs.ctc = 'Annual CTC must be at least ₹1,20,000.'
    setErrors(errs)
    if (Object.keys(errs).length) return
    const dept = state.departments.find((d) => d.id === form.departmentId)
    const record: Employee = {
      id: employee?.id ?? nextSequentialId(state.employees.map((x) => x.id), 'EMP-', 1001),
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      departmentId: form.departmentId,
      designation: form.designation.trim(),
      ctc,
      joinDate: form.joinDate,
      status: form.status,
      location: form.location,
      employmentType: form.employmentType,
      managerId: employee?.managerId ?? dept?.headId,
    }
    const employees = employee ? state.employees.map((x) => (x.id === employee.id ? record : x)) : [...state.employees, record]
    onSave({ ...state, employees }, employee ? `${record.name} updated` : `${record.name} added as ${record.id}`)
  }

  const recentDays = Object.keys(state.attendance).sort().slice(-20)
  const rate = employee ? attendanceRate(state, [employee.id], recentDays) : null
  const month = toISODate(today).slice(0, 7)

  return (
    <div className="space-y-5">
      {employee && (
        <div className="grid grid-cols-3 gap-2">
          {[
            ['Joined', formatDate(employee.joinDate)],
            ['Attendance (20 d)', `${rate?.toFixed(0)}%`],
            ['Monthly gross', formatINR(employee.ctc / 12)],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl border border-line p-3">
              <p className="text-[11px] text-fg-3">{k}</p>
              <p className="mt-1 text-sm font-semibold text-fg">{v}</p>
            </div>
          ))}
        </div>
      )}
      <form id="employee-form" onSubmit={submit} noValidate className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" htmlFor="emp-name" error={errors.name} required>
            <Input id="emp-name" value={form.name} onChange={(e) => set('name', e.target.value)} aria-invalid={Boolean(errors.name)} />
          </Field>
          <Field label="Work email" htmlFor="emp-email" error={errors.email} required>
            <Input id="emp-email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="name@kestrel.example" aria-invalid={Boolean(errors.email)} />
          </Field>
          <Field label="Phone" htmlFor="emp-phone">
            <Input id="emp-phone" type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          </Field>
          <Field label="Department" htmlFor="emp-dept">
            <Select id="emp-dept" value={form.departmentId} onChange={(e) => set('departmentId', e.target.value)}>
              {state.departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Designation" htmlFor="emp-desig" error={errors.designation} required>
            <Input id="emp-desig" value={form.designation} onChange={(e) => set('designation', e.target.value)} aria-invalid={Boolean(errors.designation)} />
          </Field>
          <Field label="Annual CTC (₹)" htmlFor="emp-ctc" error={errors.ctc} required hint={Number(form.ctc) > 0 ? `${formatINR(Number(form.ctc) / 12)} per month` : undefined}>
            <Input id="emp-ctc" type="number" min={0} step={10000} value={form.ctc} onChange={(e) => set('ctc', e.target.value)} aria-invalid={Boolean(errors.ctc)} />
          </Field>
          <Field label="Joining date" htmlFor="emp-join">
            <Input id="emp-join" type="date" value={form.joinDate} onChange={(e) => set('joinDate', e.target.value)} />
          </Field>
          <Field label="Status" htmlFor="emp-status">
            <Select id="emp-status" value={form.status} onChange={(e) => set('status', e.target.value)}>
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Location" htmlFor="emp-loc">
            <Select id="emp-loc" value={form.location} onChange={(e) => set('location', e.target.value)}>
              <option>Chakan plant</option>
              <option>Pune (Baner office)</option>
              <option>Remote</option>
            </Select>
          </Field>
          <Field label="Employment type" htmlFor="emp-type">
            <Select id="emp-type" value={form.employmentType} onChange={(e) => set('employmentType', e.target.value)}>
              <option>Full-time</option>
              <option>Contract</option>
              <option>Intern</option>
            </Select>
          </Field>
        </div>
      </form>
      {employee && <p className="text-xs text-fg-4">Working days this month: {workingDays(month).length}. Payroll uses CTC and attendance automatically.</p>}
    </div>
  )
}
