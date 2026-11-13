import type { LoanTerms } from './loan-schedule'
import { whatIf } from './what-if'

const terms100k: LoanTerms = { kind: 'annuitet', startBalance: 10_000_000, startDate: '2026-01-10', termMonths: 12, feePerTerm: 0, dueDay: 15, rates: [{ validFrom: '2026-01-10', nominalRate: 1200 }] }

test('ekstra 1 000 kr/mnd sparer en måned og renter', () => {
  expect(whatIf(terms100k, {}, [100_000])[0]).toEqual({ extra: 100_000, payoffMonth: '2026-12', monthsSaved: 1, interestSaved: 65_478 })
})

test('null ekstra gir ingen besparelse', () => {
  expect(whatIf(terms100k, {}, [0])[0]).toEqual({ extra: 0, payoffMonth: '2027-01', monthsSaved: 0, interestSaved: 0 })
})
