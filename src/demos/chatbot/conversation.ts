import { AGENT_NAME, BRAND } from '@/data/mock/chatbot'
import { respond } from '@/services/ai/ruleBasedEngine'
import { emptyContext, type BotReply, type ConversationCategory } from '@/services/ai/types'
import type { ChatbotState, ChatMessage, Conversation } from '@/types/chatbot'
import { MINUTE } from '@/utils/dates'
import { uid } from '@/utils/id'

export const AGENT_REPLIES = [
  'Thanks for the details — I’m checking this with the team right now.',
  'I understand, and I’m sorry for the trouble. I’ve prioritized your case.',
  'All set — you’ll receive a confirmation by SMS and email shortly. Is there anything else I can help with?',
]

export function greeting(at: string): ChatMessage {
  return {
    id: uid('msg'),
    role: 'bot',
    at,
    text: `Hi! I'm **Astra Assist**, ${BRAND}'s virtual assistant. Ask me about orders, returns, products or business purchases — or pick a suggestion below.`,
  }
}

export function newConversation(customer: string): Conversation {
  const now = new Date().toISOString()
  return {
    id: uid('conv'),
    customer,
    status: 'bot',
    category: 'General',
    createdAt: now,
    updatedAt: now,
    messages: [greeting(now)],
    context: emptyContext(),
    insights: { intents: [], sentiment: { score: 0, label: 'neutral' }, sentimentHistory: [], entities: {}, suggestions: [] },
  }
}

/** Merges an engine reply into a conversation (customer message must already be appended). */
export function applyReply(conv: Conversation, reply: BotReply, at: number): Conversation {
  const botMessages: ChatMessage[] = reply.messages.map((m, i) => ({
    id: uid('msg'),
    role: 'bot',
    at: new Date(at + i * 1500).toISOString(),
    text: m.text,
    card: m.card,
    quickReplies: m.quickReplies,
    source: m.source,
  }))
  const messages = conv.messages.map((m, i) =>
    i === conv.messages.length - 1 && m.role === 'customer' ? { ...m, intent: reply.intents[0]?.intent, sentiment: reply.sentiment.score } : m,
  )
  const category: ConversationCategory = conv.category === 'General' && reply.category !== 'General' ? reply.category : conv.category
  return {
    ...conv,
    category,
    updatedAt: new Date(at).toISOString(),
    status: reply.escalation ? 'escalated' : reply.resolved ? 'resolved' : conv.status,
    messages: [...messages, ...botMessages],
    context: reply.context,
    insights: {
      intents: reply.intents,
      sentiment: reply.sentiment,
      sentimentHistory: [...conv.insights.sentimentHistory, reply.sentiment.score].slice(-20),
      entities: { ...conv.insights.entities, ...reply.entities },
      suggestions: reply.suggestions,
      escalationReason: reply.escalation?.reason ?? conv.insights.escalationReason,
    },
  }
}

export function customerMessage(text: string, at: number): ChatMessage {
  return { id: uid('msg'), role: 'customer', text, at: new Date(at).toISOString() }
}

export function agentIntro(conv: Conversation, at: number): ChatMessage {
  const first = conv.customer.split(' ')[0]
  const name = /visitor/i.test(conv.customer) ? 'there' : first
  return {
    id: uid('msg'),
    role: 'agent',
    at: new Date(at).toISOString(),
    text: `Hi ${name}, I'm ${AGENT_NAME} from ${BRAND} support. I've read the conversation summary${conv.context.orderId ? ` and I can see order ${conv.context.orderId}` : ''} — I'll take it from here.`,
  }
}

function scripted(customer: string, lines: string[], startMinutesAgo: number, opts: { status?: Conversation['status']; agent?: string[] } = {}): Conversation {
  let t = Date.now() - startMinutesAgo * MINUTE
  let conv: Conversation = { ...newConversation(customer), createdAt: new Date(t).toISOString() }
  conv.messages = [greeting(new Date(t).toISOString())]
  for (const line of lines) {
    t += 1.5 * MINUTE
    if (conv.status === 'escalated') break
    conv = { ...conv, messages: [...conv.messages, customerMessage(line, t)] }
    conv = applyReply(conv, respond(line, conv.context), t + 20_000)
  }
  if (conv.status === 'escalated') {
    t += MINUTE
    conv.messages.push({ id: uid('msg'), role: 'system', at: new Date(t).toISOString(), text: `Escalated to human support · ${conv.insights.escalationReason ?? 'Requested by customer'}` })
    conv.messages.push(agentIntro(conv, t + 40_000))
    for (const [i, text] of (opts.agent ?? []).entries()) conv.messages.push({ id: uid('msg'), role: 'agent', at: new Date(t + (i + 2) * MINUTE).toISOString(), text })
  }
  if (opts.status) conv.status = opts.status
  conv.updatedAt = conv.messages[conv.messages.length - 1].at
  return conv
}

export function createInitialChatbotState(): ChatbotState {
  const live = newConversation('Website visitor')
  const conversations = [
    live,
    scripted('Rohit Verma', ['My smartwatch arrived damaged, I need a replacement', 'ORD-10477', 'This is unacceptable, I want to talk to a manager'], 95, {
      agent: ['I’m sorry about the damaged screen on your Pulse Smartwatch S2. I’ve arranged a free replacement with priority pickup tomorrow.'],
    }),
    scripted('Vikram Nair', ['We need 150 smartwatches for corporate gifting', 'Orbit Systems, around 450 employees', '₹5–20 lakh', 'Within 2 weeks', 'procurement@orbitsystems.example'], 210, {
      status: 'resolved',
    }),
    scripted('Ananya Sharma', ['Hi', 'Where is my order ORD-10482?', 'Great, thanks!'], 380, { status: 'resolved' }),
    scripted('Ishita Banerjee', ['How much is shipping?', 'Do you have cash on delivery?', 'Thank you'], 1440 + 120, { status: 'resolved' }),
  ]
  return { conversations, activeId: live.id }
}
