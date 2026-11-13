import { buildSchedule } from './loan-schedule'
import { interestForYear, loanStatus, termsOf } from './loan-status'
import type { Loan, MonthlyEntry } from './types'

const loan: Loan = {
  id: 'L1', name: 'Testlån', lender: 'Bank', kind: 'annuitet', startBalance: 10_000_000, startDate: '2026-01-10',
  termMonths: 12, feePerTerm: 0, dueDay: 15, creditLimit: null, monthlyPayment: null, closedAt: null,
}
const rates = [{ validFrom: '2026-01-10', nominalRate: 1200 }]
const plan = buildSchedule(termsOf(loan, rates))
const entry = (month: string, actualBalance: number, extra: Partial<MonthlyEntry> = {}): MonthlyEntry => ({
  id: month, loanId: 'L1', month, actualBalance, actualInterest: null, extraPayment: null, note: null, ...extra,
})

test('uten registreringer følger status planen', () => {
  const s = loanStatus(loan, rates, [], '2026-03')
  expect(s.aheadBy).toBe(0)
  expect(s.forecast).toEqual(s.plan)
  expect(s.currentBalance).toBe(plan[1].balance)
  expect(s.monthlyCost).toBe(888_488)
  expect(s.payoffMonth).toBe('2027-01')
  expect(s.paidOff).toBe(false)
})

test('registrert restgjeld under plan gir foran plan og ny prognose', () => {
  const s = loanStatus(loan, rates, [entry('2026-03', 8_000_000)], '2026-03')
  expect(s.plannedBalance).toBe(plan[1].balance)
  expect(s.aheadBy).toBe(plan[1].balance - 8_000_000)
  expect(s.currentBalance).toBe(8_000_000)
  expect(s.deviationPct).toBeCloseTo(((plan[1].balance - 8_000_000) / plan[1].balance) * 100, 6)
  expect(s.forecast[0].month).toBe('2026-04')
  expect(s.forecast[s.forecast.length - 1].balance).toBe(0)
})

test('registreringer etter currentMonth ignoreres', () => {
  const s = loanStatus(loan, rates, [entry('2026-09', 1)], '2026-03')
  expect(s.aheadBy).toBe(0)
})

test('restgjeld 0 betyr nedbetalt', () => {
  const s = loanStatus(loan, rates, [entry('2026-05', 0)], '2026-06')
  expect(s.paidOff).toBe(true)
  expect(s.payoffMonth).toBe('2026-05')
  expect(s.monthlyCost).toBe(0)
})

test('kreditt med for lav betaling blir aldri nedbetalt', () => {
  const credit: Loan = { ...loan, kind: 'kreditt', startBalance: 2_430_000, termMonths: null, monthlyPayment: 40_000, creditLimit: 5_000_000 }
  const s = loanStatus(credit, [{ validFrom: '2026-01-10', nominalRate: 2290 }], [], '2026-01')
  expect(s.never).toBe(true)
  expect(s.payoffMonth).toBeNull()
  expect(s.plan).toEqual([])
})

test('kreditt med nok betaling', () => {
  const credit: Loan = { ...loan, kind: 'kreditt', startBalance: 2_430_000, startDate: '2026-11-13', termMonths: null, monthlyPayment: 200_000, creditLimit: 5_000_000 }
  const s = loanStatus(credit, [{ validFrom: '2026-11-13', nominalRate: 2290 }], [], '2026-11')
  expect(s).toMatchObject({ never: false, payoffMonth: '2028-01', monthlyCost: 200_000, currentBalance: 2_430_000 })
})

test('interestForYear bruker faktisk rente der den er registrert', () => {
  const withActual = interestForYear(loan, rates, [entry('2026-02', plan[0].balance, { actualInterest: 123_456 })], 2026, '2026-03')
  // feb: faktisk 123 456, mars: planens rente for mars
  expect(withActual.soFar).toBe(123_456 + plan[1].interest)
  const planOnly = interestForYear(loan, rates, [], 2026, '2026-12')
  const planYear = plan.filter((r) => r.month.startsWith('2026')).reduce((s, r) => s + r.interest, 0)
  expect(planOnly.soFar).toBe(planYear)
  expect(planOnly.fullYear).toBe(planYear)
})

test('interestForYear tar med prognose for resten av året', () => {
  const r = interestForYear(loan, rates, [], 2026, '2026-03')
  const planYear = plan.filter((x) => x.month.startsWith('2026')).reduce((s, x) => s + x.interest, 0)
  expect(r.fullYear).toBe(planYear)
  expect(r.soFar).toBe(plan[0].interest + plan[1].interest)
})
