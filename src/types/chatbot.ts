import type { ConversationCategory, ConversationContext, Entities, IntentId, IntentScore, MessageCard, SentimentResult } from '@/services/ai/types'

export interface ChatMessage {
  id: string
  role: 'customer' | 'bot' | 'agent' | 'system'
  text: string
  at: string
  card?: MessageCard
  quickReplies?: string[]
  source?: string
  /** Top intent detected for a customer message. */
  intent?: IntentId
  sentiment?: number
}

export type ConversationStatus = 'bot' | 'escalated' | 'resolved'

export interface Conversation {
  id: string
  customer: string
  status: ConversationStatus
  category: ConversationCategory
  createdAt: string
  updatedAt: string
  messages: ChatMessage[]
  context: ConversationContext
  insights: {
    intents: IntentScore[]
    sentiment: SentimentResult
    sentimentHistory: number[]
    entities: Entities
    suggestions: string[]
    escalationReason?: string
  }
}

export interface ChatbotState {
  conversations: Conversation[]
  activeId: string
}
