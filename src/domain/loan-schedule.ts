import type { Ore, RateBp } from './money'
import { addMonths, dueDate, monthsBetween, toYearMonth, type IsoDate, type YearMonth } from './month'

export type LoanKind = 'annuitet' | 'serie' | 'kreditt'

export interface RateChange {
  validFrom: IsoDate
  nominalRate: RateBp
}

export interface LoanTerms {
  kind: 'annuitet' | 'serie'
  startBalance: Ore
  startDate: IsoDate
  /** Gjenværende løpetid i måneder fra startDate. */
  termMonths: number
  feePerTerm: Ore
  dueDay: number
  /** Minst én. */
  rates: RateChange[]
}

export interface Installment {
  n: number
  month: YearMonth
  dueDate: IsoDate
  rate: RateBp
  interest: Ore
  principal: Ore
  fee: Ore
  /** interest + principal + fee */
  payment: Ore
  /** Restgjeld etter terminen. */
  balance: Ore
}

export interface ScheduleOptions {
  fromBalance?: Ore
  fromMonth?: YearMonth
  extraPerMonth?: Ore
}

/** Månedlig rente i øre for en saldo. Nominell årsrente / 12, avrundet til hele øre. */
export function monthlyInterest(balance: Ore, rate: RateBp): Ore {
  return Math.round((balance * rate) / 120000)
}

/** Terminbeløp for annuitetslån, ekskl. gebyr. */
export function annuityPayment(balance: Ore, rate: RateBp, terms: number): Ore {
  if (terms <= 0) return balance
  if (rate === 0) return Math.round(balance / terms)
  const r = rate / 120000
  return Math.round((balance * r) / (1 - Math.pow(1 + r, -terms)))
}

export function rateAt(rates: RateChange[], date: IsoDate): RateBp {
  let best: RateChange | undefined
  for (const rc of rates) {
    if (rc.validFrom <= date && (!best || rc.validFrom > best.validFrom)) best = rc
  }
  // Før første kjente rente: bruk den tidligste.
  if (!best) best = [...rates].sort((a, b) => a.validFrom.localeCompare(b.validFrom))[0]
  return best.nominalRate
}

/**
 * Nedbetalingsplan for annuitets- og serielån. All visning av planer skal gå gjennom denne.
 * Med fromBalance/fromMonth beregnes en prognose fra faktisk restgjeld.
 */
export function buildSchedule(terms: LoanTerms, opts: ScheduleOptions = {}): Installment[] {
  const startMonth = toYearMonth(terms.startDate)
  const fromMonth = opts.fromMonth ?? startMonth
  let balance = opts.fromBalance ?? terms.startBalance
  const remaining = Math.max(1, terms.termMonths - monthsBetween(startMonth, fromMonth))
  const extra = opts.extraPerMonth ?? 0

  const rows: Installment[] = []
  if (balance <= 0) return rows

  const fixedPrincipal = Math.round(balance / remaining)
  let payment = 0
  let currentRate: RateBp | null = null

  for (let n = 1; n <= remaining && balance > 0; n++) {
    const month = addMonths(fromMonth, n)
    const due = dueDate(month, terms.dueDay)
    const rate = rateAt(terms.rates, due)
    if (terms.kind === 'annuitet' && rate !== currentRate) {
      payment = annuityPayment(balance, rate, remaining - n + 1)
    }
    currentRate = rate

    const interest = monthlyInterest(balance, rate)
    const scheduled = terms.kind === 'annuitet' ? payment - interest : fixedPrincipal
    let principal = Math.max(0, scheduled) + extra
    if (n === remaining || principal >= balance) principal = balance
    balance -= principal

    rows.push({
      n,
      month,
      dueDate: due,
      rate,
      interest,
      principal,
      fee: terms.feePerTerm,
      payment: interest + principal + terms.feePerTerm,
      balance,
    })
  }
  return rows
}
