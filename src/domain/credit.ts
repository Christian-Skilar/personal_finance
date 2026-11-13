import { monthlyInterest } from './loan-schedule'
import type { Ore, RateBp } from './money'
import { addMonths, type YearMonth } from './month'

export type CreditPayoff =
  | { kind: 'paid'; months: number; payoffMonth: YearMonth; totalInterest: Ore }
  | { kind: 'never' }

const MAX_MONTHS = 600

/** Når kreditt er nedbetalt med fast månedlig innbetaling. Måned 1 = firstMonth. */
export function creditPayoff(balance: Ore, rate: RateBp, monthlyPayment: Ore, firstMonth: YearMonth): CreditPayoff {
  if (balance <= 0) return { kind: 'paid', months: 0, payoffMonth: addMonths(firstMonth, -1), totalInterest: 0 }
  if (monthlyPayment <= monthlyInterest(balance, rate)) return { kind: 'never' }

  let months = 0
  let totalInterest = 0
  while (balance > 0) {
    if (months >= MAX_MONTHS) return { kind: 'never' }
    months++
    const interest = monthlyInterest(balance, rate)
    totalInterest += interest
    balance += interest - Math.min(monthlyPayment, balance + interest)
  }
  return { kind: 'paid', months, payoffMonth: addMonths(firstMonth, months - 1), totalInterest }
}
