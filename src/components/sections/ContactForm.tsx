import { useId, useMemo, useState, type FormEvent } from 'react'
import { AlertTriangle, ArrowRight, CalendarCheck, CheckCircle2, Info, Mail, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/Form'
import { SOLUTION_INDEX as SOLUTIONS, isSolutionSlug } from '@/data/constants/solution-index'
import { buildEnquiryMailto, submitEnquiry, type Enquiry, type SubmitResult } from '@/services/contactService'
import { cn } from '@/utils/cn'

const BUDGET_OPTIONS = [
  'Under ₹5 Lakh',
  '₹5 – 15 Lakh',
  '₹15 – 40 Lakh',
  '₹40 Lakh – ₹1 Crore',
  'Above ₹1 Crore',
  'Not sure yet',
]

interface FormValues {
  fullName: string
  company: string
  email: string
  phone: string
  service: string
  budget: string
  description: string
  consultation: boolean
}

type Errors = Partial<Record<keyof FormValues, string>>

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const FREE_EMAIL_DOMAINS = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'rediffmail.com', 'proton.me']

function validate(values: FormValues): Errors {
  const errors: Errors = {}
  if (values.fullName.trim().length < 2) errors.fullName = 'Please enter your full name.'
  if (values.company.trim().length < 2) errors.company = 'Please enter your company name.'
  if (!values.email.trim()) errors.email = 'Please enter your business email.'
  else if (!EMAIL_RE.test(values.email.trim())) errors.email = 'Please enter a valid email address.'
  if (values.phone.trim()) {
    const digits = values.phone.replace(/\D/g, '')
    if (!/^[+\d][\d\s()-]*$/.test(values.phone.trim()) || digits.length < 7 || digits.length > 15) {
      errors.phone = 'Please enter a valid phone number (7–15 digits).'
    }
  }
  if (!values.service) errors.service = 'Please choose the service you are interested in.'
  const description = values.description.trim()
  if (description.length < 5) errors.description = 'Please describe your project in at least 10 characters.'
  else if (description.length > 2000) errors.description = 'Please keep the description under 2,000 characters.'
  return errors
}

interface ContactFormProps {
  defaultService?: string | null
  consultation?: boolean
  className?: string
}

export function ContactForm({ defaultService, consultation = false, className }: ContactFormProps) {
  const id = useId()
  const initial = useMemo<FormValues>(
    () => ({
      fullName: '',
      company: '',
      email: '',
      phone: '',
      service: defaultService && (isSolutionSlug(defaultService) || defaultService === 'not-sure') ? defaultService : '',
      budget: '',
      description: '',
      consultation,
    }),
    [defaultService, consultation],
  )
  const [values, setValues] = useState<FormValues>(initial)
  const [errors, setErrors] = useState<Errors>({})
  const [touched, setTouched] = useState<Partial<Record<keyof FormValues, boolean>>>({})
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [result, setResult] = useState<SubmitResult | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [lastEnquiry, setLastEnquiry] = useState<Enquiry | null>(null)
  // Hidden field that only bots fill in; the server discards anything that arrives with it set.
  const [honeypot, setHoneypot] = useState('')

  const fid = (name: keyof FormValues) => `${id}-${name}`

  const update = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    const next = { ...values, [key]: value }
    setValues(next)
    if (touched[key]) setErrors(validate(next))
  }

  const blur = (key: keyof FormValues) => {
    setTouched((t) => ({ ...t, [key]: true }))
    setErrors(validate(values))
  }

  const buildEnquiry = (): Enquiry => {
    const serviceLabel =
      values.service === 'not-sure' ? 'Not sure yet' : (SOLUTIONS.find((s) => s.slug === values.service)?.name ?? values.service)
    return {
      fullName: values.fullName.trim(),
      company: values.company.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      service: values.service,
      serviceLabel,
      budget: values.budget,
      description: values.description.trim(),
      consultation: values.consultation,
      submittedAt: new Date().toISOString(),
      sourcePage: window.location.pathname,
    }
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const found = validate(values)
    setErrors(found)
    setTouched({ fullName: true, company: true, email: true, phone: true, service: true, description: true })
    if (Object.keys(found).length > 0) {
      const first = (Object.keys(found) as (keyof FormValues)[])[0]
      document.getElementById(fid(first))?.focus()
      return
    }
    const enquiry = buildEnquiry()
    setLastEnquiry(enquiry)
    setStatus('submitting')
    setSubmitError(null)
    try {
      const res = await submitEnquiry(enquiry, honeypot)
      setResult(res)
      setStatus('success')
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Something went wrong while sending your enquiry.')
      setStatus('error')
    }
  }

  const reset = () => {
    setHoneypot('')
    setValues(initial)
    setErrors({})
    setTouched({})
    setStatus('idle')
    setResult(null)
    setSubmitError(null)
  }

  const err = (key: keyof FormValues) => (touched[key] ? errors[key] : undefined)
  const describedBy = (key: keyof FormValues) => (err(key) ? `${fid(key)}-error` : undefined)
  const emailDomain = values.email.split('@')[1]?.toLowerCase()
  const freeEmail = !err('email') && emailDomain && FREE_EMAIL_DOMAINS.includes(emailDomain)

  return (
    <div className={cn('relative', className)}>
      {status === 'success' && result && lastEnquiry ? (
          <div
            key="success"
            className="animate-enter flex flex-col items-start"
            role="status"
            aria-live="polite"
          >
            <span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/15 ring-1 ring-emerald-500/30">
              <CheckCircle2 className="size-6 text-emerald-300" aria-hidden />
            </span>
            <h3 className="mt-5 text-xl font-semibold text-fg">Thank you — your enquiry has been received.</h3>
            <p className="mt-2 text-sm leading-relaxed text-fg-2">
              Our team will review your requirements and reply to <span className="text-fg">{lastEnquiry.email}</span>. Your
              reference is <span className="font-mono text-fg">{result.reference}</span>.
            </p>
            <Button variant="ghost" size="sm" className="mt-6" leftIcon={<RotateCcw className="size-3.5" />} onClick={reset}>
              Send another enquiry
            </Button>
          </div>
        ) : (
          <form
            key="form"
            noValidate
            onSubmit={onSubmit}
            aria-describedby={`${id}-mode`}
            className="grid gap-5 sm:grid-cols-2"
          >
            <div aria-hidden className="absolute -left-[9999px] size-px overflow-hidden">
              <label>
                Website
                <input type="text" name="website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
              </label>
            </div>
            <Field label="Full name" htmlFor={fid('fullName')} error={err('fullName')} required>
              <Input
                id={fid('fullName')}
                name="fullName"
                autoComplete="name"
                value={values.fullName}
                onChange={(e) => update('fullName', e.target.value)}
                onBlur={() => blur('fullName')}
                aria-invalid={Boolean(err('fullName'))}
                aria-describedby={describedBy('fullName')}
                placeholder="Priya Sharma"
              />
            </Field>
            <Field label="Company name" htmlFor={fid('company')} error={err('company')} required>
              <Input
                id={fid('company')}
                name="company"
                autoComplete="organization"
                value={values.company}
                onChange={(e) => update('company', e.target.value)}
                onBlur={() => blur('company')}
                aria-invalid={Boolean(err('company'))}
                aria-describedby={describedBy('company')}
                placeholder="Your organization"
              />
            </Field>
            <Field
              label="Business email"
              htmlFor={fid('email')}
              error={err('email')}
              hint={freeEmail ? 'A company email helps us respond faster — personal addresses are fine too.' : undefined}
              required
            >
              <Input
                id={fid('email')}
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={values.email}
                onChange={(e) => update('email', e.target.value)}
                onBlur={() => blur('email')}
                aria-invalid={Boolean(err('email'))}
                aria-describedby={describedBy('email') ?? (freeEmail ? `${fid('email')}-hint` : undefined)}
                placeholder="you@company.com"
              />
            </Field>
            <Field label="Phone number" htmlFor={fid('phone')} error={err('phone')} hint="Optional">
              <Input
                id={fid('phone')}
                name="phone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                value={values.phone}
                onChange={(e) => update('phone', e.target.value)}
                onBlur={() => blur('phone')}
                aria-invalid={Boolean(err('phone'))}
                aria-describedby={describedBy('phone') ?? `${fid('phone')}-hint`}
                placeholder="+91 98765 43210"
              />
            </Field>
            <Field label="Service interested in" htmlFor={fid('service')} error={err('service')} required>
              <Select
                id={fid('service')}
                name="service"
                value={values.service}
                onChange={(e) => update('service', e.target.value)}
                onBlur={() => blur('service')}
                aria-invalid={Boolean(err('service'))}
                aria-describedby={describedBy('service')}
              >
                <option value="" disabled>
                  Select a service
                </option>
                {SOLUTIONS.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {s.name}
                  </option>
                ))}
                <option value="not-sure">Not sure yet — need guidance</option>
              </Select>
            </Field>
            <Field label="Project budget" htmlFor={fid('budget')} hint="Optional — helps us suggest the right scope">
              <Select
                id={fid('budget')}
                name="budget"
                value={values.budget}
                onChange={(e) => update('budget', e.target.value)}
                aria-describedby={`${fid('budget')}-hint`}
              >
                <option value="">Select a range</option>
                {BUDGET_OPTIONS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label="Project description"
              htmlFor={fid('description')}
              error={err('description')}
              required
              className="sm:col-span-2"
              hint={`${values.description.trim().length}/2000 — goals, current process, systems involved and timelines.`}
            >
              <Textarea
                id={fid('description')}
                name="description"
                rows={5}
                value={values.description}
                onChange={(e) => update('description', e.target.value)}
                onBlur={() => blur('description')}
                aria-invalid={Boolean(err('description'))}
                aria-describedby={describedBy('description') ?? `${fid('description')}-hint`}
                placeholder="Tell us what you want to build or automate, who will use it and what success looks like."
              />
            </Field>

            <div className="sm:col-span-2">
              <Checkbox
                id={fid('consultation')}
                checked={values.consultation}
                onChange={(e) => update('consultation', e.target.checked)}
                label={
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarCheck className="size-4 text-brand-soft" aria-hidden />
                    I’d like to book a free consultation call
                  </span>
                }
              />
            </div>

            {status === 'error' && (
              <div role="alert" className="flex gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 sm:col-span-2">
                <AlertTriangle className="size-5 shrink-0 text-red-300" aria-hidden />
                <div className="text-sm">
                  <p className="font-medium text-red-200">We couldn’t send your enquiry.</p>
                  <p className="mt-1 text-red-200/80">{submitError} Your details are still in the form — please try again.</p>
                  {lastEnquiry && (
                    <a href={buildEnquiryMailto(lastEnquiry)} className="mt-2 inline-flex items-center gap-1.5 font-medium text-red-100 underline underline-offset-4">
                      <Mail className="size-3.5" /> Or send it by email instead
                    </a>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
              <p id={`${id}-mode`} className="flex items-start gap-2 text-xs text-fg-3">
                <Info className="mt-px size-3.5 shrink-0" aria-hidden />
                Your details are used only to respond to this enquiry.
              </p>
              <Button type="submit" size="lg" loading={status === 'submitting'} rightIcon={<ArrowRight className="size-4" />} className="shrink-0">
                {status === 'submitting' ? 'Sending…' : 'Let’s Build Something Intelligent'}
              </Button>
            </div>
          </form>
        )}
    </div>
  )
}
