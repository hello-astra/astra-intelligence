export type EmployeeStatus = 'active' | 'on_leave' | 'probation' | 'notice'
export type AttendanceStatus = 'present' | 'wfh' | 'half_day' | 'leave' | 'absent'
export type ShipmentStatus = 'pending' | 'dispatched' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'delayed'
export type PoStatus = 'draft' | 'approved' | 'in_transit' | 'delivered' | 'cancelled'

export interface Department {
  id: string
  name: string
  headId: string
  /** Annual budget for people costs, INR. */
  budget: number
  kpiLabel: string
  kpiValue: number
  kpiTarget: number
}

export interface Employee {
  id: string
  name: string
  email: string
  phone: string
  departmentId: string
  designation: string
  joinDate: string
  status: EmployeeStatus
  /** Annual cost to company, INR. */
  ctc: number
  location: string
  employmentType: 'Full-time' | 'Contract' | 'Intern'
  managerId?: string
}

export interface PayrollLine {
  employeeId: string
  gross: number
  basic: number
  hra: number
  special: number
  lopDays: number
  lopAmount: number
  pf: number
  pt: number
  tds: number
  net: number
}

export interface PayrollRun {
  month: string
  status: 'draft' | 'processed'
  processedAt?: string
  employeeCount: number
  gross: number
  deductions: number
  net: number
}

export interface Vendor {
  id: string
  name: string
  category: 'Raw materials' | 'Electronic components' | 'Packaging' | 'Logistics' | 'Office supplies'
  contact: string
  email: string
  phone: string
  city: string
  rating: number
  onTimeRate: number
  status: 'active' | 'on_hold'
  paymentTerms: 'Net 15' | 'Net 30' | 'Net 45'
}

export interface ShipmentEvent {
  status: ShipmentStatus
  location: string
  at: string
  note?: string
}

export interface PurchaseOrder {
  id: string
  vendorId: string
  items: { name: string; qty: number; unit: string; unitPrice: number }[]
  total: number
  status: PoStatus
  createdAt: string
  expectedDate: string
  shipment: {
    carrier: string
    trackingNo: string
    status: ShipmentStatus
    events: ShipmentEvent[]
  }
}

export interface ErpState {
  company: string
  departments: Department[]
  employees: Employee[]
  /** attendance[YYYY-MM-DD][employeeId] */
  attendance: Record<string, Record<string, AttendanceStatus>>
  payrollRuns: PayrollRun[]
  vendors: Vendor[]
  purchaseOrders: PurchaseOrder[]
}
