import { deductionRate, interestDeduction } from './tax'

test('kjent sats for 2026', () => expect(deductionRate(2026)).toEqual({ rate: 2200, assumed: false }))
test('ukjent år bruker siste kjente sats', () => expect(deductionRate(2027)).toEqual({ rate: 2200, assumed: true }))
test('rentefradrag og netto', () => {
  expect(interestDeduction(14_790_000, 2026)).toEqual({ deduction: 3_253_800, net: 11_536_200, rate: 2200, assumed: false })
})
