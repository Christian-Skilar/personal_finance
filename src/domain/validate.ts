import type { LoanKind } from './loan-schedule'
import { parseNok, parseRate, type RateBp } from './money'
import type { Loan } from './types'

export interface LoanForm {
  kind: LoanKind
  name: string
  lender: string
  balance: string
  date: string
  rate: string
  years: string
  months: string
  fee: string
  dueDay: string
  creditLimit: string
  monthlyPayment: string
}

export type LoanInput = Omit<Loan, 'id' | 'closedAt'>

export type ValidationResult =
  | { ok: true; loan: LoanInput; rate: RateBp }
  | { ok: false; errors: Partial<Record<keyof LoanForm, string>> }

export const MSG = {
  name: 'Skriv inn et navn',
  amount: 'Skriv et gyldig beløp, f.eks. 2 450 000',
  rate: 'Renten må være mellom 0 og 100 %',
  months: 'Måneder må være mellom 0 og 11',
  term: 'Løpetiden må være minst 1 måned',
  dueDay: 'Forfallsdag må være mellom 1 og 31',
  date: 'Velg en dato',
  monthlyPayment: 'Skriv hvor mye du betaler per måned',
} as const

const isInt = (s: string) => /^\d+$/.test(s.trim())

export function validateLoanForm(f: LoanForm): ValidationResult {
  const errors: Partial<Record<keyof LoanForm, string>> = {}
  const isCredit = f.kind === 'kreditt'

  const name = f.name.trim()
  if (!name) errors.name = MSG.name

  const balance = parseNok(f.balance)
  if (balance === null) errors.balance = MSG.amount

  if (!/^\d{4}-\d{2}-\d{2}$/.test(f.date) || Number.isNaN(Date.parse(f.date))) errors.date = MSG.date

  const rate = parseRate(f.rate)
  if (rate === null) errors.rate = MSG.rate

  const dueDay = isInt(f.dueDay) ? Number(f.dueDay) : NaN
  if (!(dueDay >= 1 && dueDay <= 31)) errors.dueDay = MSG.dueDay

  let termMonths: number | null = null
  let fee = 0
  let creditLimit: number | null = null
  let monthlyPayment: number | null = null

  if (isCredit) {
    if (f.creditLimit.trim()) {
      creditLimit = parseNok(f.creditLimit)
      if (creditLimit === null) errors.creditLimit = MSG.amount
    }
    monthlyPayment = parseNok(f.monthlyPayment)
    if (monthlyPayment === null || monthlyPayment === 0) errors.monthlyPayment = MSG.monthlyPayment
  } else {
    const years = f.years.trim() === '' ? 0 : isInt(f.years) ? Number(f.years) : NaN
    const months = f.months.trim() === '' ? 0 : isInt(f.months) ? Number(f.months) : NaN
    if (!(months >= 0 && months <= 11)) errors.months = MSG.months
    if (Number.isNaN(years)) errors.years = MSG.term
    if (!errors.months && !errors.years) {
      termMonths = years * 12 + months
      if (termMonths < 1) errors.years = MSG.term
    }
    if (f.fee.trim()) {
      const parsed = parseNok(f.fee)
      if (parsed === null) errors.fee = MSG.amount
      else fee = parsed
    }
  }

  if (Object.keys(errors).length) return { ok: false, errors }
  return {
    ok: true,
    rate: rate!,
    loan: {
      kind: f.kind,
      name,
      lender: f.lender.trim(),
      startBalance: balance!,
      startDate: f.date,
      termMonths,
      feePerTerm: fee,
      dueDay,
      creditLimit,
      monthlyPayment,
    },
  }
}
