import { Fragment, type ReactNode } from 'react'
import { Bot, Check, FileText, Headset, Package, Truck, UserRoundCheck } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Meter } from '@/components/ui/Meter'
import { AGENT_NAME } from '@/data/mock/chatbot'
import { lookupOrder } from '@/services/ai/ruleBasedEngine'
import type { LeadState } from '@/services/ai/types'
import type { ChatMessage } from '@/types/chatbot'
import { cn } from '@/utils/cn'
import { formatINR, formatTime } from '@/utils/format'

/** Renders **bold** segments and line breaks without HTML injection. */
export function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split('\n').map((line, li) => (
        <Fragment key={li}>
          {li > 0 && <br />}
          {line.split('**').map((part, i) => (i % 2 === 1 ? <strong key={i} className="font-semibold text-fg">{part}</strong> : <Fragment key={i}>{part}</Fragment>))}
        </Fragment>
      ))}
    </>
  )
}

const STEPS = ['Placed', 'Packed', 'Shipped', 'Out for delivery', 'Delivered']
const STEP_INDEX = { processing: 1, shipped: 2, out_for_delivery: 3, delivered: 4, cancelled: -1 } as const

export function OrderCard({ orderId }: { orderId: string }) {
  const o = lookupOrder(orderId)
  if (!o) return null
  const step = STEP_INDEX[o.status]
  return (
    <div className="mt-2 w-full max-w-sm rounded-xl border border-line bg-popover p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 font-mono text-xs text-fg">
          <Package className="size-3.5 text-astra-cyan" aria-hidden /> {o.id}
        </span>
        <Badge tone={o.status === 'cancelled' ? 'red' : o.status === 'delivered' ? 'green' : 'blue'} size="xs">
          {o.status.replace(/_/g, ' ')}
        </Badge>
      </div>
      <ul className="mt-2 space-y-0.5 text-xs text-fg-2">
        {o.items.map((i) => (
          <li key={i.name} className="flex justify-between gap-2">
            <span className="truncate">
              {i.qty > 1 ? `${i.qty}× ` : ''}
              {i.name}
            </span>
            <span className="tabular-nums">{formatINR(i.price * i.qty)}</span>
          </li>
        ))}
      </ul>
      {step >= 0 && (
        <div className="mt-3 flex items-center gap-1" aria-label={`Progress: ${STEPS[step]}`}>
          {STEPS.map((s, i) => (
            <span key={s} className={cn('h-1 flex-1 rounded-full', i <= step ? 'bg-brand' : 'bg-ink/10')} title={s} />
          ))}
        </div>
      )}
      {o.carrier && (
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-fg-3">
          <Truck className="size-3" aria-hidden /> {o.carrier} · {o.tracking}
        </p>
      )}
    </div>
  )
}

export function LeadCard({ lead }: { lead: LeadState }) {
  const tone = lead.tier === 'Hot' ? 'red' : lead.tier === 'Warm' ? 'amber' : 'blue'
  return (
    <div className="mt-2 w-full max-w-sm rounded-xl border border-line bg-popover p-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-medium text-fg">
          <UserRoundCheck className="size-3.5 text-emerald-300" aria-hidden /> Qualified lead
        </span>
        <Badge tone={tone} size="xs">
          {lead.tier} · {lead.score}/100
        </Badge>
      </div>
      <Meter className="mt-2" value={lead.score} max={100} tone={lead.tier === 'Hot' ? 'good' : lead.tier === 'Warm' ? 'warning' : 'brand'} size="xs" label="Lead score" />
      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
        {lead.answers.quantity !== undefined && <Item k="Quantity" v={lead.answers.quantity.toLocaleString('en-IN')} />}
        {lead.answers.company && <Item k="Company" v={lead.answers.company} />}
        {lead.answers.budget !== undefined && <Item k="Budget" v={lead.answers.budget ? `~${formatINR(lead.answers.budget)}` : 'Not shared'} />}
        {lead.answers.timeline && <Item k="Timeline" v={lead.answers.timeline} />}
      </dl>
    </div>
  )
}

function Item({ k, v }: { k: string; v: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-fg-4">{k}</dt>
      <dd className="truncate text-fg-2">{v}</dd>
    </div>
  )
}

export function MessageBubble({ message, lead, children }: { message: ChatMessage; lead: LeadState; children?: ReactNode }) {
  if (message.role === 'system') {
    return (
      <div className="flex items-center gap-3 py-1 text-[11px] text-fg-3" role="note">
        <span className="h-px flex-1 bg-line" />
        <span className="flex items-center gap-1.5">
          <Headset className="size-3.5 text-amber-300" aria-hidden /> {message.text}
        </span>
        <span className="h-px flex-1 bg-line" />
      </div>
    )
  }
  const customer = message.role === 'customer'
  return (
    <div className={cn('flex gap-2.5', customer && 'flex-row-reverse')}>
      {message.role === 'bot' && (
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-brand/15 ring-1 ring-brand/30">
          <Bot className="size-3.5 text-brand-soft" aria-hidden />
        </span>
      )}
      {message.role === 'agent' && <Avatar name={AGENT_NAME} size={28} className="mt-0.5" />}
      <div className={cn('flex min-w-0 max-w-[85%] flex-col sm:max-w-[75%]', customer ? 'items-end' : 'items-start')}>
        {message.role === 'agent' && <span className="mb-1 text-[11px] text-fg-3">{AGENT_NAME} · Support agent</span>}
        <div
          className={cn(
            'rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed',
            customer ? 'rounded-br-md bg-brand-strong text-on-brand' : message.role === 'agent' ? 'rounded-bl-md bg-astra-violet/15 text-fg-2 ring-1 ring-astra-violet/25' : 'rounded-bl-md bg-ink/[0.06] text-fg-2',
          )}
        >
          {customer ? message.text : <RichText text={message.text} />}
        </div>
        {message.card?.type === 'order' && <OrderCard orderId={message.card.orderId} />}
        {message.card?.type === 'lead' && <LeadCard lead={lead} />}
        {message.source && (
          <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-fg-3">
            <FileText className="size-3" aria-hidden /> Source: {message.source}
          </span>
        )}
        <span className="mt-1 flex items-center gap-1 text-[10px] text-fg-4">
          {formatTime(message.at)}
          {customer && <Check className="size-3" aria-label="Delivered" />}
        </span>
        {children}
      </div>
    </div>
  )
}

export function TypingIndicator({ who = 'Astra Assist' }: { who?: string }) {
  return (
    <div className="flex items-center gap-2.5" role="status" aria-label={`${who} is typing`}>
      <span className="flex size-7 items-center justify-center rounded-full bg-brand/15 ring-1 ring-brand/30">
        <Bot className="size-3.5 text-brand-soft" aria-hidden />
      </span>
      <span className="flex gap-1 rounded-2xl rounded-bl-md bg-ink/[0.06] px-3.5 py-3">
        {[0, 1, 2].map((i) => (
          <span key={i} className="animate-blink size-1.5 rounded-full bg-fg-3" style={{ animationDelay: `${i * 0.18}s` }} />
        ))}
      </span>
    </div>
  )
}
