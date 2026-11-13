import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { interestForYear } from '../../domain/loan-status'
import { formatRate } from '../../domain/money'
import { formatDate, formatMonthLong, formatMonthShort } from '../../domain/month'
import type { Loan } from '../../domain/types'
import { listClosedLoans, reopenLoan } from '../../data/repo'
import { interestDeduction } from '../../domain/tax'
import { LoanCards } from '../components/LoanCards'
import { capitalize, kr, SAVE_ERROR } from '../format'
import { GearIcon, PlusIcon } from '../icons'
import { currentMonth, useLoans } from '../useLoans'

export function Overview() {
  const { loading, items } = useLoans()
  const month = currentMonth()
  const year = Number(month.slice(0, 4))

  const header = (
    <div className="row" style={{ alignItems: 'center' }}>
      <div className="stack">
        <span className="lbl">{capitalize(formatMonthLong(month))}</span>
        <h1 className="h1">Gjeld</h1>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <Link to="/innstillinger" aria-label="Innstillinger" className="back" style={{ width: 44, justifyContent: 'center', color: 'var(--muted)' }}>
          <GearIcon />
        </Link>
        <Link
          to="/lan/ny"
          aria-label="Legg til lån"
          style={{ width: 44, height: 44, borderRadius: 22, background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <PlusIcon />
        </Link>
      </div>
    </div>
  )

  if (loading) return header
  if (!items.length) {
    return (
      <>
        {header}
        <div className="card" style={{ alignItems: 'flex-start' }}>
          <h2 className="h2">Ingen lån ennå</h2>
          <p className="lbl" style={{ margin: 0 }}>
            Legg inn boliglån, billån, studielån eller kredittkort for å se nedbetalingsplan og når du blir gjeldfri.
          </p>
          <Link className="btn" to="/lan/ny">
            Legg til lån
          </Link>
        </div>
      </>
    )
  }

  const total = items.reduce((s, i) => s + i.status.currentBalance, 0)
  const monthly = items.reduce((s, i) => s + i.status.monthlyCost, 0)
  const never = items.some((i) => i.status.never)
  const debtFree = items.map((i) => i.status.payoffMonth).filter((m): m is string => !!m).sort().pop()
  const yearly = items.map((i) => interestForYear(i.loan, i.rates, i.entries, year, month))
  const interest = yearly.reduce((s, y) => s + y.soFar, 0)
  const ded = interestDeduction(interest, year)
  const fullYear = yearly.reduce((s, y) => s + y.fullYear, 0)
  const dedFull = interestDeduction(fullYear, year)

  return (
    <>
      {header}
      <div className="hero">
        <div className="stack" style={{ gap: 4 }}>
          <span className="lbl">Total gjeld</span>
          <span className="hero-big num" data-testid="total">
            {kr(total)}
          </span>
        </div>
        <div className="grid2">
          <div className="stack">
            <span className="lbl">Koster per måned</span>
            <span className="hero-val num" data-testid="monthly">
              {kr(monthly)}
            </span>
          </div>
          <div className="stack">
            <span className="lbl">Gjeldfri</span>
            <span className="hero-val">{never ? 'Aldri' : debtFree ? formatMonthShort(debtFree) : '–'}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="h2">Renter i {year}</h2>
        <div className="row">
          <span className="lbl">Betalt hittil i år</span>
          <span className="num" style={{ fontWeight: 600 }}>
            {kr(interest)}
          </span>
        </div>
        <div className="row">
          <span className="lbl">Rentefradrag ({formatRate(ded.rate).replace(',00', '')})</span>
          <span className="num" style={{ fontWeight: 600, color: 'var(--good)' }}>
            − {kr(ded.deduction)}
          </span>
        </div>
        <div style={{ height: 1, background: 'var(--line-soft)' }} />
        <div className="row">
          <span style={{ fontSize: 14, fontWeight: 600 }}>Netto rentekostnad</span>
          <span className="num" style={{ fontWeight: 700 }}>
            {kr(ded.net)}
          </span>
        </div>
        <div style={{ height: 1, background: 'var(--line-soft)' }} />
        <span style={{ fontSize: 14, fontWeight: 600 }}>Prognose for hele {year}</span>
        <div className="row">
          <span className="lbl">Renter</span>
          <span className="num">{kr(fullYear)}</span>
        </div>
        <div className="row">
          <span className="lbl">Etter rentefradrag</span>
          <span className="num">{kr(dedFull.net)}</span>
        </div>
        {ded.assumed && (
          <span className="lbl">
            Satsen for {year} er ikke lagt inn, bruker {formatRate(ded.rate)}.
          </span>
        )}
      </div>

      <LoanCards items={items} month={month} title="Lån og kreditt" />
    </>
  )
}

export function LoanList() {
  const { loading, items, reload } = useLoans()
  const [closed, setClosed] = useState<Loan[]>([])
  const [error, setError] = useState<string>()
  useEffect(() => {
    listClosedLoans().then(setClosed)
  }, [items])

  async function reopen(id: string) {
    try {
      await reopenLoan(id)
      reload()
    } catch {
      setError(SAVE_ERROR)
    }
  }

  if (loading) return null
  return (
    <>
      <div className="row" style={{ alignItems: 'center' }}>
        <h1 className="h1">Lån</h1>
        <Link className="btn2" style={{ width: 'auto', padding: '0 14px' }} to="/lan/ny">
          <PlusIcon size={18} />
          Legg til lån
        </Link>
      </div>
      {items.length ? <LoanCards items={items} month={currentMonth()} title="Aktive lån" /> : <p className="lbl">Ingen aktive lån.</p>}
      {closed.length > 0 && (
        <div className="card">
          <h2 className="h2">Lukkede lån</h2>
          {closed.map((l) => (
            <div key={l.id} className="row" style={{ alignItems: 'center' }}>
              <div className="stack">
                <span style={{ fontWeight: 600 }}>{l.name}</span>
                <span className="lbl">Lukket {l.closedAt ? formatDate(l.closedAt) : ''}</span>
              </div>
              <button className="btn2" style={{ width: 'auto', padding: '0 14px' }} aria-label={`Gjenåpne ${l.name}`} onClick={() => reopen(l.id)}>
                Gjenåpne
              </button>
            </div>
          ))}
        </div>
      )}
      {error && (
        <p className="err" role="alert">
          {error}
        </p>
      )}
    </>
  )
}
