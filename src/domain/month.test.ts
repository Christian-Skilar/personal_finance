import { addMonths, dueDate, formatDate, formatMonthLong, formatMonthShort, monthsBetween, toYearMonth } from './month'

test('toYearMonth tar år og måned fra en dato', () => expect(toYearMonth('2026-11-13')).toBe('2026-11'))

test('addMonths går over årsskifter begge veier', () => {
  expect(addMonths('2026-11', 2)).toBe('2027-01')
  expect(addMonths('2026-01', -1)).toBe('2025-12')
  expect(addMonths('2026-12', 0)).toBe('2026-12')
})

test('monthsBetween teller måneder', () => {
  expect(monthsBetween('2026-12', '2048-11')).toBe(263)
  expect(monthsBetween('2027-01', '2026-12')).toBe(-1)
})

test('dueDate klemmes til siste dag i måneden', () => {
  expect(dueDate('2027-02', 31)).toBe('2027-02-28')
  expect(dueDate('2028-02', 30)).toBe('2028-02-29')
  expect(dueDate('2026-12', 15)).toBe('2026-12-15')
  expect(dueDate('2026-04', 31)).toBe('2026-04-30')
})

test('formaterer måneder og datoer på norsk', () => {
  expect(formatMonthShort('2048-11')).toBe('nov. 2048')
  expect(formatMonthLong('2026-11')).toBe('november 2026')
  expect(formatDate('2026-11-13')).toBe('13.11.2026')
})
