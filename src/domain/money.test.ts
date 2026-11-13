import { formatNok, formatRate, parseNok, parseRate } from './money'
import { sp } from '../test/sp'

describe('parseNok', () => {
  test('tolker mellomrom som tusenskille', () => expect(parseNok('2 450 000')).toBe(245000000))
  test('tolker hardt mellomrom, komma og kr', () => expect(parseNok('2\u00a0450\u00a0000,50 kr')).toBe(245000050))
  test('tolker punktum som desimaltegn', () => expect(parseNok('12.5')).toBe(1250))
  test('tolker null', () => expect(parseNok('0')).toBe(0))
  test('avviser tekst, tomt, negativt og tre desimaler', () => {
    expect(parseNok('abc')).toBeNull()
    expect(parseNok('')).toBeNull()
    expect(parseNok('   ')).toBeNull()
    expect(parseNok('-5')).toBeNull()
    expect(parseNok('1,234')).toBeNull()
    expect(parseNok('1,2,3')).toBeNull()
  })
})

describe('formatNok', () => {
  test('viser øre i norsk format', () => expect(sp(formatNok(1234567))).toBe('12 345,67 kr'))
  test('viser hele kroner', () => expect(sp(formatNok(1234567, { whole: true }))).toBe('12 346 kr'))
})

describe('parseRate', () => {
  test('tolker komma', () => expect(parseRate('5,2')).toBe(520))
  test('tolker punktum, prosent og mellomrom', () => expect(parseRate(' 5.20 % ')).toBe(520))
  test('tolker null', () => expect(parseRate('0')).toBe(0))
  test('avviser over 100, negativ og tekst', () => {
    expect(parseRate('101')).toBeNull()
    expect(parseRate('-1')).toBeNull()
    expect(parseRate('x')).toBeNull()
    expect(parseRate('5,123')).toBeNull()
  })
})

describe('formatRate', () => {
  test('viser to desimaler med prosent', () => expect(sp(formatRate(520))).toBe('5,20 %'))
})
