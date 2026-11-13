/**
 * Contract between the chat UI and any conversational engine.
 * The demo ships a rule-based engine; a real LLM integration implements the
 * same ChatProvider interface (see httpChatProvider.ts and README).
 */

export type IntentId =
  | 'greeting'
  | 'order_status'
  | 'refund_request'
  | 'return_policy'
  | 'cancel_order'
  | 'product_info'
  | 'pricing'
  | 'shipping_info'
  | 'payment_issue'
  | 'bulk_inquiry'
  | 'services'
  | 'human_agent'
  | 'complaint'
  | 'thanks'
  | 'goodbye'
  | 'affirm'
  | 'deny'
  | 'unknown'

export type ConversationCategory = 'Orders' | 'Returns & refunds' | 'Products' | 'Billing' | 'Sales lead' | 'General'

export interface IntentScore {
  intent: IntentId
  label: string
  confidence: number
}

export interface Entities {
  orderId?: string
  email?: string
  phone?: string
  products?: string[]
  quantity?: number
  amount?: number
}

export interface SentimentResult {
  /** −1 (very negative) … +1 (very positive) */
  score: number
  label: 'positive' | 'neutral' | 'negative'
}

export type Slot = 'orderId' | 'confirmReturn' | 'confirmCancel' | 'leadNeeds' | 'leadCompany' | 'leadBudget' | 'leadTimeline' | 'leadEmail'

export interface LeadState {
  stage: 'none' | 'qualifying' | 'qualified'
  answers: {
    needs?: string
    quantity?: number
    company?: string
    companySize?: number
    budget?: number
    timelineDays?: number
    timeline?: string
    email?: string
  }
  score: number
  tier: 'Cold' | 'Warm' | 'Hot'
}

export interface ConversationContext {
  pending?: { intent: IntentId; slot: Slot }
  orderId?: string
  lastIntent?: IntentId
  unknownStreak: number
  negativeStreak: number
  lead: LeadState
  escalated: boolean
}

export type MessageCard = { type: 'order'; orderId: string } | { type: 'lead' } | { type: 'escalation' }

export interface BotMessage {
  text: string
  card?: MessageCard
  quickReplies?: string[]
  /** Knowledge-base source the answer is grounded in. */
  source?: string
}

export interface BotReply {
  messages: BotMessage[]
  intents: IntentScore[]
  entities: Entities
  sentiment: SentimentResult
  context: ConversationContext
  category: ConversationCategory
  /** Set when the conversation should be handed to a human. */
  escalation?: { reason: string }
  /** Agent-assist suggestions for a human reviewing the conversation. */
  suggestions: string[]
  resolved?: boolean
}

export interface ChatHistoryItem {
  role: 'customer' | 'bot' | 'agent' | 'system'
  text: string
}

export interface ChatProvider {
  readonly id: string
  readonly label: string
  readonly kind: 'rule-based' | 'llm'
  reply(input: string, context: ConversationContext, history: ChatHistoryItem[]): Promise<BotReply>
}

export function emptyContext(): ConversationContext {
  return { unknownStreak: 0, negativeStreak: 0, escalated: false, lead: { stage: 'none', answers: {}, score: 0, tier: 'Cold' } }
}
