import { Link } from 'react-router-dom'
import { formatRate } from '../../domain/money'
import { formatMonthShort, type YearMonth } from '../../domain/month'
import { currentRate, KIND_LABEL, kr, statusChip } from '../format'
import type { LoanItem } from '../useLoans'

function payoffText(item: LoanItem): string {
  const { loan, status } = item
  if (status.paidOff) return 'Nedbetalt'
  if (status.never) return `${kr(loan.monthlyPayment ?? 0)}/mnd dekker ikke renta`
  const when = status.payoffMonth ? formatMonthShort(status.payoffMonth) : '–'
  return loan.kind === 'kreditt' ? `${kr(loan.monthlyPayment ?? 0)}/mnd → nedbetalt ${when}` : `Nedbetalt ${when}`
}

function progress(item: LoanItem): { pct: number; warn: boolean } {
  const { loan, status } = item
  if (loan.kind === 'kreditt') {
    const limit = loan.creditLimit ?? 0
    return { pct: limit > 0 ? Math.min(100, (status.currentBalance / limit) * 100) : 0, warn: true }
  }
  return { pct: loan.startBalance > 0 ? Math.max(0, 100 - (status.currentBalance / loan.startBalance) * 100) : 0, warn: false }
}

export function LoanCards({ items, month, title }: { items: LoanItem[]; month: YearMonth; title: string }) {
  return (
    <div className="card" style={{ padding: '4px 16px', gap: 0 }}>
      <div className="row" style={{ padding: '12px 0 4px' }}>
        <h2 className="h2">{title}</h2>
        <span className="lbl">{items.length} aktive</span>
      </div>
      {items.map((item) => {
        const chip = statusChip(item, month)
        const bar = progress(item)
        const rate = currentRate(item.rates, item.loan.dueDay, month)
        return (
          <Link key={item.loan.id} to={`/lan/${item.loan.id}`} className="loan-row">
            <div className="row">
              <span style={{ fontWeight: 600 }}>{item.loan.name}</span>
              <span className="num" style={{ fontWeight: 600 }}>
                {kr(item.status.currentBalance)}
              </span>
            </div>
            <div className="row">
              <span className="lbl">
                {[item.loan.lender, KIND_LABEL[item.loan.kind], formatRate(rate)].filter(Boolean).join(' · ')}
              </span>
              <span className={`chip chip-${chip.tone}`}>{chip.text}</span>
            </div>
            <div className="bar">
              <div style={{ width: `${bar.pct}%`, background: bar.warn ? 'var(--warn-strong)' : undefined }} />
            </div>
            <span className="lbl">{payoffText(item)}</span>
          </Link>
        )
      })}
    </div>
  )
}
