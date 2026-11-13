import { rateAt, type LoanKind, type RateChange } from '../domain/loan-schedule'
import { formatNok, type RateBp } from '../domain/money'
import { dueDate, type YearMonth } from '../domain/month'
import type { LoanItem } from './useLoans'

export const KIND_LABEL: Record<LoanKind, string> = { annuitet: 'Annuitet', serie: 'Serie', kreditt: 'Kreditt' }
export const KIND_LONG: Record<LoanKind, string> = { annuitet: 'Annuitetslån', serie: 'Serielån', kreditt: 'Kreditt' }

export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export const kr = (ore: number) => formatNok(ore, { whole: true })

export const SAVE_ERROR = 'Kunne ikke lagre. Ta backup og prøv igjen.'
export const DATE_ERROR = 'Velg en dato'
export const isIsoDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s))

/** 14 → "1 år 2 mnd". */
export function durationText(months: number): string {
  const y = Math.floor(months / 12)
  const m = months % 12
  if (!y) return `${m} mnd`
  return m ? `${y} år ${m} mnd` : `${y} år`
}

/** Beløp til et redigerbart felt: "2 450 000" eller "1 234,50" (uten "kr"). */
export const amountField = (ore: number | null) => (ore === null ? '' : formatNok(ore).replace(/\s*kr$/, '').replace(/,00$/, ''))

/** Grense for når avvik vises som "foran/bak" i stedet for "På plan" (100 kr). */
const ON_PLAN = 10_000
export const HIGH_RATE: RateBp = 1500

export function currentRate(rates: RateChange[], dueDay: number, month: YearMonth): RateBp {
  return rateAt(rates, dueDate(month, dueDay))
}

export function statusChip(item: LoanItem, month: YearMonth): { text: string; tone: 'good' | 'warn' } {
  const { loan, status } = item
  if (status.paidOff) return { text: 'Nedbetalt', tone: 'good' }
  if (status.never) return { text: 'Blir aldri nedbetalt', tone: 'warn' }
  if (loan.kind === 'kreditt' && currentRate(item.rates, loan.dueDay, month) >= HIGH_RATE) return { text: 'Høy rente', tone: 'warn' }
  if (Math.abs(status.aheadBy) < ON_PLAN) return { text: 'På plan', tone: 'good' }
  return status.aheadBy > 0 ? { text: `Foran ${kr(status.aheadBy)}`, tone: 'good' } : { text: `Bak ${kr(-status.aheadBy)}`, tone: 'warn' }
}
