import type { AttendanceStatus, Department, Employee, ErpState, PurchaseOrder, ShipmentEvent, ShipmentStatus, Vendor } from '@/types/erp'
import { addDays, addMonths, daysAgoISO, hoursAgo, isoDateFromToday, isWeekend, monthKey, startOfDay, startOfMonth, toISODate } from '@/utils/dates'
import { createRng, pick, randInt } from '@/utils/random'

export const ERP_COMPANY = 'Kestrel Components Pvt. Ltd. (sample company)'

const DEPARTMENTS: Omit<Department, 'headId'>[] = [
  { id: 'd_prod', name: 'Production', budget: 1_05_00_000, kpiLabel: 'Output vs plan', kpiValue: 96.4, kpiTarget: 95 },
  { id: 'd_qa', name: 'Quality', budget: 38_00_000, kpiLabel: 'First-pass yield', kpiValue: 97.8, kpiTarget: 98 },
  { id: 'd_scm', name: 'Supply Chain', budget: 42_00_000, kpiLabel: 'On-time PO delivery', kpiValue: 0, kpiTarget: 90 },
  { id: 'd_eng', name: 'Engineering', budget: 96_00_000, kpiLabel: 'Sprint commitment met', kpiValue: 88, kpiTarget: 85 },
  { id: 'd_sales', name: 'Sales', budget: 58_00_000, kpiLabel: 'Revenue vs target', kpiValue: 103.5, kpiTarget: 100 },
  { id: 'd_fin', name: 'Finance & HR', budget: 40_00_000, kpiLabel: 'Close completed on time', kpiValue: 100, kpiTarget: 100 },
  { id: 'd_admin', name: 'Administration', budget: 18_00_000, kpiLabel: 'Facility uptime', kpiValue: 99.2, kpiTarget: 99 },
]

type Seed = [name: string, designation: string, ctcLakh: number]

const PEOPLE: Record<string, Seed[]> = {
  d_prod: [
    ['Suresh Patil', 'Production Manager', 18],
    ['Manoj Kale', 'Shift Supervisor', 9.5],
    ['Ravi Shinde', 'Shift Supervisor', 9],
    ['Anita Jadhav', 'Line Operator', 4.2],
    ['Prakash More', 'Line Operator', 4.1],
    ['Sunita Pawar', 'Line Operator', 4.0],
    ['Ganesh Bhosale', 'Line Operator', 4.3],
    ['Vaishali Gaikwad', 'Line Operator', 3.9],
    ['Santosh Kadam', 'Machine Technician', 5.6],
    ['Deepak Salunke', 'Machine Technician', 5.4],
    ['Rekha Thorat', 'Assembly Technician', 4.6],
    ['Amol Chavan', 'Assembly Technician', 4.5],
    ['Kiran Lokhande', 'Maintenance Engineer', 7.2],
    ['Pooja Mane', 'Production Planner', 8.4],
  ],
  d_qa: [
    ['Meghna Kulkarni', 'Quality Manager', 16],
    ['Rohan Deshpande', 'QA Engineer', 8.8],
    ['Swati Joshi', 'QA Engineer', 8.2],
    ['Nilesh Sawant', 'Inspection Technician', 4.8],
    ['Priyanka Gokhale', 'Lab Analyst', 6.2],
  ],
  d_scm: [
    ['Ashwin Menon', 'Supply Chain Manager', 17],
    ['Farah Shaikh', 'Procurement Specialist', 9.6],
    ['Vikas Yadav', 'Logistics Coordinator', 7.4],
    ['Neha Bhatt', 'Inventory Controller', 7.0],
    ['Imran Pathan', 'Warehouse Lead', 5.8],
  ],
  d_eng: [
    ['Siddharth Rao', 'Engineering Manager', 32],
    ['Ankita Verma', 'Senior Hardware Engineer', 22],
    ['Rahul Nair', 'Firmware Engineer', 16],
    ['Tanvi Kapoor', 'PCB Design Engineer', 14],
    ['Arjun Iyer', 'Test Engineer', 11],
    ['Kavya Reddy', 'Graduate Engineer', 7.5],
  ],
  d_sales: [
    ['Vivek Malhotra', 'Head of Sales', 30],
    ['Simran Arora', 'Key Account Manager', 15],
    ['Karthik Subramanian', 'Sales Engineer', 12],
    ['Divya Pillai', 'Inside Sales Executive', 6.5],
    ['Aman Gill', 'Business Development Executive', 7.2],
  ],
  d_fin: [
    ['Lakshmi Narayanan', 'Finance Controller', 24],
    ['Ritu Agarwal', 'HR Business Partner', 12],
    ['Mohit Jain', 'Accountant', 7.8],
    ['Sneha Rane', 'Payroll Executive', 6.4],
  ],
  d_admin: [
    ['Ramesh Gupta', 'Admin Manager', 11],
    ['Shabana Khan', 'Front Office Executive', 4.2],
    ['Babu Rao', 'Facilities Technician', 4.0],
  ],
}

const ATTENDANCE_WEIGHTS: [AttendanceStatus, number][] = [
  ['present', 0.8],
  ['wfh', 0.07],
  ['half_day', 0.03],
  ['leave', 0.07],
  ['absent', 0.03],
]

function weighted(rng: () => number, officeRole: boolean): AttendanceStatus {
  let r = rng()
  for (const [s, w] of ATTENDANCE_WEIGHTS) {
    const weight = s === 'wfh' && !officeRole ? 0 : w
    if (r < weight) return s
    r -= weight
  }
  return 'present'
}

const VENDORS: Vendor[] = [
  { id: 'v1', name: 'Kestrel Metals & Alloys', category: 'Raw materials', contact: 'Hemant Bhide', email: 'sales@kestrelmetals.example', phone: '+91 20 4011 2200', city: 'Pune', rating: 4.4, onTimeRate: 92, status: 'active', paymentTerms: 'Net 30' },
  { id: 'v2', name: 'Sigma Electronic Components', category: 'Electronic components', contact: 'Ritika Sen', email: 'orders@sigmaec.example', phone: '+91 80 4123 9911', city: 'Bengaluru', rating: 4.7, onTimeRate: 95, status: 'active', paymentTerms: 'Net 45' },
  { id: 'v3', name: 'Shree Packaging Solutions', category: 'Packaging', contact: 'Mahesh Agarwal', email: 'info@shreepack.example', phone: '+91 22 2840 1155', city: 'Bhiwandi', rating: 3.9, onTimeRate: 81, status: 'active', paymentTerms: 'Net 15' },
  { id: 'v4', name: 'BlueRiver Logistics', category: 'Logistics', contact: 'Arvind Krishnan', email: 'ops@blueriver.example', phone: '+91 44 4555 0909', city: 'Chennai', rating: 4.1, onTimeRate: 88, status: 'active', paymentTerms: 'Net 30' },
  { id: 'v5', name: 'Precision PCB Fabricators', category: 'Electronic components', contact: 'Nisha Thomas', email: 'quotes@precisionpcb.example', phone: '+91 79 4002 7744', city: 'Ahmedabad', rating: 4.3, onTimeRate: 86, status: 'active', paymentTerms: 'Net 30' },
  { id: 'v6', name: 'OfficeHub Supplies', category: 'Office supplies', contact: 'Sameer Kulkarni', email: 'care@officehub.example', phone: '+91 20 6620 3030', city: 'Pune', rating: 3.6, onTimeRate: 74, status: 'on_hold', paymentTerms: 'Net 15' },
]

const CARRIERS = ['BlueRiver Logistics', 'SwiftShip Freight', 'Deccan Cargo']
const ROUTE = ['Supplier warehouse', 'Origin hub', 'In transit — highway', 'Pune distribution hub', 'Kestrel plant, Chakan']

export function shipmentEvents(status: ShipmentStatus, created: Date, vendorCity: string): ShipmentEvent[] {
  const steps: ShipmentStatus[] = ['pending', 'dispatched', 'in_transit', 'out_for_delivery', 'delivered']
  const target = status === 'delayed' ? 2 : steps.indexOf(status)
  const events: ShipmentEvent[] = []
  for (let i = 0; i <= target; i++) {
    events.push({
      status: steps[i],
      location: i === 0 ? `${vendorCity} — ${ROUTE[0]}` : i === 1 ? `${vendorCity} ${ROUTE[1].toLowerCase()}` : ROUTE[Math.min(i + 1, ROUTE.length - 1)],
      at: new Date(Math.min(Date.now() - 3_600_000, created.getTime() + i * 26 * 3_600_000)).toISOString(),
    })
  }
  if (status === 'delayed') events.push({ status: 'delayed', location: 'NH48 — Khandala ghat', at: hoursAgo(5), note: 'Heavy rain; revised ETA +2 days' })
  return events
}

export function createInitialErpState(): ErpState {
  const rng = createRng(808)
  const today = startOfDay()
  const employees: Employee[] = []
  let seq = 1001
  const departments: Department[] = []
  for (const dept of DEPARTMENTS) {
    const people = PEOPLE[dept.id]
    let headId = ''
    people.forEach(([name, designation, lakh], i) => {
      const id = `EMP-${seq++}`
      if (i === 0) headId = id
      const [first, last] = name.toLowerCase().split(' ')
      const officeRole = !['d_prod', 'd_admin'].includes(dept.id)
      const months = randInt(rng, 3, 84)
      employees.push({
        id,
        name,
        email: `${first}.${last}@kestrel.example`,
        phone: `+91 9${randInt(rng, 100000000, 999999999)}`.replace(/(\+91 \d{5})(\d{5})/, '$1 $2'),
        departmentId: dept.id,
        designation,
        joinDate: toISODate(addMonths(today, -months)),
        status: months < 6 ? 'probation' : 'active',
        ctc: lakh * 1_00_000,
        location: officeRole && rng() > 0.7 ? 'Pune (Baner office)' : 'Chakan plant',
        employmentType: designation === 'Graduate Engineer' ? 'Full-time' : dept.id === 'd_prod' && i > 8 && rng() > 0.6 ? 'Contract' : 'Full-time',
        managerId: i === 0 ? undefined : headId,
      })
    })
    departments.push({ ...dept, headId })
  }
  employees.find((e) => e.name === 'Kiran Lokhande')!.status = 'on_leave'
  employees.find((e) => e.name === 'Aman Gill')!.status = 'notice'

  // Attendance for the last 30 calendar days (weekdays only); today is partially marked.
  const attendance: ErpState['attendance'] = {}
  for (let d = 29; d >= 0; d--) {
    const date = addDays(today, -d)
    if (isWeekend(date)) continue
    const key = toISODate(date)
    attendance[key] = {}
    for (const e of employees) {
      if (d === 0 && rng() < 0.35) continue
      const officeRole = !['d_prod', 'd_admin'].includes(e.departmentId)
      attendance[key][e.id] = e.status === 'on_leave' && d < 8 ? 'leave' : weighted(rng, officeRole)
    }
  }

  // Purchase orders
  const poSeeds: [vendor: string, items: [string, number, string, number][], status: ShipmentStatus | 'draft' | 'cancelled', daysAgo: number, eta: number][] = [
    ['v2', [['MCU STM32F4 (reel of 500)', 4, 'reel', 1_42_000], ['MLCC capacitor kit', 20, 'kit', 3_400]], 'in_transit', 6, 2],
    ['v1', [['Aluminium enclosure blanks', 1200, 'pcs', 185], ['Copper busbar 20mm', 300, 'm', 620]], 'delayed', 8, 1],
    ['v5', [['6-layer PCB (panel)', 400, 'panel', 1_850]], 'out_for_delivery', 5, 0],
    ['v3', [['Corrugated cartons (medium)', 3000, 'pcs', 38], ['Anti-static bags', 5000, 'pcs', 6]], 'dispatched', 2, 4],
    ['v2', [['Power MOSFET (tray)', 60, 'tray', 9_800]], 'pending', 1, 7],
    ['v4', [['Outbound freight — November', 1, 'lot', 1_86_000]], 'delivered', 18, -12],
    ['v1', [['Steel fasteners assortment', 50, 'box', 2_150]], 'delivered', 24, -17],
    ['v5', [['Stencil + PCB prototype run', 1, 'lot', 64_000]], 'delivered', 33, -25],
    ['v3', [['Foam inserts (custom)', 2500, 'pcs', 22]], 'draft', 0, 10],
    ['v6', [['Printer toner & stationery', 1, 'lot', 18_500]], 'cancelled', 12, -2],
  ]
  const purchaseOrders: PurchaseOrder[] = poSeeds.map(([vendorId, items, status, ago, eta], i) => {
    const vendor = VENDORS.find((v) => v.id === vendorId) as Vendor
    const created = new Date(Date.now() - ago * 864e5 - 3 * 3_600_000)
    const shipStatus: ShipmentStatus = status === 'draft' || status === 'cancelled' ? 'pending' : status
    return {
      id: `PO-2026-${String(130 + i).padStart(4, '0')}`,
      vendorId,
      items: items.map(([name, qty, unit, unitPrice]) => ({ name, qty, unit, unitPrice })),
      total: items.reduce((s, [, q, , p]) => s + q * p, 0),
      status: status === 'draft' ? 'draft' : status === 'cancelled' ? 'cancelled' : status === 'delivered' ? 'delivered' : status === 'pending' ? 'approved' : 'in_transit',
      createdAt: created.toISOString(),
      expectedDate: isoDateFromToday(eta),
      shipment: {
        carrier: pick(rng, CARRIERS),
        trackingNo: `${['BR', 'SS', 'DC'][i % 3]}${randInt(rng, 10_000_000, 99_999_999)}`,
        status: shipStatus,
        events: status === 'draft' || status === 'cancelled' ? [] : shipmentEvents(shipStatus, created, vendor.city),
      },
    }
  })

  const thisMonth = startOfMonth(today)
  const payrollRuns = [3, 2, 1].map((m) => {
    const month = monthKey(addMonths(thisMonth, -m))
    const gross = employees.reduce((s, e) => s + e.ctc / 12, 0)
    return {
      month,
      status: 'processed' as const,
      processedAt: daysAgoISO(m * 30 - 28, 17),
      employeeCount: employees.length,
      gross: Math.round(gross * (0.985 + m * 0.002)),
      deductions: Math.round(gross * 0.118),
      net: Math.round(gross * (0.985 + m * 0.002) - gross * 0.118),
    }
  })

  return { company: ERP_COMPANY, departments, employees, attendance, payrollRuns, vendors: VENDORS, purchaseOrders }
}
