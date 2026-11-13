import { ruleBasedClassifier } from '@/services/ai/expenseClassifier'
import type { Category, LedgerState, Transaction, TxnMethod, TxnType } from '@/types/fintech'
import { addMonths, daysInMonth, isoDateFromToday, startOfDay, startOfMonth, toISODate } from '@/utils/dates'
import { formatMonthShort } from '@/utils/format'
import { createRng, pick, randInt } from '@/utils/random'

export const COMPANY = 'Orbit Labs Pvt. Ltd. (sample company)'

interface Line {
  day: number
  description: string
  merchant: string
  amount: number
  type: TxnType
  category: Category
  method: TxnMethod
}

function monthLines(monthStart: Date, rng: () => number, isCurrent: boolean): Line[] {
  const mon = formatMonthShort(addMonths(monthStart, -1)).toUpperCase()
  const lines: Line[] = []
  const add = (day: number, description: string, merchant: string, amount: number, type: TxnType, category: Category, method: TxnMethod) =>
    lines.push({ day, description, merchant, amount: Math.round(amount), type, category, method })

  // Income
  const clients = ['ACME TECHNOLOGIES', 'NOVA RETAIL', 'VERTEX SOLUTIONS', 'ORBIT HEALTH']
  clients.slice(0, 3 + (rng() > 0.5 ? 1 : 0)).forEach((c, i) => add(4 + i * 7, `NEFT CR ${c} INV-${2600 + randInt(rng, 10, 99)}`, titleCase(c), 6_00_000 + rng() * 7_50_000, 'income', 'Client payments', 'Bank transfer'))
  for (let w = 0; w < 4; w++) add(6 + w * 7, 'RAZORPAY SETTLEMENT SUBSCRIPTIONS', 'Razorpay', 1_60_000 + rng() * 80_000, 'income', 'Subscriptions', 'Bank transfer')
  add(28, 'INTEREST CREDIT SAVINGS', 'Bank interest', 4_000 + rng() * 2_000, 'income', 'Other income', 'Bank transfer')

  // Fixed monthly costs
  add(1, `SALARY PAYOUT ${mon} - RAZORPAYX PAYROLL`, 'Payroll', 21_40_000 + rng() * 20_000, 'expense', 'Salaries', 'Bank transfer')
  add(2, 'NACH DR WEWORK INDIA MGMT', 'WeWork', 1_10_000, 'expense', 'Office', 'Auto-debit')
  add(3, 'ACH D- AWS INDIA PVT LTD', 'AWS', 1_45_000 + rng() * 35_000, 'expense', 'Software', 'Auto-debit')
  add(5, 'CARD 9911 GOOGLE WORKSPACE', 'Google Workspace', 38_400, 'expense', 'Software', 'Corporate card')
  add(7, 'CARD 9911 GITHUB INC', 'GitHub', 21_800, 'expense', 'Software', 'Corporate card')
  add(9, 'CARD 9911 SLACK TECHNOLOGIES', 'Slack', 17_600, 'expense', 'Software', 'Corporate card')
  add(11, 'CARD 9911 ATLASSIAN PTY', 'Atlassian', 25_900, 'expense', 'Software', 'Corporate card')
  add(10, 'NEFT DR BESCOM ELECTRICITY', 'BESCOM', 21_000 + rng() * 7_000, 'expense', 'Utilities', 'Bank transfer')
  add(12, 'ACH D- AIRTEL BROADBAND', 'Airtel', 5_900, 'expense', 'Utilities', 'Auto-debit')
  add(14, 'ACH D- JIO POSTPAID', 'Jio', 3_240, 'expense', 'Utilities', 'Auto-debit')

  // Marketing
  add(8, 'CARD 9911 GOOGLE ADS', 'Google Ads', 1_20_000 + rng() * 60_000, 'expense', 'Marketing', 'Corporate card')
  add(16, 'CARD 9911 LINKEDIN ADS', 'LinkedIn Ads', 80_000 + rng() * 30_000, 'expense', 'Marketing', 'Corporate card')
  add(22, 'CARD 9911 META ADS', 'Meta Ads', 60_000 + rng() * 30_000, 'expense', 'Marketing', 'Corporate card')

  // Variable costs
  const travelCount = isCurrent ? 4 : 2 + randInt(rng, 0, 2)
  for (let i = 0; i < travelCount; i++) {
    const hotel = rng() > 0.5
    add(randInt(rng, 2, 27), hotel ? `CARD 9911 MAKEMYTRIP HOTEL ${pick(rng, ['MUMBAI', 'DELHI', 'PUNE'])}` : `IMPS/INDIGO/PNR ${String.fromCharCode(65 + randInt(rng, 0, 25))}${randInt(rng, 1000, 9999)}`, hotel ? 'MakeMyTrip' : 'IndiGo', hotel ? 14_000 + rng() * 22_000 : 7_500 + rng() * 15_000, 'expense', 'Travel', 'Corporate card')
  }
  for (let i = 0; i < 7 + randInt(rng, 0, 3); i++) {
    const m = pick(rng, [['UPI/SWIGGY/TEAM LUNCH', 'Swiggy'], ['UPI/ZOMATO/ORDER', 'Zomato'], ['POS BLUE TOKAI COFFEE', 'Blue Tokai']] as const)
    add(randInt(rng, 1, 28), `${m[0]} ${randInt(rng, 10000, 99999)}`, m[1], m[1] === 'Blue Tokai' ? 900 + rng() * 2_000 : 2_500 + rng() * 6_500, 'expense', 'Food', 'UPI')
  }
  for (let i = 0; i < 6 + randInt(rng, 0, 4); i++) {
    const m = pick(rng, [['UPI/UBER INDIA/TRIP', 'Uber'], ['UPI/OLA CABS/RIDE', 'Ola'], ['UPI/RAPIDO/RIDE', 'Rapido']] as const)
    add(randInt(rng, 1, 28), `${m[0]} ${randInt(rng, 1000, 9999)}`, m[1], 180 + rng() * 1_500, 'expense', 'Transportation', 'UPI')
  }
  add(randInt(rng, 5, 25), 'CARD 9911 AMAZON BUSINESS ORDER', 'Amazon Business', 4_000 + rng() * 21_000, 'expense', 'Office', 'Corporate card')
  return lines
}

function titleCase(s: string): string {
  return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

export function createInitialLedgerState(): LedgerState {
  const rng = createRng(77)
  const today = startOfDay()
  const thisMonth = startOfMonth(today)
  const transactions: Transaction[] = []
  let seq = 1
  for (let m = 5; m >= 0; m--) {
    const start = addMonths(thisMonth, -m)
    const isCurrent = m === 0
    const lastDay = isCurrent ? today.getDate() : daysInMonth(start)
    for (const line of monthLines(start, rng, isCurrent)) {
      const day = Math.min(line.day, daysInMonth(start))
      if (day > lastDay) continue
      const date = toISODate(new Date(start.getFullYear(), start.getMonth(), day))
      const ai = line.type === 'expense' ? ruleBasedClassifier.classify(line.description, line.amount, []) : null
      transactions.push({
        id: `txn_${seq++}`,
        date,
        description: line.description,
        merchant: line.merchant,
        amount: line.amount,
        type: line.type,
        category: line.category,
        method: line.method,
        status: isCurrent && day >= lastDay - 1 ? 'pending' : 'cleared',
        categorizedBy: line.type === 'income' ? 'rule' : 'ai',
        confidence: ai?.confidence,
        reason: ai?.reason,
      })
    }
  }

  // A few lines in the current month that still need a category.
  const uncategorized: [string, string, number][] = [
    ['UPI/RAJESH KUMAR/PLUMBING WORK', 'Rajesh Kumar', 3_800],
    ['POS 4411 ZEPTO MARKETPLACE', 'Zepto', 1_640],
    ['NEFT DR BLR LEGAL ASSOCIATES', 'BLR Legal Associates', 45_000],
  ]
  uncategorized.forEach(([description, merchant, amount], i) =>
    transactions.push({
      id: `txn_${seq++}`,
      date: isoDateFromToday(-(i + 1)),
      description,
      merchant,
      amount,
      type: 'expense',
      category: 'Uncategorized',
      method: i === 2 ? 'Bank transfer' : 'UPI',
      status: 'cleared',
      categorizedBy: 'manual',
    }),
  )

  transactions.sort((a, b) => b.date.localeCompare(a.date))

  return {
    company: COMPANY,
    transactions,
    budgets: [
      { category: 'Salaries', limit: 22_00_000 },
      { category: 'Software', limit: 3_50_000 },
      { category: 'Marketing', limit: 3_80_000 },
      { category: 'Office', limit: 1_50_000 },
      { category: 'Travel', limit: 70_000 },
      { category: 'Food', limit: 60_000 },
      { category: 'Utilities', limit: 40_000 },
      { category: 'Transportation', limit: 12_000 },
    ],
    goals: [
      { id: 'g1', name: 'Emergency reserve (6 months runway)', target: 1_50_00_000, saved: 96_00_000, deadline: isoDateFromToday(240) },
      { id: 'g2', name: 'GST & advance-tax provision', target: 12_00_000, saved: 9_40_000, deadline: isoDateFromToday(35) },
      { id: 'g3', name: 'Equipment refresh', target: 8_00_000, saved: 5_20_000, deadline: isoDateFromToday(120) },
    ],
    rules: [],
    inbox: [],
  }
}

/** Sample bank-statement lines used by the "Import statement" action. */
export const SAMPLE_STATEMENT: { description: string; merchant: string; amount: number; method: TxnMethod }[] = [
  { description: 'POS 4492 STARBUCKS INDIRANAGAR', merchant: 'Starbucks', amount: 1_480, method: 'Corporate card' },
  { description: 'UPI/UBER INDIA/TRIP 7XK2', merchant: 'Uber', amount: 642, method: 'UPI' },
  { description: 'ACH D- AWS INDIA PVT LTD', merchant: 'AWS', amount: 18_240, method: 'Auto-debit' },
  { description: 'CARD 9911 LINKEDIN ADS IRL', merchant: 'LinkedIn Ads', amount: 24_500, method: 'Corporate card' },
  { description: 'NEFT DR TATA POWER DDL', merchant: 'Tata Power', amount: 7_820, method: 'Bank transfer' },
  { description: 'IMPS/AIR INDIA/PNR QX7T21', merchant: 'Air India', amount: 11_960, method: 'Corporate card' },
  { description: 'CARD 9911 FIGMA INC', merchant: 'Figma', amount: 14_900, method: 'Corporate card' },
  { description: 'UPI/ZOMATO/ORDER 55120', merchant: 'Zomato', amount: 3_260, method: 'UPI' },
  { description: 'CARD 9911 OYO ROOMS GOA', merchant: 'OYO', amount: 9_400, method: 'Corporate card' },
  { description: 'UPI/RAPIDO/RIDE 2231', merchant: 'Rapido', amount: 214, method: 'UPI' },
  { description: 'CARD 9911 CANVA PTY LTD', merchant: 'Canva', amount: 4_999, method: 'Corporate card' },
  { description: 'UPI/SHARMA STATIONERS/INV 2231', merchant: 'Sharma Stationers', amount: 2_350, method: 'UPI' },
  { description: 'UPI/9876543210@YBL/MISC', merchant: 'Unknown UPI payee', amount: 1_200, method: 'UPI' },
]
