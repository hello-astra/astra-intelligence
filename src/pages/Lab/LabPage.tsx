import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { Container } from '@/components/common/Container'
import { PageHero } from '@/components/common/PageHero'
import { CTASection } from '@/components/sections/CTASection'
import { LabGrid, LabPrinciples } from '@/components/sections/LabShowcase'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/toast-context'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { storage } from '@/services/storage'

export default function LabPage() {
  useDocumentTitle('Interactive Solutions Lab', 'Nine working product demonstrations from Astra Intelligence with realistic sample data.')
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

      <section aria-label="Lab controls" className="pb-8">
        <Container className="flex justify-end">
          <Button variant="secondary" size="sm" leftIcon={<RotateCcw className="size-3.5" />} onClick={() => setConfirm(true)}>
            Reset all demos
          </Button>
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
