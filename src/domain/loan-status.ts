import { creditPayoff } from './credit'
import { buildSchedule, monthlyInterest, rateAt, type Installment, type LoanTerms, type RateChange } from './loan-schedule'
import type { Ore } from './money'
import { addMonths, dueDate, monthsBetween, toYearMonth, type YearMonth } from './month'
import type { Loan, MonthlyEntry } from './types'

export interface LoanStatus {
  currentBalance: Ore
  plannedBalance: Ore
  /** Positiv = foran plan. */
  aheadBy: Ore
  deviationPct: number
  monthlyCost: Ore
  payoffMonth: YearMonth | null
  paidOff: boolean
  never: boolean
  plan: Installment[]
  forecast: Installment[]
}

export function termsOf(loan: Loan, rates: RateChange[]): LoanTerms {
  if (loan.kind === 'kreditt' || loan.termMonths === null) throw new Error('Kreditt har ingen nedbetalingsplan')
  return {
    kind: loan.kind,
    startBalance: loan.startBalance,
    startDate: loan.startDate,
    termMonths: loan.termMonths,
    feePerTerm: loan.feePerTerm,
    dueDay: loan.dueDay,
    rates,
  }
}

export function latestEntry(entries: MonthlyEntry[], currentMonth: YearMonth): MonthlyEntry | undefined {
  return entries
    .filter((e) => e.month <= currentMonth)
    .sort((a, b) => a.month.localeCompare(b.month))
    .pop()
}

/** Planlagt restgjeld etter terminen i måneden `month`. */
function plannedBalanceAt(loan: Loan, plan: Installment[], month: YearMonth): Ore {
  let balance = loan.startBalance
  for (const row of plan) {
    if (row.month > month) break
    balance = row.balance
  }
  return balance
}

interface CreditMonth {
  month: YearMonth
  interest: Ore
  balance: Ore
}

/** Kredittsaldo måned for måned med fast innbetaling, fra måneden etter fromMonth til og med toMonth. */
function creditSeries(loan: Loan, rates: RateChange[], fromBalance: Ore, fromMonth: YearMonth, toMonth: YearMonth): CreditMonth[] {
  const out: CreditMonth[] = []
  let balance = fromBalance
  const payment = loan.monthlyPayment ?? 0
  for (let m = addMonths(fromMonth, 1); m <= toMonth && out.length < 600; m = addMonths(m, 1)) {
    const interest = balance > 0 ? monthlyInterest(balance, rateAt(rates, dueDate(m, loan.dueDay))) : 0
    balance = Math.max(0, balance + interest - Math.min(payment, balance + interest))
    out.push({ month: m, interest, balance })
  }
  return out
}

function deviation(aheadBy: Ore, planned: Ore): number {
  return planned > 0 ? (Math.abs(aheadBy) / planned) * 100 : 0
}

export function loanStatus(loan: Loan, rates: RateChange[], entries: MonthlyEntry[], currentMonth: YearMonth): LoanStatus {
  const startMonth = toYearMonth(loan.startDate)
  const last = latestEntry(entries, currentMonth)

  if (loan.kind === 'kreditt') {
    const refMonth = last?.month ?? currentMonth
    const series = creditSeries(loan, rates, loan.startBalance, startMonth, refMonth)
    const plannedBalance = series.length ? series[series.length - 1].balance : loan.startBalance
    const currentBalance = last ? last.actualBalance : plannedBalance
    const aheadBy = last ? plannedBalance - currentBalance : 0
    const rate = rateAt(rates, dueDate(refMonth, loan.dueDay))
    const payoff = creditPayoff(currentBalance, rate, loan.monthlyPayment ?? 0, addMonths(refMonth, 1))
    const paidOff = currentBalance <= 0
    return {
      currentBalance,
      plannedBalance,
      aheadBy,
      deviationPct: deviation(aheadBy, plannedBalance),
      monthlyCost: paidOff ? 0 : (loan.monthlyPayment ?? 0),
      payoffMonth: paidOff ? refMonth : payoff.kind === 'paid' ? payoff.payoffMonth : null,
      paidOff,
      never: !paidOff && payoff.kind === 'never',
      plan: [],
      forecast: [],
    }
  }

  const terms = termsOf(loan, rates)
  const plan = buildSchedule(terms)
  if (!last) {
    const currentBalance = plannedBalanceAt(loan, plan, currentMonth)
    const next = plan.find((r) => r.month > currentMonth)
    return {
      currentBalance,
      plannedBalance: currentBalance,
      aheadBy: 0,
      deviationPct: 0,
      monthlyCost: next?.payment ?? 0,
      payoffMonth: plan.length ? plan[plan.length - 1].month : null,
      paidOff: currentBalance <= 0,
      never: false,
      plan,
      forecast: plan,
    }
  }

  const plannedBalance = plannedBalanceAt(loan, plan, last.month)
  const currentBalance = last.actualBalance
  const aheadBy = plannedBalance - currentBalance
  const paidOff = currentBalance <= 0
  const forecast = paidOff ? [] : buildSchedule(terms, { fromBalance: currentBalance, fromMonth: last.month })
  const next = forecast.find((r) => r.month > currentMonth)
  return {
    currentBalance,
    plannedBalance,
    aheadBy,
    deviationPct: deviation(aheadBy, plannedBalance),
    monthlyCost: next?.payment ?? 0,
    payoffMonth: paidOff ? last.month : forecast.length ? forecast[forecast.length - 1].month : last.month,
    paidOff,
    never: false,
    plan,
    forecast,
  }
}

/** Renter i et kalenderår: faktisk der registrert, ellers plan; resten av året fra prognosen. */
export function interestForYear(
  loan: Loan,
  rates: RateChange[],
  entries: MonthlyEntry[],
  year: number,
  currentMonth: YearMonth,
): { soFar: Ore; fullYear: Ore } {
  const months = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`)
  const actual = new Map<YearMonth, Ore>()
  for (const e of entries) if (e.actualInterest !== null) actual.set(e.month, e.actualInterest)
  const status = loanStatus(loan, rates, entries, currentMonth)

  let planned: Map<YearMonth, Ore>
  let future: Map<YearMonth, Ore>
  if (loan.kind === 'kreditt') {
    const startMonth = toYearMonth(loan.startDate)
    planned = new Map(creditSeries(loan, rates, loan.startBalance, startMonth, `${year}-12`).map((r) => [r.month, r.interest]))
    const ref = latestEntry(entries, currentMonth)?.month ?? currentMonth
    future = new Map(creditSeries(loan, rates, status.currentBalance, ref, `${year}-12`).map((r) => [r.month, r.interest]))
  } else {
    planned = new Map(status.plan.map((r) => [r.month, r.interest]))
    future = new Map(status.forecast.map((r) => [r.month, r.interest]))
  }

  let soFar = 0
  let rest = 0
  for (const m of months) {
    if (monthsBetween(m, currentMonth) >= 0) soFar += actual.get(m) ?? planned.get(m) ?? 0
    else rest += future.get(m) ?? 0
  }
  return { soFar, fullYear: soFar + rest }
}
