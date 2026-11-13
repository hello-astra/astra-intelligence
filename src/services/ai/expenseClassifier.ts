/**
 * Expense categorization (demo).
 *
 * A transparent merchant/keyword classifier that returns a category, a
 * confidence and a human-readable reason — standing in for a trained ML model.
 * Learned merchant rules (created when a user corrects a suggestion) always
 * win. A production build implements the same ExpenseClassifier interface
 * against a model endpoint.
 */
import type { ExpenseCategory, MerchantRule } from '@/types/fintech'

export interface Classification {
  category: ExpenseCategory | 'Uncategorized'
  confidence: number
  reason: string
  source: 'rule' | 'model'
}

export interface ExpenseClassifier {
  classify(description: string, amount: number, rules: MerchantRule[]): Classification
}

const KEYWORDS: Record<ExpenseCategory, string[]> = {
  Food: ['swiggy', 'zomato', 'starbucks', 'blue tokai', 'coffee', 'cafe', 'restaurant', 'lunch', 'dinner', 'pizza', 'bakery', 'dominos', 'chaayos', 'zepto', 'blinkit'],
  Transportation: ['uber', 'ola cabs', 'ola ', 'rapido', 'metro', 'fuel', 'petrol', 'parking', 'fastag', 'irctc', 'cab'],
  Software: ['aws', 'amazon web services', 'google workspace', 'github', 'figma', 'slack', 'atlassian', 'jira', 'notion', 'zoom', 'microsoft', 'adobe', 'canva', 'digitalocean', 'vercel', 'saas'],
  Marketing: ['google ads', 'adwords', 'linkedin ads', 'meta ads', 'facebook ads', 'instagram ads', 'campaign', 'influencer', 'marketing', 'seo'],
  Utilities: ['electricity', 'bescom', 'tata power', 'airtel', 'jio', 'broadband', 'internet', 'water bill', 'postpaid', 'vodafone', 'bsnl'],
  Salaries: ['salary', 'payroll', 'wages', 'stipend', 'bonus'],
  Travel: ['indigo', 'air india', 'vistara', 'makemytrip', 'goibibo', 'hotel', 'taj ', 'oyo', 'airbnb', 'flight', 'cleartrip', 'pnr'],
  Office: ['wework', 'amazon business', 'stationer', 'furniture', 'office', 'printer', 'supplies', 'cowork', 'courier'],
}

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase())
}

export const ruleBasedClassifier: ExpenseClassifier = {
  classify(description, amount, rules) {
    const text = ` ${description.toLowerCase()} `
    const rule = rules.find((r) => text.includes(r.pattern.toLowerCase()))
    if (rule) return { category: rule.category, confidence: 0.99, reason: `Matched your rule “${rule.pattern}” → ${rule.category}`, source: 'rule' }

    const scores = (Object.keys(KEYWORDS) as ExpenseCategory[]).map((category) => {
      const hits = KEYWORDS[category].filter((k) => text.includes(k))
      const score = hits.reduce((s, k) => s + (k.trim().length >= 6 ? 2.2 : 1.6), 0)
      return { category, score, hits }
    })
    // Amount heuristics: very large debits named "payout" look like payroll.
    if (amount >= 5_00_000 && /payout|neft dr/i.test(description)) scores.find((s) => s.category === 'Salaries')!.score += 1
    scores.sort((a, b) => b.score - a.score)
    const [top, second] = scores
    if (top.score === 0) return { category: 'Uncategorized', confidence: 0.3, reason: 'No known merchant or keyword — needs a human review', source: 'model' }
    const margin = top.score / (top.score + (second?.score ?? 0) + 0.6)
    const confidence = Math.min(0.97, 0.52 + margin * 0.5)
    return {
      category: top.category,
      confidence: Number(confidence.toFixed(2)),
      reason: `“${titleCase(top.hits[0].trim())}” is a known ${top.category.toLowerCase()} merchant`,
      source: 'model',
    }
  },
}

/** Suggested rule pattern from a raw statement line, e.g. "CARD 9911 FIGMA INC" → "figma". */
export function suggestPattern(description: string): string {
  const cleaned = description
    .toLowerCase()
    .replace(/^(pos|card|upi|imps|neft|ach|nach)[\s/-]*(dr|cr|d-)?[\s/-]*\d*[\s/-]*/i, '')
    .replace(/[/*#].*$/, '')
    .replace(/\b(pvt|ltd|inc|india|pty|llp)\b/g, '')
    .replace(/\d+/g, '')
    .trim()
  return cleaned.split(/\s+/).slice(0, 2).join(' ') || description.toLowerCase().slice(0, 16)
}
