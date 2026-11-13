import { useState } from 'react'
import { Building2, CalendarCheck, ClipboardList, LayoutDashboard, Network, Users, Wallet } from 'lucide-react'
import { useToast } from '@/components/ui/toast-context'
import { SOLUTION_BY_SLUG } from '@/data/constants/solutions'
import { createInitialErpState } from '@/data/mock/erp'
import { usePersistentState } from '@/hooks/usePersistentState'
import { DemoShell } from '../shared/DemoShell'
import type { DemoView } from '../shared/demo-context'
import type { ErpCtx, ErpView } from './context'
import { EmployeeDrawer } from './EmployeeDrawer'
import { poHealth } from './logic'
import { PoDetailModal } from './PoModals'
import { AttendanceView } from './views/AttendanceView'
import { DashboardView } from './views/DashboardView'
import { DepartmentsView } from './views/DepartmentsView'
import { EmployeesView } from './views/EmployeesView'
import { OrdersView } from './views/OrdersView'
import { PayrollView } from './views/PayrollView'
import { VendorsView } from './views/VendorsView'

const solution = SOLUTION_BY_SLUG['erp-automation']

export default function ErpDemo() {
  const toast = useToast()
  const [state, setState, reset] = usePersistentState('erp', createInitialErpState, 1)
  const [view, setView] = useState<ErpView>('dashboard')
  const [po, setPo] = useState<string | null>(null)
  const [employee, setEmployee] = useState<string | 'new' | null>(null)

  const late = state.purchaseOrders.filter((p) => poHealth(p) === 'late').length
  const drafts = state.purchaseOrders.filter((p) => p.status === 'draft').length
  const views: DemoView<ErpView>[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'employees', label: 'Employees', icon: Users, badge: state.employees.length },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
    { id: 'payroll', label: 'Payroll', icon: Wallet },
    { id: 'departments', label: 'Departments', icon: Network },
    { id: 'orders', label: 'Purchase orders', icon: ClipboardList, badge: late + drafts || undefined },
    { id: 'vendors', label: 'Vendors', icon: Building2 },
  ]

  const ctx: ErpCtx = { state, setState, goTo: setView, openPo: setPo, openEmployee: setEmployee }

  return (
    <DemoShell
      solution={solution}
      views={views}
      activeView={view}
      onViewChange={setView}
      onReset={() => {
        reset()
        setPo(null)
        setEmployee(null)
        setView('dashboard')
      }}
    >
      {view === 'dashboard' && <DashboardView {...ctx} />}
      {view === 'employees' && <EmployeesView {...ctx} />}
      {view === 'attendance' && <AttendanceView {...ctx} />}
      {view === 'payroll' && <PayrollView {...ctx} />}
      {view === 'departments' && <DepartmentsView {...ctx} />}
      {view === 'orders' && <OrdersView {...ctx} />}
      {view === 'vendors' && <VendorsView {...ctx} />}
      <PoDetailModal poId={po} state={state} onClose={() => setPo(null)} onChange={setState} />
      <EmployeeDrawer
        target={employee}
        state={state}
        onClose={() => setEmployee(null)}
        onSave={(next, message) => {
          setState(next)
          setEmployee(null)
          toast({ title: message })
        }}
      />
      <p className="mt-4 text-[11px] text-fg-4">Sample company and employees. Payroll and shipments are simulated — no payments, bank files or carrier bookings are created.</p>
    </DemoShell>
  )
}
