import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatRate, parseNok } from '../../domain/money'
import { addMonths, formatMonthLong, formatMonthShort, monthsBetween } from '../../domain/month'
import { planPayoff, type DebtForPlan, type Strategy } from '../../domain/payoff-strategy'
import { Field } from '../components/Field'
import { currentRate, durationText, kr } from '../format'
import { currentMonth, useLoans, type LoanItem } from '../useLoans'

const EXPLAIN: Record<Strategy, string> = {
  skred: 'Skred: ekstra beløp går til lånet med høyest rente først. Billigst totalt.',
  snoball: 'Snøball: ekstra beløp går til lånet med lavest restgjeld først. Raske seire som motiverer.',
}

function toDebt(item: LoanItem, month: string): DebtForPlan {
  const next = item.status.forecast.find((r) => r.month > month)
  return {
    id: item.loan.id,
    name: item.loan.name,
    balance: item.status.currentBalance,
    rate: currentRate(item.rates, item.loan.dueDay, month),
    minPayment: item.loan.kind === 'kreditt' ? (item.loan.monthlyPayment ?? 0) : next ? next.interest + next.principal : 0,
  }
}

export function PayoffPlan() {
  const { loading, items } = useLoans()
  const [extraText, setExtraText] = useState('1 000')
  const [strategy, setStrategy] = useState<Strategy>('skred')
  const month = currentMonth()
  const first = addMonths(month, 1)
  const extra = parseNok(extraText)

  const result = useMemo(() => {
    const debts = items.filter((i) => !i.status.paidOff).map((i) => toDebt(i, month))
    if (!debts.length || extra === null) return null
    return {
      debts,
      chosen: planPayoff(debts, extra, strategy, first),
      other: planPayoff(debts, extra, strategy === 'skred' ? 'snoball' : 'skred', first),
      baseline: planPayoff(debts, 0, strategy, first),
    }
  }, [items, extra, strategy, month, first])

  if (loading) return null

  return (
    <>
      <div className="stack">
        <span className="lbl">Planer</span>
        <h1 className="h1">Plan for å bli gjeldfri</h1>
      </div>

      <Field
        id="extra"
        label="Ekstra jeg kan betale per måned"
        value={extraText}
        onChange={setExtraText}
        error={extra === null ? 'Skriv et gyldig beløp, f.eks. 2 450 000' : undefined}
        inputMode="decimal"
      />

      <div className="field">
        <span className="label">Strategi</span>
        <div className="seg" role="group" aria-label="Strategi">
          <button type="button" aria-pressed={strategy === 'skred'} onClick={() => setStrategy('skred')}>
            Skred
          </button>
          <button type="button" aria-pressed={strategy === 'snoball'} onClick={() => setStrategy('snoball')}>
            Snøball
          </button>
        </div>
        <span className="lbl" style={{ lineHeight: 1.45 }}>
          {EXPLAIN[strategy]}
        </span>
      </div>

      {!result && items.length === 0 && <p className="lbl">Legg inn lån for å lage en plan.</p>}

      {result && (
        <>
          <div className="hero" style={{ gap: 4 }}>
            <span className="lbl">Gjeldfri</span>
            {result.chosen.months >= 600 ? (
              <span className="hero-big">Aldri</span>
            ) : (
              <>
                <span className="hero-big">{formatMonthLong(result.chosen.debtFreeMonth)}</span>
                <span style={{ fontSize: 14, color: '#dcebe4' }}>
                  {durationText(Math.max(0, monthsBetween(result.chosen.debtFreeMonth, result.baseline.debtFreeMonth)))} tidligere enn uten ekstra (
                  {formatMonthShort(result.baseline.debtFreeMonth)})
                </span>
              </>
            )}
          </div>

          <div className="card" style={{ gap: 16 }}>
            <h2 className="h2" id="order-title">
              Rekkefølge
            </h2>
            <ol aria-labelledby="order-title" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {result.chosen.order.map((o, i) => {
                const d = result.debts.find((x) => x.id === o.id)!
                return (
                  <li key={o.id} className="step">
                    <span className="dot" aria-hidden="true">
                      {i + 1}
                    </span>
                    <div className="stack" style={{ flex: 1 }}>
                      <div className="row">
                        <span style={{ fontWeight: 600 }}>{o.name}</span>
                        <span style={{ fontWeight: 600 }}>{formatMonthShort(o.paidOffMonth)}</span>
                      </div>
                      <span className="lbl">
                        {formatRate(d.rate)} · {kr(d.balance)}
                      </span>
                    </div>
                  </li>
                )
              })}
            </ol>
          </div>

          {result.chosen.totalInterest !== result.other.totalInterest && (
            <div className="info">
              {(() => {
                const diff = Math.abs(result.chosen.totalInterest - result.other.totalInterest)
                const cheaper = result.chosen.totalInterest < result.other.totalInterest
                const name = strategy === 'skred' ? 'Skred' : 'Snøball'
                const otherName = strategy === 'skred' ? 'snøball' : 'skred'
                return cheaper
                  ? `${name} sparer ca. ${kr(diff)} i renter sammenlignet med ${otherName}.`
                  : `${name} koster ca. ${kr(diff)} mer i renter enn ${otherName}.`
              })()}
            </div>
          )}

          <span className="lbl">Beregnet med dagens renter og minimumsbetaling på hvert lån.</span>
        </>
      )}

      {items.some((i) => i.loan.kind !== 'kreditt') && (
        <Link className="link-btn" to={`/lan/${items.find((i) => i.loan.kind !== 'kreditt')!.loan.id}/hva-om`}>
          Se hva ekstra innbetaling gjør for ett lån
        </Link>
      )}
    </>
  )
}
