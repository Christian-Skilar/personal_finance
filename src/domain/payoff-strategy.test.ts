import { planPayoff, type DebtForPlan } from './payoff-strategy'

const debts: DebtForPlan[] = [
  { id: 'A', name: 'A', balance: 1_000_000, rate: 2000, minPayment: 100_000 },
  { id: 'B', name: 'B', balance: 5_000_000, rate: 500, minPayment: 100_000 },
  { id: 'C', name: 'C', balance: 300_000, rate: 1000, minPayment: 50_000 },
]

test('skred betaler høyest rente først', () => {
  const sk = planPayoff(debts, 100_000, 'skred', '2027-01')
  expect(sk).toMatchObject({ months: 19, debtFreeMonth: '2028-07', totalInterest: 310_041 })
  expect(sk.order.map((o) => [o.id, o.paidOffMonth])).toEqual([['A', '2027-06'], ['C', '2027-06'], ['B', '2028-07']])
})

test('snøball betaler minst gjeld først', () => {
  const sn = planPayoff(debts, 100_000, 'snoball', '2027-01')
  expect(sn).toMatchObject({ months: 19, totalInterest: 315_738 })
  expect(sn.order[0]).toMatchObject({ id: 'C', paidOffMonth: '2027-03' })
})

test('uten ekstra beløp', () => {
  expect(planPayoff(debts, 0, 'skred', '2027-01')).toMatchObject({ months: 28, totalInterest: 454_705 })
})

test('stopper etter 600 måneder når gjelden aldri blir betalt', () => {
  const p = planPayoff([{ id: 'X', name: 'X', balance: 1_000_000, rate: 2400, minPayment: 100 }], 0, 'skred', '2027-01')
  expect(p.months).toBe(600)
  expect(p.order).toEqual([])
})
