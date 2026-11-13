import { annuityPayment, buildSchedule, rateAt, type LoanTerms } from './loan-schedule'

const base = { startDate: '2026-01-10', dueDay: 15, feePerTerm: 0 }
const r12 = [{ validFrom: '2026-01-10', nominalRate: 1200 }]
const terms100k: LoanTerms = { ...base, kind: 'annuitet', startBalance: 10_000_000, termMonths: 12, rates: r12 }
const sumInterest = (rows: { interest: number }[]) => rows.reduce((s, r) => s + r.interest, 0)

test('annuityPayment matcher fasit', () => {
  expect(annuityPayment(10_000_000, 1200, 12)).toBe(888_488)
  expect(annuityPayment(245_000_000, 520, 264)).toBe(1_559_739)
  expect(annuityPayment(120_000, 0, 12)).toBe(10_000)
})

test('rateAt velger siste endring som gjelder på datoen', () => {
  const rates = [{ validFrom: '2026-08-01', nominalRate: 600 }, { validFrom: '2026-01-10', nominalRate: 1200 }]
  expect(rateAt(rates, '2026-07-31')).toBe(1200)
  expect(rateAt(rates, '2026-08-01')).toBe(600)
})

test('annuitet 100 000 kr, 12 %, 12 mnd', () => {
  const a = buildSchedule(terms100k)
  expect(a).toHaveLength(12)
  expect(a[0]).toMatchObject({ n: 1, month: '2026-02', dueDate: '2026-02-15', rate: 1200, interest: 100_000, principal: 788_488, fee: 0, payment: 888_488, balance: 9_211_512 })
  expect(a[11]).toMatchObject({ month: '2027-01', interest: 8_797, principal: 879_688, balance: 0 })
  expect(sumInterest(a)).toBe(661_853)
})

test('termingebyr legges til betalingen', () => {
  const f = buildSchedule({ ...terms100k, feePerTerm: 5_000 })
  expect(f[0]).toMatchObject({ fee: 5_000, payment: 893_488, balance: 9_211_512 })
})

test('boliglånet fra skissene', () => {
  const b = buildSchedule({ ...base, kind: 'annuitet', startBalance: 245_000_000, termMonths: 264, rates: [{ validFrom: '2026-01-10', nominalRate: 520 }] })
  expect(b[0]).toMatchObject({ interest: 1_061_667, principal: 498_072, balance: 244_501_928 })
  expect(b).toHaveLength(264)
  expect(b[263].balance).toBe(0)
  expect(sumInterest(b)).toBe(166_771_077)
})

test('serielån 120 000 kr, 6 %, 12 mnd', () => {
  const s = buildSchedule({ ...base, kind: 'serie', startBalance: 12_000_000, termMonths: 12, rates: [{ validFrom: '2026-01-10', nominalRate: 600 }] })
  expect(s[0]).toMatchObject({ interest: 60_000, principal: 1_000_000, balance: 11_000_000 })
  expect(s[1].interest).toBe(55_000)
  expect(s[11]).toMatchObject({ interest: 5_000, balance: 0 })
})

test('renteendring beregner nytt terminbeløp', () => {
  const c = buildSchedule({ ...terms100k, rates: [...r12, { validFrom: '2026-08-01', nominalRate: 600 }] })
  expect(c[5].balance).toBe(5_149_209)
  expect(c[6]).toMatchObject({ rate: 600, interest: 25_746, principal: 847_536, payment: 873_282 })
  expect(c[11].balance).toBe(0)
})

test('0 % rente gir like avdrag', () => {
  const z = buildSchedule({ ...base, kind: 'annuitet', startBalance: 120_000, termMonths: 12, rates: [{ validFrom: '2026-01-10', nominalRate: 0 }] })
  expect(z.every((r) => r.interest === 0 && r.principal === 10_000)).toBe(true)
})

test('ekstra innbetaling forkorter lånet', () => {
  const e = buildSchedule(terms100k, { extraPerMonth: 100_000 })
  expect(e).toHaveLength(11)
  expect(sumInterest(e)).toBe(596_375)
  expect(e[0].payment).toBe(988_488)
  expect(e[10].balance).toBe(0)
})

test('prognose fra faktisk restgjeld', () => {
  const p = buildSchedule(terms100k, { fromBalance: 5_000_000, fromMonth: '2026-07' })
  expect(p[0].month).toBe('2026-08')
  expect(p).toHaveLength(6)
  expect(p[0].interest).toBe(50_000)
  expect(p[5].balance).toBe(0)
})

test('prognose når lånet allerede er betalt', () => {
  expect(buildSchedule(terms100k, { fromBalance: 0, fromMonth: '2026-07' })).toEqual([])
})
