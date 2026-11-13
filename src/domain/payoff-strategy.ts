import { monthlyInterest } from './loan-schedule'
import type { Ore, RateBp } from './money'
import { addMonths, type YearMonth } from './month'

export type Strategy = 'skred' | 'snoball'

export interface DebtForPlan {
  id: string
  name: string
  balance: Ore
  rate: RateBp
  minPayment: Ore
}

export interface PayoffPlan {
  debtFreeMonth: YearMonth
  months: number
  totalInterest: Ore
  order: { id: string; name: string; paidOffMonth: YearMonth }[]
}

const MAX_MONTHS = 600

function priority(debts: DebtForPlan[], strategy: Strategy): DebtForPlan[] {
  return [...debts].sort((a, b) =>
    strategy === 'skred' ? b.rate - a.rate || a.balance - b.balance : a.balance - b.balance || b.rate - a.rate,
  )
}

/**
 * Gjeldfri-plan: minimumsbetaling på all gjeld, ekstra beløp (pluss frigjorte minimumsbetalinger)
 * til gjelden med høyest prioritet. Måned 1 = firstMonth.
 */
export function planPayoff(debts: DebtForPlan[], extraPerMonth: Ore, strategy: Strategy, firstMonth: YearMonth): PayoffPlan {
  const ordered = priority(debts, strategy)
  const rank = new Map(ordered.map((d, i) => [d.id, i]))
  const balance = new Map(debts.map((d) => [d.id, d.balance]))
  const paidOff = new Map<string, number>()
  let months = 0
  let totalInterest = 0

  while ([...balance.values()].some((b) => b > 0) && months < MAX_MONTHS) {
    months++
    let pool = extraPerMonth
    for (const d of debts) {
      let b = balance.get(d.id)!
      if (b <= 0) {
        pool += d.minPayment
        continue
      }
      const interest = monthlyInterest(b, d.rate)
      totalInterest += interest
      b += interest
      const pay = Math.min(d.minPayment, b)
      balance.set(d.id, b - pay)
      pool += d.minPayment - pay
    }
    for (const d of ordered) {
      const b = balance.get(d.id)!
      if (b > 0 && pool > 0) {
        const pay = Math.min(pool, b)
        balance.set(d.id, b - pay)
        pool -= pay
      }
    }
    for (const d of debts) {
      if (balance.get(d.id)! <= 0 && !paidOff.has(d.id)) paidOff.set(d.id, months)
    }
  }

  const order = debts
    .filter((d) => paidOff.has(d.id))
    .sort((a, b) => paidOff.get(a.id)! - paidOff.get(b.id)! || rank.get(a.id)! - rank.get(b.id)!)
    .map((d) => ({ id: d.id, name: d.name, paidOffMonth: addMonths(firstMonth, paidOff.get(d.id)! - 1) }))

  return { debtFreeMonth: addMonths(firstMonth, months - 1), months, totalInterest, order }
}
