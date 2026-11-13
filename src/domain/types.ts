import type { LoanKind } from './loan-schedule'
import type { Ore } from './money'
import type { IsoDate, YearMonth } from './month'

export interface Loan {
  id: string
  name: string
  lender: string
  kind: LoanKind
  startBalance: Ore
  startDate: IsoDate
  /** Gjenværende løpetid fra startDate; null for kreditt. */
  termMonths: number | null
  feePerTerm: Ore
  dueDay: number
  creditLimit: Ore | null
  /** Kun kreditt: planlagt månedlig innbetaling. */
  monthlyPayment: Ore | null
  closedAt: IsoDate | null
}

export interface MonthlyEntry {
  id: string
  loanId: string
  month: YearMonth
  actualBalance: Ore
  actualInterest: Ore | null
  extraPayment: Ore | null
  note: string | null
}
