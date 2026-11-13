import { buildSchedule, type LoanTerms, type ScheduleOptions } from './loan-schedule'
import type { Ore } from './money'
import type { YearMonth } from './month'

export interface WhatIfResult {
  extra: Ore
  payoffMonth: YearMonth
  monthsSaved: number
  interestSaved: Ore
}

const sumInterest = (rows: { interest: Ore }[]) => rows.reduce((s, r) => s + r.interest, 0)

/** Effekten av ekstra månedlig innbetaling: samme terminbeløp, kortere løpetid. */
export function whatIf(terms: LoanTerms, base: ScheduleOptions, extras: Ore[]): WhatIfResult[] {
  const baseline = buildSchedule(terms, { ...base, extraPerMonth: 0 })
  const baseInterest = sumInterest(baseline)
  return extras.map((extra) => {
    const rows = buildSchedule(terms, { ...base, extraPerMonth: extra })
    return {
      extra,
      payoffMonth: rows.length ? rows[rows.length - 1].month : (base.fromMonth ?? terms.startDate.slice(0, 7)),
      monthsSaved: baseline.length - rows.length,
      interestSaved: baseInterest - sumInterest(rows),
    }
  })
}
