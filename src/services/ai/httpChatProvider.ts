import type { BotReply, ChatHistoryItem, ChatProvider, ConversationContext } from './types'

/**
 * Production integration point.
 *
 * Point VITE_CHAT_API_URL at YOUR backend (never call an LLM vendor directly
 * from the browser — API keys must stay server-side). The backend receives
 * { message, context, history } and returns a BotReply-shaped JSON document,
 * typically produced by an LLM with retrieval over your knowledge base and
 * tool calls for order lookups. See README → "AI chatbot".
 */
export function createHttpChatProvider(endpoint: string): ChatProvider {
  return {
    id: 'http',
    label: 'LLM backend',
    kind: 'llm',
    async reply(message: string, context: ConversationContext, history: ChatHistoryItem[]): Promise<BotReply> {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ message, context, history: history.slice(-20) }),
        signal: AbortSignal.timeout(30_000),
      })
      if (!response.ok) throw new Error(`Chat service responded with ${response.status}`)
      const data = (await response.json()) as Partial<BotReply>
      if (!Array.isArray(data.messages) || !data.context || !data.sentiment) throw new Error('Chat service returned an unexpected payload')
      return {
        intents: [],
        entities: {},
        suggestions: [],
        category: 'General',
        ...data,
      } as BotReply
    },
  }
}
