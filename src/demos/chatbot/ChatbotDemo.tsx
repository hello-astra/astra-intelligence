import { useEffect, useRef, useState } from 'react'
import { BarChart3, BookOpen, History, MessagesSquare } from 'lucide-react'
import { useToast } from '@/components/ui/toast-context'
import { SOLUTION_BY_SLUG } from '@/data/constants/solutions'
import { usePersistentState } from '@/hooks/usePersistentState'
import { chatProvider, ruleBasedProvider } from '@/services/ai'
import { analyzeSentiment } from '@/services/ai/ruleBasedEngine'
import type { BotReply } from '@/services/ai/types'
import type { ChatMessage, Conversation } from '@/types/chatbot'
import { uid } from '@/utils/id'
import { DemoShell } from '../shared/DemoShell'
import type { DemoView } from '../shared/demo-context'
import { ChatView } from './ChatView'
import { AGENT_REPLIES, agentIntro, applyReply, createInitialChatbotState, customerMessage, newConversation } from './conversation'
import { ChatAnalyticsView, ConversationsView, KnowledgeView } from './views'

type View = 'chat' | 'history' | 'analytics' | 'knowledge'
const solution = SOLUTION_BY_SLUG['ai-chatbots']

function systemMessage(text: string): ChatMessage {
  return { id: uid('msg'), role: 'system', text, at: new Date().toISOString() }
}

export default function ChatbotDemo() {
  const toast = useToast()
  const [state, setState, reset] = usePersistentState('chatbot', createInitialChatbotState, 1)
  const [view, setView] = useState<View>('chat')
  const [typingId, setTypingId] = useState<string | null>(null)
  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  })

  const update = (id: string, fn: (c: Conversation) => Conversation) =>
    setState((s) => ({ ...s, conversations: s.conversations.map((c) => (c.id === id ? fn(c) : c)) }))

  const handoff = (id: string, reason: string) => {
    update(id, (c) => ({
      ...c,
      status: 'escalated',
      context: { ...c.context, escalated: true, pending: undefined },
      insights: { ...c.insights, escalationReason: reason },
      messages: [...c.messages, systemMessage(`Escalated to human support · ${reason}`)],
    }))
    setTypingId(id)
    window.setTimeout(() => {
      update(id, (c) => ({ ...c, updatedAt: new Date().toISOString(), messages: [...c.messages, agentIntro(c, Date.now())] }))
      setTypingId(null)
    }, 1800)
    toast({ title: 'Escalated to a human agent', description: `${reason}. A handoff summary was shared (simulated).`, tone: 'warning' })
  }

  const send = async (id: string, raw: string) => {
    const text = raw.trim()
    if (!text || typingId) return
    const conv = stateRef.current.conversations.find((c) => c.id === id)
    if (!conv) return
    const now = Date.now()
    update(id, (c) => ({ ...c, status: c.status === 'resolved' ? 'bot' : c.status, updatedAt: new Date(now).toISOString(), messages: [...c.messages, customerMessage(text, now)] }))
    setTypingId(id)

    if (conv.status === 'escalated') {
      const sentiment = analyzeSentiment(text)
      window.setTimeout(() => {
        update(id, (c) => {
          const agentCount = c.messages.filter((m) => m.role === 'agent').length
          const reply = AGENT_REPLIES[Math.min(Math.max(agentCount - 1, 0), AGENT_REPLIES.length - 1)]
          const messages = c.messages.map((m, i) => (i === c.messages.length - 1 && m.role === 'customer' ? { ...m, sentiment: sentiment.score } : m))
          return {
            ...c,
            updatedAt: new Date().toISOString(),
            messages: [...messages, { id: uid('msg'), role: 'agent', text: reply, at: new Date().toISOString() }],
            insights: { ...c.insights, sentiment, sentimentHistory: [...c.insights.sentimentHistory, sentiment.score].slice(-20) },
          }
        })
        setTypingId(null)
      }, 1500)
      return
    }

    const history = conv.messages.map((m) => ({ role: m.role, text: m.text }))
    let reply: BotReply
    try {
      reply = await chatProvider.reply(text, conv.context, history)
    } catch {
      reply = await ruleBasedProvider.reply(text, conv.context, history)
      toast({ title: 'AI service unavailable', description: 'Falling back to the built-in demo engine.', tone: 'warning' })
    }
    const length = reply.messages.reduce((s, m) => s + m.text.length, 0)
    window.setTimeout(() => {
      update(id, (c) => applyReply(c, reply, Date.now()))
      setTypingId(null)
      if (reply.escalation) {
        const reason = reply.escalation.reason
        window.setTimeout(() => {
          update(id, (c) => ({ ...c, messages: [...c.messages, systemMessage(`Escalated to human support · ${reason}`)] }))
          setTypingId(id)
          window.setTimeout(() => {
            update(id, (c) => ({ ...c, updatedAt: new Date().toISOString(), messages: [...c.messages, agentIntro(c, Date.now())] }))
            setTypingId(null)
          }, 1800)
        }, 500)
        toast({ title: 'Escalated to a human agent', description: `${reason}. Handoff summary shared (simulated).`, tone: 'warning' })
      }
      if (reply.context.lead.stage === 'qualified' && conv.context.lead.stage !== 'qualified') {
        toast({ title: `Lead qualified · ${reply.context.lead.tier}`, description: `Score ${reply.context.lead.score}/100 — ready to push to CRM.` })
      }
    }, 450 + Math.min(1100, length * 4))
  }

  const views: DemoView<View>[] = [
    { id: 'chat', label: 'Live chat', icon: MessagesSquare, badge: state.conversations.filter((c) => c.status === 'escalated').length || undefined },
    { id: 'history', label: 'Conversations', icon: History, badge: state.conversations.length },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'knowledge', label: 'Knowledge base', icon: BookOpen },
  ]

  const open = (id: string) => {
    setState((s) => ({ ...s, activeId: id }))
    setView('chat')
  }

  return (
    <DemoShell
      solution={solution}
      views={views}
      activeView={view}
      onViewChange={setView}
      onReset={() => {
        reset()
        setTypingId(null)
        setView('chat')
      }}
      flush={view === 'chat'}
    >
      {view === 'chat' && (
        <ChatView
          state={state}
          select={(id) => setState((s) => ({ ...s, activeId: id }))}
          send={(id, text) => void send(id, text)}
          typingId={typingId}
          newConversation={() => {
            const count = stateRef.current.conversations.filter((c) => c.customer.startsWith('Website visitor')).length
            const conv = newConversation(`Website visitor ${count + 1}`)
            setState((s) => ({ conversations: [conv, ...s.conversations], activeId: conv.id }))
          }}
          escalate={(id) => handoff(id, 'Escalated manually from the agent console')}
          resolve={(id) => {
            update(id, (c) => ({ ...c, status: 'resolved', updatedAt: new Date().toISOString(), messages: [...c.messages, systemMessage('Conversation marked as resolved')] }))
            toast({ title: 'Conversation resolved' })
          }}
          sendAsAgent={(id, text) => {
            const conv = stateRef.current.conversations.find((c) => c.id === id)
            update(id, (c) => ({
              ...c,
              status: 'escalated',
              updatedAt: new Date().toISOString(),
              insights: { ...c.insights, escalationReason: c.insights.escalationReason ?? 'Agent took over from the console' },
              context: { ...c.context, escalated: true, pending: undefined },
              messages: [...c.messages, ...(c.status === 'bot' ? [systemMessage('A support agent joined the conversation')] : []), { id: uid('msg'), role: 'agent', text, at: new Date().toISOString() }],
            }))
            if (conv?.status === 'bot') toast({ title: 'You took over as the agent', description: 'The assistant has stepped back for this conversation.', tone: 'info' })
          }}
          createLead={() => toast({ title: 'Lead pushed to CRM (simulated)', description: 'No external CRM is connected in this demo.', tone: 'info' })}
        />
      )}
      {view === 'history' && <ConversationsView state={state} open={open} />}
      {view === 'analytics' && <ChatAnalyticsView state={state} />}
      {view === 'knowledge' && <KnowledgeView />}
    </DemoShell>
  )
}
