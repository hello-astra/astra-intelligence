/**
 * Rule-based conversational engine (demo).
 *
 * Pipeline per message: entity extraction → intent scoring (weighted
 * patterns, softmax-calibrated) → sentiment (lexicon with negation and
 * intensifiers) → slot filling for pending questions → intent handler that
 * answers from the knowledge base → escalation rules.
 *
 * It is intentionally transparent and deterministic. A production build swaps
 * it for an LLM behind the same ChatProvider interface.
 */
import { BRAND, buildOrders, POLICIES, PRODUCTS, type KbOrder } from '@/data/mock/chatbot'
import { formatINR } from '@/utils/format'
import type {
  BotMessage,
  BotReply,
  ChatProvider,
  ConversationCategory,
  ConversationContext,
  Entities,
  IntentId,
  IntentScore,
  LeadState,
  SentimentResult,
  Slot,
} from './types'

export const INTENT_LABELS: Record<IntentId, string> = {
  greeting: 'Greeting',
  order_status: 'Order status',
  refund_request: 'Refund request',
  return_policy: 'Returns & exchanges',
  cancel_order: 'Cancel order',
  product_info: 'Product information',
  pricing: 'Pricing & offers',
  shipping_info: 'Shipping information',
  payment_issue: 'Payment issue',
  bulk_inquiry: 'Bulk / corporate inquiry',
  services: 'Warranty & services',
  human_agent: 'Request human agent',
  complaint: 'Complaint',
  thanks: 'Thanks',
  goodbye: 'Goodbye',
  affirm: 'Affirmation',
  deny: 'Denial',
  unknown: 'Unrecognized',
}

const PRODUCT_RE = new RegExp(`\\b(${PRODUCTS.flatMap((p) => p.keywords).map((k) => k.replace(/[-+]/g, '\\$&')).join('|')})\\b`, 'i')

type Pattern = [RegExp, number]
const PATTERNS: Partial<Record<IntentId, Pattern[]>> = {
  greeting: [[/^\s*(hi|hello|hey|hiya|good (morning|afternoon|evening)|namaste)\b/i, 2.6]],
  order_status: [
    [/\b(where|track|tracking|status|when)\b.{0,30}\b(order|package|parcel|delivery|shipment|item)\b/i, 3.2],
    [/\b(order|package|parcel|shipment)\b.{0,25}\b(status|arrive|arriving|reach|come|update)\b/i, 2.6],
    [/\bnot (yet )?(received|delivered|arrived)\b/i, 2.4],
    [/\b(late|delay|delayed|still waiting)\b/i, 1.4],
    [/\b(ord[-\s#]?\d{5}|#\d{5})\b/i, 1.2],
  ],
  refund_request: [
    [/\brefund/i, 3.4],
    [/\b(start|initiate|raise|create|begin)\b.{0,15}\breturn\b/i, 3.8],
    [/\bmoney back\b/i, 3.2],
    [/\b(reimburse|chargeback)/i, 2.4],
  ],
  return_policy: [
    [/\breturn(s|ing)?\b/i, 2.2],
    [/\b(exchange|replace|replacement)\b/i, 2.2],
    [/\bpolicy\b/i, 1.2],
    [/\b(damaged|defective|broken|faulty)\b/i, 1.6],
  ],
  cancel_order: [[/\bcancel(l?ing|l?ed)?\b(?!.*\bthat\b)/i, 3.4]],
  product_info: [
    [/\b(spec|specs|feature|features|battery|noise|waterproof|compatible|difference|compare|which (one|model)|recommend\w*|suggest\w*|good for|details?|tell me about)\b/i, 2],
    [PRODUCT_RE, 1.6],
  ],
  pricing: [[/\b(price|prices|cost|how much|discount|offer|offers|coupon|emi|deal|cheaper)\b/i, 2.6]],
  shipping_info: [[/\b(shipping|delivery (time|charge|charges|fee|options)|how long|express|cod|cash on delivery|ship to|deliver to)\b/i, 2.6]],
  payment_issue: [
    [/\b(payment|paid|charged|debited|upi|card|transaction)\b.{0,40}\b(fail|failed|declined|twice|double|stuck|pending|not (confirmed|reflected|received))/i, 3.4],
    [/\b(deducted|debited|charged twice)\b/i, 2.6],
  ],
  bulk_inquiry: [
    [/\b(bulk|wholesale|corporate|business|company|employees|gifting|enterprise|b2b|reseller|distributor)\b/i, 2.6],
    [/\b\d{2,6}\s*(units|pieces|pcs|nos|smart ?watch(es)?|watches|headphones|earbuds|devices|speakers|keyboards)\b/i, 2.8],
    [/\b(quote|quotation|volume pricing)\b/i, 2.4],
  ],
  services: [[/\b(install|installation|setup|set up|warranty|nova care|extended|repair|service cent(er|re)|servicing)\b/i, 2.6]],
  human_agent: [[/\b(human|real person|live agent|representative|customer care|talk to (someone|a person|an agent|support)|speak (to|with)|call me|manager|supervisor|agent)\b/i, 3.6]],
  complaint: [[/\b(worst|terrible|useless|frustrat\w*|angry|ridiculous|unacceptable|disappointed|pathetic|scam|fraud|never again|fed up|third time|again and again)\b/i, 2.6]],
  thanks: [
    [/\b(thanks|thank you|thx|appreciate (it|that))\b/i, 2.6],
    [/^\s*(great|perfect|awesome|cool|got it)\s*[.!]*\s*$/i, 1.8],
  ],
  goodbye: [[/\b(bye|goodbye|see you|that'?s all|nothing else)\b/i, 2.8]],
  affirm: [[/^\s*(yes|yeah|yep|sure|ok(ay)?|please do|go ahead|confirm|do it)\b/i, 2.6]],
  deny: [[/^\s*(no|nope|not now|no thanks|don'?t)\b/i, 2.6]],
}

/* ---------------------------------------------------------------- NLU */

export function classify(text: string): IntentScore[] {
  const raw: [IntentId, number][] = []
  for (const [id, patterns] of Object.entries(PATTERNS) as [IntentId, Pattern[]][]) {
    const score = patterns.reduce((s, [re, w]) => (re.test(text) ? s + w : s), 0)
    if (score > 0) raw.push([id, score])
  }
  raw.push(['unknown', 1.2])
  const exps = raw.map(([id, s]) => [id, Math.exp(s * 1.35)] as const)
  const total = exps.reduce((s, [, e]) => s + e, 0)
  return exps
    .map(([intent, e]) => ({ intent, label: INTENT_LABELS[intent], confidence: e / total }))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 4)
}

export function parseMoney(text: string): number | undefined {
  const t = text.toLowerCase().replace(/,/g, '')
  const m = /(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(k|thousand|l|lakh|lakhs|lac|lacs|cr|crore|crores)?\b/.exec(t)
  if (!m) return undefined
  const n = Number(m[1])
  const unit = m[2] ?? ''
  if (/^(k|thousand)$/.test(unit)) return n * 1_000
  if (/^(l|lakh|lakhs|lac|lacs)$/.test(unit)) return n * 1_00_000
  if (/^(cr|crore|crores)$/.test(unit)) return n * 1_00_00_000
  return n >= 1000 ? n : undefined
}

export function extractEntities(text: string, expectingOrderId = false): Entities {
  const e: Entities = {}
  const order = /\bord(?:er)?[-\s#:]*(1\d{4})\b/i.exec(text) ?? /#(1\d{4})\b/.exec(text) ?? (expectingOrderId ? /\b(1\d{4})\b/.exec(text) : null)
  if (order) e.orderId = `ORD-${order[1]}`
  const email = /[^\s@<>()]+@[^\s@<>()]+\.[a-z]{2,}/i.exec(text)
  if (email) e.email = email[0].replace(/[.,;]$/, '')
  const phone = /(?:\+91[\s-]?)?\b[6-9]\d{9}\b/.exec(text)
  if (phone) e.phone = phone[0]
  const lower = text.toLowerCase()
  const products = PRODUCTS.filter((p) => p.keywords.some((k) => new RegExp(`\\b${k.replace(/[-+]/g, '\\$&')}\\b`).test(lower))).map((p) => p.name)
  if (products.length) e.products = products
  const qty = /\b(\d{1,3}(?:,\d{3})+|\d+)\s*(?:x\s*)?(units|pieces|pcs|nos|smart ?watch(?:es)?|watches|head ?phones|earbuds|buds|speakers|keyboards|devices|chargers|purifiers)\b/i.exec(text)
  if (qty) e.quantity = Number(qty[1].replace(/,/g, ''))
  if (/₹|\brs\.?\b|\binr\b|\blakh|\blac\b|\bcrore|\b\d+\s?k\b/i.test(text)) e.amount = parseMoney(text)
  return e
}

const LEXICON: Record<string, number> = {
  good: 2, great: 3, excellent: 3, love: 3, amazing: 3, awesome: 3, thanks: 1.5, thank: 1.5, helpful: 2, happy: 2, perfect: 3, nice: 2, quick: 1, fast: 1, smooth: 1.5, resolved: 2, fine: 0.5,
  bad: -2, poor: -2, worst: -3, terrible: -3, awful: -3, hate: -3, angry: -3, frustrated: -3, frustrating: -3, annoyed: -2, disappointed: -2.5, disappointing: -2.5, useless: -3, broken: -2,
  damaged: -2, defective: -2, late: -1.5, delay: -1.5, delayed: -1.5, waiting: -1, wrong: -2, problem: -1.5, issue: -1, unacceptable: -3, ridiculous: -3, scam: -3.5, fraud: -3.5, sucks: -3,
  pathetic: -3, rude: -2.5, slow: -1.5, never: -1, again: -0.5, fed: -2, nobody: -1.5, ignored: -2.5, cheated: -3,
}
const NEGATIONS = new Set(['not', 'no', 'never', "don't", 'dont', "isn't", 'isnt', "wasn't", 'wasnt', "didn't", 'didnt', "haven't", 'havent'])
const INTENSIFIERS = new Set(['very', 'really', 'extremely', 'so', 'super', 'totally', 'absolutely'])

export function analyzeSentiment(text: string): SentimentResult {
  const tokens = text.toLowerCase().match(/[a-z']+/g) ?? []
  let sum = 0
  for (let i = 0; i < tokens.length; i++) {
    const base = LEXICON[tokens[i]]
    if (base === undefined) continue
    let v = base
    if (INTENSIFIERS.has(tokens[i - 1])) v *= 1.5
    if (NEGATIONS.has(tokens[i - 1]) || NEGATIONS.has(tokens[i - 2])) v *= -0.6
    sum += v
  }
  const exclaim = (text.match(/!/g) ?? []).length
  const shouting = /[A-Z]{4,}/.test(text) && text.replace(/[^A-Z]/g, '').length / Math.max(1, text.replace(/[^A-Za-z]/g, '').length) > 0.6
  if (sum < 0) sum *= 1 + Math.min(exclaim, 3) * 0.15 + (shouting ? 0.4 : 0)
  const score = Math.tanh(sum / 4)
  return { score: Number(score.toFixed(2)), label: score <= -0.3 ? 'negative' : score >= 0.3 ? 'positive' : 'neutral' }
}

/* ---------------------------------------------------------- Knowledge */

const ORDERS = buildOrders()

function orderItems(o: KbOrder): string {
  return o.items.map((i) => `${i.qty > 1 ? `${i.qty}× ` : ''}${i.name}`).join(', ')
}

function statusText(o: KbOrder): string {
  switch (o.status) {
    case 'out_for_delivery':
      return `Good news — **${o.id}** (${orderItems(o)}) is **out for delivery** with ${o.carrier} and should arrive **${o.eta}**. Tracking number: ${o.tracking}.`
    case 'shipped':
      return `**${o.id}** (${orderItems(o)}) has shipped with ${o.carrier} and is in transit. Expected delivery: **${o.eta}**. Tracking number: ${o.tracking}.`
    case 'processing':
      return `**${o.id}** (${orderItems(o)}) is packed and will be dispatched within 24 hours, with delivery expected by **${o.eta}**. You'll get a tracking link by SMS.`
    case 'delivered':
      return `**${o.id}** (${orderItems(o)}) was **delivered on ${o.deliveredOn}**. It's eligible for return until **${o.returnUntil}**.`
    case 'cancelled':
      return `**${o.id}** was cancelled on ${o.cancelledOn}. A refund of **${formatINR(o.total)}** was issued to your ${o.payment} account the same day — it usually reflects within 2–3 business days.`
  }
}

const FOLLOW_UPS: Record<KbOrder['status'], string[]> = {
  out_for_delivery: ['What is the return policy?', 'Talk to a human'],
  shipped: ['Shipping options', 'Talk to a human'],
  processing: ['Cancel this order', 'Shipping options'],
  delivered: ['Request a refund', 'Start a return'],
  cancelled: ['Track another order'],
}

const SUGGESTIONS: Partial<Record<IntentId, string[]>> = {
  order_status: [
    'I’ve checked your order — I’ll send the live tracking link to your phone right away.',
    'Sorry for the wait! I’ve asked our courier partner to prioritize your delivery.',
    'Would you like to change the delivery slot or address?',
  ],
  refund_request: [
    'I’ve initiated your refund — it will reach your original payment method in 5–7 business days.',
    'Could you share a photo of the item? I can fast-track the return.',
    'I can offer an instant replacement instead of a refund if you prefer.',
  ],
  complaint: [
    'I’m really sorry about this experience. I’m taking ownership of your case personally.',
    'I’ve escalated this to our logistics lead and added a ₹200 credit to your account.',
    'May I call you in the next 10 minutes to resolve this?',
  ],
  bulk_inquiry: [
    'Thank you! I’ll prepare a volume quote within 24 hours.',
    'Would you like evaluation samples before placing the order?',
    'I can set up a call with our corporate gifting team this week.',
  ],
  product_info: [
    'Happy to help you choose — what will you mainly use it for?',
    'It’s available with no-cost EMI on select cards.',
    'I can share a comparison sheet of our top models.',
  ],
}
SUGGESTIONS.pricing = SUGGESTIONS.product_info
SUGGESTIONS.return_policy = SUGGESTIONS.refund_request
SUGGESTIONS.cancel_order = SUGGESTIONS.refund_request
SUGGESTIONS.human_agent = SUGGESTIONS.complaint
const DEFAULT_SUGGESTIONS = [
  'Thanks for reaching out — let me look into this for you.',
  'Could you share a little more detail so I can help?',
  'Is there anything else I can help you with today?',
]

function categoryOf(intent: IntentId): ConversationCategory {
  if (intent === 'order_status' || intent === 'cancel_order' || intent === 'shipping_info') return 'Orders'
  if (intent === 'refund_request' || intent === 'return_policy') return 'Returns & refunds'
  if (intent === 'product_info' || intent === 'pricing' || intent === 'services') return 'Products'
  if (intent === 'payment_issue') return 'Billing'
  if (intent === 'bulk_inquiry') return 'Sales lead'
  return 'General'
}

/* ------------------------------------------------------------- Leads */

const FREE_MAIL = /@(gmail|yahoo|outlook|hotmail|icloud|rediffmail|proton)\./i

export function scoreLead(a: LeadState['answers']): { score: number; tier: LeadState['tier'] } {
  let s = 0
  const q = a.quantity ?? 0
  s += q >= 100 ? 30 : q >= 50 ? 24 : q >= 10 ? 14 : q > 0 ? 5 : 0
  const b = a.budget ?? 0
  s += b >= 10_00_000 ? 25 : b >= 3_00_000 ? 18 : b >= 1_00_000 ? 10 : b > 0 ? 5 : 0
  const t = a.timelineDays
  s += t === undefined ? 0 : t <= 14 ? 20 : t <= 30 ? 16 : t <= 90 ? 10 : 4
  const c = a.companySize ?? 0
  s += c >= 500 ? 15 : c >= 100 ? 12 : c >= 20 ? 8 : c > 0 ? 4 : 0
  if (a.email) s += FREE_MAIL.test(a.email) ? 6 : 10
  return { score: s, tier: s >= 70 ? 'Hot' : s >= 45 ? 'Warm' : 'Cold' }
}

function parseTimeline(text: string): { days: number; label: string } | undefined {
  const t = text.toLowerCase()
  if (/asap|urgent|immediately|this week/.test(t)) return { days: 7, label: 'Within a week' }
  if (/2\s*weeks?|two weeks|fortnight/.test(t)) return { days: 14, label: 'Within 2 weeks' }
  if (/this month|next month|30 days|diwali|festive/.test(t)) return { days: 30, label: 'Within a month' }
  if (/(1|one)\s*[-–to]+\s*(3|three)\s*months|quarter|60 days|2 months|3 months/.test(t)) return { days: 60, label: 'In 1–3 months' }
  if (/explor|not sure|no rush|later|6 months/.test(t)) return { days: 180, label: 'Exploring' }
  const n = /(\d+)\s*(day|week|month)/.exec(t)
  if (n) {
    const v = Number(n[1]) * (n[2] === 'day' ? 1 : n[2] === 'week' ? 7 : 30)
    return { days: v, label: `${n[1]} ${n[2]}${Number(n[1]) > 1 ? 's' : ''}` }
  }
  return undefined
}

const BUDGET_CHOICES: Record<string, number> = { 'under ₹1 lakh': 75_000, '₹1–5 lakh': 3_00_000, '₹5–20 lakh': 12_00_000, 'above ₹20 lakh': 25_00_000 }

function nextLeadQuestion(lead: LeadState): { slot: Slot; message: BotMessage } | null {
  const a = lead.answers
  if (!a.quantity) return { slot: 'leadNeeds', message: { text: 'Which products do you need, and roughly how many units?' } }
  if (!a.company) return { slot: 'leadCompany', message: { text: 'What’s your company name, and roughly how many employees do you have?' } }
  if (a.budget === undefined) return { slot: 'leadBudget', message: { text: 'Do you have an approximate budget for this order?', quickReplies: ['Under ₹1 lakh', '₹1–5 lakh', '₹5–20 lakh', 'Above ₹20 lakh'] } }
  if (!a.timeline) return { slot: 'leadTimeline', message: { text: 'When do you need the order delivered?', quickReplies: ['Within 2 weeks', 'This month', 'In 1–3 months', 'Just exploring'] } }
  if (!a.email) return { slot: 'leadEmail', message: { text: 'Finally, which email should our account manager send the quote to?' } }
  return null
}

/* ---------------------------------------------------------- Engine */

interface Draft {
  messages: BotMessage[]
  ctx: ConversationContext
  escalation?: { reason: string }
  resolved?: boolean
  routedIntent?: IntentId
}

function cloneContext(c: ConversationContext): ConversationContext {
  return { ...c, pending: c.pending ? { ...c.pending } : undefined, lead: { ...c.lead, answers: { ...c.lead.answers } } }
}

function escalate(ctx: ConversationContext, reason: string, intro?: string): Draft {
  ctx.escalated = true
  ctx.pending = undefined
  return {
    ctx,
    escalation: { reason },
    messages: [
      {
        text: `${intro ? `${intro} ` : ''}I'm connecting you with a member of our support team now. I've shared a summary of our conversation, so you won't need to repeat anything.`,
        card: { type: 'escalation' },
      },
    ],
  }
}

function askOrderId(ctx: ConversationContext, intent: IntentId): Draft {
  ctx.pending = { intent, slot: 'orderId' }
  return {
    ctx,
    messages: [{ text: 'Sure — could you share your order ID? It looks like **ORD-10482** and is in your confirmation email.', quickReplies: ['ORD-10482', 'ORD-10477', 'ORD-10491'] }],
  }
}

function lookup(ctx: ConversationContext, intent: IntentId, orderId?: string): KbOrder | Draft {
  const id = orderId ?? ctx.orderId
  if (!id) return askOrderId(ctx, intent)
  const order = ORDERS[id]
  if (!order) {
    ctx.pending = { intent, slot: 'orderId' }
    return { ctx, messages: [{ text: `I couldn't find **${id}**. Please check the ID — it starts with ORD- followed by five digits (for example ORD-10482).` }] }
  }
  ctx.orderId = id
  return order
}

function handleIntent(intent: IntentId, ctx: ConversationContext, e: Entities, text: string, sentiment: SentimentResult): Draft {
  switch (intent) {
    case 'greeting':
      return {
        ctx,
        messages: [
          {
            text: `Hi! I'm **Astra Assist**, ${BRAND}'s virtual assistant. I can track orders, handle returns and refunds, answer product questions and help with business orders.`,
            quickReplies: ['Track my order', 'Return policy', 'Product recommendations', 'Corporate orders'],
          },
        ],
      }
    case 'order_status': {
      if (/\b(another|different|other)\b/i.test(text) && !e.orderId) {
        ctx.orderId = undefined
        return askOrderId(ctx, intent)
      }
      const found = lookup(ctx, intent, e.orderId)
      if ('messages' in found) return found
      ctx.pending = undefined
      return { ctx, messages: [{ text: statusText(found), card: { type: 'order', orderId: found.id }, quickReplies: FOLLOW_UPS[found.status] }] }
    }
    case 'refund_request': {
      const found = lookup(ctx, intent, e.orderId)
      if ('messages' in found) return found
      ctx.pending = undefined
      const o = found
      if (o.status === 'delivered') {
        ctx.pending = { intent, slot: 'confirmReturn' }
        return {
          ctx,
          messages: [
            {
              text: `I can help with that. **${o.id}** is within the 7-day return window (until ${o.returnUntil}). I'll arrange a free pickup; once the item passes inspection, **${formatINR(o.total)}** is refunded to your ${o.payment} within 5–7 business days. Shall I start the return?`,
              card: { type: 'order', orderId: o.id },
              quickReplies: ['Yes, start the return', 'No, thanks'],
              source: POLICIES.returns.title,
            },
          ],
        }
      }
      if (o.status === 'processing') {
        ctx.pending = { intent: 'cancel_order', slot: 'confirmCancel' }
        return { ctx, messages: [{ text: `**${o.id}** hasn't shipped yet, so I can cancel it now for a full refund of **${formatINR(o.total)}**. Would you like me to cancel it?`, quickReplies: ['Yes, cancel it', 'No, keep my order'] }] }
      }
      if (o.status === 'cancelled') return { ctx, messages: [{ text: statusText(o) }] }
      return {
        ctx,
        messages: [{ text: `**${o.id}** is already on its way. You can refuse the delivery for an automatic refund, or request a return within 7 days of delivery.`, source: POLICIES.returns.title, quickReplies: ['Track this order', 'Talk to a human'] }],
      }
    }
    case 'cancel_order': {
      const found = lookup(ctx, intent, e.orderId)
      if ('messages' in found) return found
      ctx.pending = undefined
      const o = found
      if (o.status === 'processing') {
        ctx.pending = { intent, slot: 'confirmCancel' }
        return { ctx, messages: [{ text: `I can cancel **${o.id}** (${orderItems(o)}) — it hasn't shipped yet. You'll get a full refund of **${formatINR(o.total)}**. Shall I go ahead?`, quickReplies: ['Yes, cancel it', 'No, keep my order'] }] }
      }
      if (o.status === 'cancelled') return { ctx, messages: [{ text: statusText(o) }] }
      if (o.status === 'delivered') return { ctx, messages: [{ text: `**${o.id}** has already been delivered, so it can't be cancelled — but you can return it until ${o.returnUntil}.`, quickReplies: ['Start a return'] }] }
      return { ctx, messages: [{ text: `**${o.id}** has already shipped and can't be cancelled. You can refuse the delivery and the refund is processed automatically.`, source: POLICIES.returns.title }] }
    }
    case 'return_policy': {
      const o = ctx.orderId ? ORDERS[ctx.orderId] : undefined
      const extra = o?.status === 'delivered' ? ` Your order **${o.id}** is eligible until ${o.returnUntil}.` : ''
      return { ctx, messages: [{ text: POLICIES.returns.text + extra, source: POLICIES.returns.title, quickReplies: o?.status === 'delivered' ? ['Start a return'] : ['Request a refund', 'Track my order'] }] }
    }
    case 'product_info': {
      const names = e.products ?? []
      const products = PRODUCTS.filter((p) => names.includes(p.name))
      if (products.length === 0)
        return { ctx, messages: [{ text: 'We stock headphones, earbuds, speakers, smartwatches, keyboards, chargers and smart-home products. Which one are you interested in?', quickReplies: ['Aurora ANC Headphones', 'Pulse Smartwatch S2', 'Echo Buds Pro', 'Breeze Air Purifier'] }] }
      if (products.length === 1) {
        const p = products[0]
        return {
          ctx,
          messages: [
            {
              text: `**${p.name}** — ${p.highlights.join(' · ')}. Price: **${formatINR(p.price)}**${p.price >= 6000 ? ' (no-cost EMI available on select cards)' : ''}. ${p.warranty}.`,
              quickReplies: ['Any offers?', 'Shipping options', 'Warranty details'],
            },
          ],
        }
      }
      return {
        ctx,
        messages: [{ text: `Here's a quick comparison:\n${products.map((p) => `• **${p.name}** — ${formatINR(p.price)}: ${p.highlights.join(', ')}`).join('\n')}`, quickReplies: ['Any offers?', 'Talk to a human'] }],
      }
    }
    case 'pricing': {
      const p = PRODUCTS.find((x) => e.products?.includes(x.name))
      const lead = p ? `**${p.name}** is priced at **${formatINR(p.price)}**. ` : ''
      return {
        ctx,
        messages: [{ text: `${lead}Current offers: code **ASTRA10** takes 10% off your first order, delivery is free above ₹999, and no-cost EMI is available above ₹6,000 on select cards.`, source: POLICIES.payments.title }],
      }
    }
    case 'shipping_info':
      return { ctx, messages: [{ text: POLICIES.shipping.text, source: POLICIES.shipping.title, quickReplies: ['Track my order'] }] }
    case 'payment_issue': {
      const id = e.orderId ?? ctx.orderId
      const o = id ? ORDERS[id] : undefined
      const check = o ? `I checked **${o.id}** — the ${o.payment} payment of ${formatINR(o.total)} is confirmed on our side. ` : ''
      return { ctx, messages: [{ text: `${check}${POLICIES.payments.text}`, source: POLICIES.payments.title, quickReplies: o ? ['Talk to a human'] : ['Share order ID', 'Talk to a human'] }] }
    }
    case 'services':
      return { ctx, messages: [{ text: POLICIES.warranty.text, source: POLICIES.warranty.title }] }
    case 'bulk_inquiry': {
      ctx.lead = { stage: 'qualifying', answers: { ...ctx.lead.answers }, score: 0, tier: 'Cold' }
      if (e.quantity) ctx.lead.answers.quantity = e.quantity
      if (e.products?.length || e.quantity) ctx.lead.answers.needs = e.products?.join(', ') || text.slice(0, 80)
      const next = nextLeadQuestion(ctx.lead)
      const intro: BotMessage = { text: `Great — we'd love to help with your business order. ${POLICIES.business.text} I'll ask a few quick questions so our corporate team can prepare a quote.`, source: POLICIES.business.title }
      if (next) ctx.pending = { intent, slot: next.slot }
      Object.assign(ctx.lead, scoreLead(ctx.lead.answers))
      return { ctx, messages: next ? [intro, next.message] : [intro] }
    }
    case 'human_agent':
      return escalate(ctx, 'Customer asked to speak to a person')
    case 'complaint': {
      if (sentiment.score <= -0.6 || ctx.negativeStreak >= 2) return escalate(ctx, 'Negative sentiment detected in a complaint', "I'm really sorry about this — that's not the experience we want for you.")
      const o = ctx.orderId ? ORDERS[ctx.orderId] : undefined
      return {
        ctx,
        messages: [
          {
            text: `I'm sorry to hear that — I understand how frustrating this is.${o ? ` Here's the latest on **${o.id}**: ${statusText(o).replace(/\*\*/g, '')}` : ' Could you share your order ID so I can check what went wrong?'} If you'd prefer, I can connect you with a support specialist.`,
            quickReplies: ['Connect me to an agent', 'Share order ID'],
          },
        ],
      }
    }
    case 'thanks':
      return { ctx, messages: [{ text: 'You’re welcome! Is there anything else I can help with?', quickReplies: ['Track an order', 'Return policy', "No, that's all"] }] }
    case 'goodbye':
      return { ctx, resolved: true, messages: [{ text: `Thanks for chatting with ${BRAND}. Have a great day! 👋` }] }
    case 'affirm':
    case 'deny':
      return { ctx, messages: [{ text: intent === 'affirm' ? 'Great! What would you like help with?' : 'No problem. Is there anything else I can help with?', quickReplies: ['Track my order', 'Return policy', 'Talk to a human'] }] }
    case 'unknown':
    default: {
      ctx.unknownStreak += 1
      if (ctx.unknownStreak >= 2) {
        return {
          ctx,
          messages: [{ text: "I'm still not sure I understood, sorry about that. Would you like me to connect you with a member of our support team?", quickReplies: ['Yes, connect me', 'Track my order', 'Return policy'] }],
        }
      }
      return {
        ctx,
        messages: [{ text: 'I’m not sure I understood that. I can help with order tracking, returns and refunds, product questions, payments and corporate orders.', quickReplies: ['Track my order', 'Return policy', 'Product recommendations'] }],
      }
    }
  }
}

/** Handles a reply to a question the bot asked. Returns null when the message is about something else. */
function handlePending(ctx: ConversationContext, e: Entities, text: string, top: IntentScore): Draft | null {
  const pending = ctx.pending
  if (!pending) return null
  const t = text.trim().toLowerCase()

  if (pending.slot === 'orderId') {
    if (e.orderId) {
      ctx.pending = undefined
      return { ...handleIntent(pending.intent, ctx, e, text, { score: 0, label: 'neutral' }), routedIntent: pending.intent }
    }
    if (top.intent !== 'unknown' && top.confidence >= 0.6) {
      ctx.pending = undefined
      return null
    }
    return { ctx, messages: [{ text: 'I still need the order ID to look that up — it looks like **ORD-10482**.', quickReplies: ['ORD-10482', 'ORD-10468'] }] }
  }

  if (pending.slot === 'confirmReturn' || pending.slot === 'confirmCancel') {
    const yes = /^(yes|yeah|yep|sure|ok|okay|please|go ahead|confirm|do it|start)/.test(t)
    const no = /^(no|nope|not now|keep|don'?t)/.test(t)
    const o = ctx.orderId ? ORDERS[ctx.orderId] : undefined
    ctx.pending = undefined
    if (yes && o) {
      const ref = `${pending.slot === 'confirmReturn' ? 'RET' : 'CAN'}-${String(Date.now()).slice(-6)}`
      return {
        ctx,
        routedIntent: pending.intent,
        messages: [
          pending.slot === 'confirmReturn'
            ? { text: `Done — return request **${ref}** is created for ${o.id} (simulated). Pickup is scheduled for tomorrow between 10 AM and 6 PM, and you'll get an SMS confirmation.`, quickReplies: ['Thanks!'] }
            : { text: `Done — **${o.id}** is cancelled (simulated, ref ${ref}). A refund of **${formatINR(o.total)}** has been initiated to your ${o.payment} and usually reflects within 2–3 business days.`, quickReplies: ['Thanks!'] },
        ],
      }
    }
    if (no) return { ctx, routedIntent: 'deny', messages: [{ text: 'No problem — I’ve left your order as it is. Anything else I can help with?' }] }
    return null
  }

  // Lead qualification answers — abandon the flow if the customer clearly changes topic.
  const a = ctx.lead.answers
  const switching = ['order_status', 'refund_request', 'cancel_order', 'human_agent', 'complaint', 'return_policy'].includes(top.intent) && top.confidence >= 0.7
  if (switching && pending.slot !== 'leadNeeds') {
    ctx.pending = undefined
    return null
  }
  switch (pending.slot) {
    case 'leadNeeds':
      a.quantity = e.quantity ?? (Number(/\d[\d,]*/.exec(text)?.[0]?.replace(/,/g, '')) || undefined)
      a.needs = e.products?.join(', ') || text.slice(0, 80)
      if (!a.quantity) return { ctx, messages: [{ text: 'Roughly how many units do you need? An estimate is fine.' }] }
      break
    case 'leadCompany': {
      const size = /(\d[\d,]*)\s*(\+|employees|people|staff|members)?/i.exec(text)
      a.companySize = size ? Number(size[1].replace(/,/g, '')) : /enterprise|large|mnc/i.test(text) ? 1000 : /startup|small/i.test(text) ? 20 : undefined
      a.company =
        text
          .replace(/(\d[\d,]*)\s*(\+|employees|people|staff|members)?/gi, '')
          .replace(/^(we are|we're|it's|its|company is|at)\s+/i, '')
          .replace(/[,.;\s]*\b(around|about|approximately|approx\.?|roughly|nearly|with|having|over|and)\s*$/i, '')
          .replace(/[,.;\s]+$/, '')
          .trim()
          .slice(0, 60) || 'Not specified'
      break
    }
    case 'leadBudget':
      a.budget = BUDGET_CHOICES[t] ?? parseMoney(text) ?? (/not sure|no idea|flexible/i.test(text) ? 0 : undefined)
      if (a.budget === undefined) return { ctx, messages: [{ text: 'An approximate range is fine — for example “around ₹5 lakh”.', quickReplies: ['Under ₹1 lakh', '₹1–5 lakh', '₹5–20 lakh', 'Above ₹20 lakh'] }] }
      break
    case 'leadTimeline': {
      const tl = parseTimeline(text)
      a.timeline = tl?.label ?? text.slice(0, 40)
      a.timelineDays = tl?.days
      break
    }
    case 'leadEmail':
      if (e.email) a.email = e.email
      else if (!/skip|later|no email/i.test(text)) return { ctx, messages: [{ text: 'Could you share a valid email address (for example name@company.com)? Or type “skip”.' }] }
      else a.email = undefined
      break
    default:
      return null
  }
  Object.assign(ctx.lead, scoreLead(a))
  const next = nextLeadQuestion(ctx.lead)
  if (next && !(pending.slot === 'leadEmail')) {
    ctx.pending = { intent: 'bulk_inquiry', slot: next.slot }
    return { ctx, routedIntent: 'bulk_inquiry', messages: [next.message] }
  }
  ctx.pending = undefined
  ctx.lead.stage = 'qualified'
  return {
    ctx,
    routedIntent: 'bulk_inquiry',
    messages: [
      {
        text: `Thank you! I've shared your requirements with our corporate sales team. Lead score **${ctx.lead.score}/100 (${ctx.lead.tier})**. ${a.email ? `An account manager will email **${a.email}**` : 'An account manager will reach out'} within one business day (simulated).`,
        card: { type: 'lead' },
      },
    ],
  }
}

export function respond(input: string, context: ConversationContext): BotReply {
  const ctx = cloneContext(context)
  const text = input.trim()
  const entities = extractEntities(text, ctx.pending?.slot === 'orderId')
  const sentiment = analyzeSentiment(text)
  const intents = classify(text)
  const top = intents[0]
  ctx.negativeStreak = sentiment.label === 'negative' ? ctx.negativeStreak + 1 : 0
  if (top.intent !== 'unknown') ctx.unknownStreak = 0
  if (entities.orderId && ORDERS[entities.orderId]) ctx.orderId = entities.orderId

  let draft: Draft | null = null
  if (/^(yes,? connect me|connect me to an agent)/i.test(text)) draft = escalate(ctx, 'Customer accepted the offer to speak to a person')
  else if (/^share (my )?order id$/i.test(text)) draft = askOrderId(ctx, ctx.lastIntent && ctx.lastIntent !== 'unknown' ? ctx.lastIntent : 'order_status')
  if (!draft) draft = handlePending(ctx, entities, text, top)
  if (!draft && sentiment.score <= -0.75 && ctx.negativeStreak >= 2) draft = escalate(ctx, 'Sustained strongly negative sentiment', "I can see this has been really frustrating, and I'm sorry.")
  const routed = draft?.routedIntent ?? top.intent
  if (!draft) draft = handleIntent(top.intent, ctx, entities, text, sentiment)
  draft.ctx.lastIntent = routed

  // Answers to a pending question are resolved from conversation context rather than by the classifier.
  const reported: IntentScore[] =
    draft.routedIntent && top.intent === 'unknown' ? [{ intent: routed, label: `${INTENT_LABELS[routed]} · follow-up (from context)`, confidence: 1 }] : intents

  return {
    messages: draft.messages,
    intents: reported,
    entities,
    sentiment,
    context: draft.ctx,
    category: categoryOf(routed),
    escalation: draft.escalation,
    suggestions: SUGGESTIONS[routed] ?? DEFAULT_SUGGESTIONS,
    resolved: draft.resolved,
  }
}

export const ruleBasedProvider: ChatProvider = {
  id: 'rule-based',
  label: 'Rule-based demo engine',
  kind: 'rule-based',
  async reply(input, context) {
    return respond(input, context)
  },
}

export function lookupOrder(id: string): KbOrder | undefined {
  return ORDERS[id]
}
