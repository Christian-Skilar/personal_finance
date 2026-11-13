import { INTEREST_DEDUCTION } from '../config/satser'
import type { Ore, RateBp } from './money'

export function deductionRate(year: number): { rate: RateBp; assumed: boolean } {
  if (year in INTEREST_DEDUCTION) return { rate: INTEREST_DEDUCTION[year], assumed: false }
  const years = Object.keys(INTEREST_DEDUCTION).map(Number).sort((a, b) => a - b)
  const known = years.filter((y) => y <= year)
  const use = known.length ? known[known.length - 1] : years[0]
  return { rate: INTEREST_DEDUCTION[use], assumed: true }
}

export function interestDeduction(interest: Ore, year: number): { deduction: Ore; net: Ore; rate: RateBp; assumed: boolean } {
  const { rate, assumed } = deductionRate(year)
  const deduction = Math.round((interest * rate) / 10000)
  return { deduction, net: interest - deduction, rate, assumed }
}
