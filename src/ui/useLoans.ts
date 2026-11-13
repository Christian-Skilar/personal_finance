import { useCallback, useEffect, useState } from 'react'
import { getLoanBundle, listActiveLoans } from '../data/repo'
import type { RateChange } from '../domain/loan-schedule'
import { loanStatus, type LoanStatus } from '../domain/loan-status'
import { todayIso, toYearMonth, type YearMonth } from '../domain/month'
import type { Loan, MonthlyEntry } from '../domain/types'

export interface LoanItem {
  loan: Loan
  rates: RateChange[]
  entries: MonthlyEntry[]
  status: LoanStatus
}

export const currentMonth = (): YearMonth => toYearMonth(todayIso())

export function toItem(bundle: { loan: Loan; rates: RateChange[]; entries: MonthlyEntry[] }, month: YearMonth): LoanItem {
  return { ...bundle, status: loanStatus(bundle.loan, bundle.rates, bundle.entries, month) }
}

/** Alle aktive lån med beregnet status. */
export function useLoans(): { loading: boolean; items: LoanItem[]; reload: () => void } {
  const [items, setItems] = useState<LoanItem[]>([])
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let alive = true
    ;(async () => {
      const loans = await listActiveLoans()
      const month = currentMonth()
      const bundles = await Promise.all(loans.map((l) => getLoanBundle(l.id)))
      const result = bundles.map((b) => toItem(b, month)).sort((a, b) => b.status.currentBalance - a.status.currentBalance)
      if (alive) {
        setItems(result)
        setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [tick])

  const reload = useCallback(() => setTick((t) => t + 1), [])
  return { loading, items, reload }
}

/** Ett lån (også lukkede). */
export function useLoan(id: string | undefined): { item: LoanItem | null; reload: () => void } {
  const [item, setItem] = useState<LoanItem | null>(null)
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (!id) return
    let alive = true
    getLoanBundle(id).then((b) => alive && setItem(toItem(b, currentMonth())))
    return () => {
      alive = false
    }
  }, [id, tick])
  return { item, reload: useCallback(() => setTick((t) => t + 1), []) }
}
