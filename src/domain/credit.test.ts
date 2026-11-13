import { creditPayoff } from './credit'

test('kredittkortet fra skissene blir nedbetalt på 14 måneder', () => {
  expect(creditPayoff(2_430_000, 2290, 200_000, '2026-12')).toEqual({ kind: 'paid', months: 14, payoffMonth: '2028-01', totalInterest: 360_953 })
})

test('innbetaling som ikke dekker renta gir aldri', () => {
  expect(creditPayoff(2_430_000, 2290, 40_000, '2026-12')).toEqual({ kind: 'never' })
  expect(creditPayoff(2_430_000, 2290, 46_372, '2026-12')).toEqual({ kind: 'never' })
})

test('null saldo er allerede nedbetalt', () => {
  expect(creditPayoff(0, 2290, 200_000, '2026-12')).toEqual({ kind: 'paid', months: 0, payoffMonth: '2026-11', totalInterest: 0 })
})
