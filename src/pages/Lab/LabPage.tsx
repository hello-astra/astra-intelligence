import { useState } from 'react'
import { CircleCheck, FlaskConical, RotateCcw, ShieldCheck } from 'lucide-react'
import { Container } from '@/components/common/Container'
import { PageHero } from '@/components/common/PageHero'
import { Reveal } from '@/components/common/Reveal'
import { CTASection } from '@/components/sections/CTASection'
import { LabGrid, LabPrinciples } from '@/components/sections/LabShowcase'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/toast-context'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { storage } from '@/services/storage'

const REAL = [
  'Interfaces, navigation and workflows',
  'Business logic: stock, totals, quotas, payroll maths, budgets',
  'Statistical forecasting, anomaly detection and validation rules',
  'Search, filters, charts and CSV/JSON exports',
]

const SIMULATED = [
  'Payments, emails, messages and third-party integrations',
  'AI responses (rule-based engine in place of an LLM)',
  'OCR results for sample documents',
  'Sample companies, people and transactions',
]

export default function LabPage() {
  useDocumentTitle('Interactive Solutions Lab', 'Nine working product demonstrations from Astra Intelligence with realistic sample data and simulated operations.')
  const toast = useToast()
  const [confirm, setConfirm] = useState(false)

  const resetAll = () => {
    storage.clearPrefix('astra:demo:')
    setConfirm(false)
    toast({ title: 'All demos reset', description: 'Every demo will start with fresh sample data.', tone: 'info' })
  }

  return (
    <>
      <PageHero
        eyebrow="Interactive Solutions Lab"
        title={
          <>
            Nine working products. <span className="text-gradient-brand">Zero slide decks.</span>
          </>
        }
        description="Each demo is a functional mini-application with its own interface, navigation and realistic sample data. Explore them the way your team would use them."
      >
        <LabPrinciples />
      </PageHero>

      <section aria-label="Demo environment" className="pb-12">
        <Container>
          <Reveal>
            <div className="grid gap-6 rounded-2xl border border-amber-400/15 bg-gradient-to-br from-amber-400/[0.05] to-transparent p-5 sm:p-7 lg:grid-cols-[1.1fr_1fr_1fr_auto] lg:items-start">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/10 px-2 py-1 text-[11px] font-medium text-amber-200 ring-1 ring-amber-400/30">
                  <FlaskConical className="size-3" aria-hidden /> Demo environment
                </span>
                <p className="mt-3 text-sm leading-relaxed text-fg-2">
                  Everything runs in your browser. Your changes are stored locally so you can come back to them, and nothing is
                  sent to any server.
                </p>
              </div>
              <div>
                <h2 className="text-xs font-semibold tracking-wide text-fg-3 uppercase">Real</h2>
                <ul className="mt-3 space-y-2">
                  {REAL.map((r) => (
                    <li key={r} className="flex gap-2 text-[13px] text-fg-2">
                      <CircleCheck className="mt-0.5 size-3.5 shrink-0 text-emerald-400" aria-hidden />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h2 className="text-xs font-semibold tracking-wide text-fg-3 uppercase">Simulated</h2>
                <ul className="mt-3 space-y-2">
                  {SIMULATED.map((r) => (
                    <li key={r} className="flex gap-2 text-[13px] text-fg-2">
                      <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-amber-300" aria-hidden />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
              <Button variant="secondary" size="sm" leftIcon={<RotateCcw className="size-3.5" />} onClick={() => setConfirm(true)}>
                Reset all demos
              </Button>
            </div>
          </Reveal>
        </Container>
      </section>

      <section aria-label="All demos" className="pb-8">
        <Container>
          <LabGrid detailed />
        </Container>
      </section>

      <CTASection
        title="Seen something close to what you need?"
        description="Every demo is a starting point. We adapt the workflows, data model and integrations to your business."
        showLabLink={false}
      />

      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        size="sm"
        title="Reset all nine demos?"
        description="Any changes you made in the demos will be discarded."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setConfirm(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={resetAll} leftIcon={<RotateCcw className="size-3.5" />} data-autofocus>
              Reset all
            </Button>
          </>
        }
      >
        <p className="text-sm text-fg-2">Each demo will reload its original sample data the next time you open it.</p>
      </Modal>
    </>
  )
}
