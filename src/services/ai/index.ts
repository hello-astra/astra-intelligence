import { createHttpChatProvider } from './httpChatProvider'
import { ruleBasedProvider } from './ruleBasedEngine'
import type { ChatProvider } from './types'

const endpoint = import.meta.env.VITE_CHAT_API_URL?.trim()

/**
 * Active chat provider. Set VITE_CHAT_API_URL to route the demo through a real
 * LLM backend; otherwise the transparent rule-based engine is used.
 */
export const chatProvider: ChatProvider = endpoint ? createHttpChatProvider(endpoint) : ruleBasedProvider

export { ruleBasedProvider }
export type * from './types'
