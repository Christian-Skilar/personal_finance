import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { addRateChange, closeLoan } from '../../data/repo'
import type { Installment } from '../../domain/loan-schedule'
import { formatNok, formatRate, parseRate } from '../../domain/money'
import { formatDate, formatMonthShort, todayIso } from '../../domain/month'
import { Field } from '../components/Field'
import { PlanChart, type ChartPoint } from '../components/PlanChart'
import { currentRate, DATE_ERROR, isIsoDate, KIND_LONG, kr, SAVE_ERROR, statusChip } from '../format'
import { BackIcon, PlusIcon } from '../icons'
import { currentMonth, useLoan, type LoanItem } from '../useLoans'

const PREVIEW_ROWS = 12

function chartPoints(item: LoanItem): ChartPoint[] {
  const { loan, status, entries } = item
  const month = currentMonth()
  const plannedAt = (m: string) => {
    let b = loan.startBalance
    for (const r of status.plan) {
      if (r.month > m) break
      b = r.balance
    }
    return b
  }
  return entries
    .filter((e) => e.month <= month)
    .slice(-6)
    .map((e) => ({ month: e.month, planned: plannedAt(e.month), actual: e.actualBalance }))
}

function ScheduleTable({ rows }: { rows: Installment[] }) {
  const [all, setAll] = useState(false)
  const shown = all ? rows : rows.slice(0, PREVIEW_ROWS)
  const n = (o: number) => formatNok(o, { whole: true }).replace(/\s*kr$/, '')
  return (
    <div className="card">
      <h2 className="h2">Nedbetalingsplan</h2>
      <table className="tbl">
        <thead>
          <tr>
            <th>Forfall</th>
            <th>Rente</th>
            <th>Avdrag</th>
            <th>Sum</th>
            <th>Restgjeld</th>
          </tr>
        </thead>
        <tbody>
          {shown.map((r) => (
            <tr key={r.n}>
              <td>{formatDate(r.dueDate).replace(/\.(\d{2})(\d{2})$/, '.$2')}</td>
              <td>{n(r.interest)}</td>
              <td>{n(r.principal)}</td>
              <td>{n(r.payment)}</td>
              <td>{n(r.balance)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows[0]?.fee ? <span className="lbl">Sum inkluderer termingebyr på {kr(rows[0].fee)}.</span> : null}
      {rows.length > PREVIEW_ROWS && (
        <button className="btn2" onClick={() => setAll(!all)}>
          {all ? 'Vis færre' : `Vis alle ${rows.length} terminer`}
        </button>
      )}
    </div>
  )
}

function RateHistory({ item, onChange }: { item: LoanItem; onChange: () => void }) {
  const [open, setOpen] = useState(false)
  const [rate, setRate] = useState('')
  const [date, setDate] = useState(todayIso())
  const [error, setError] = useState<string>()
  const [dateError, setDateError] = useState<string>()
  const [saveError, setSaveError] = useState<string>()
  const sorted = [...item.rates].sort((a, b) => b.validFrom.localeCompare(a.validFrom))

  async function save() {
    const r = parseRate(rate)
    setError(r === null ? 'Renten må være mellom 0 og 100 %' : undefined)
    setDateError(isIsoDate(date) ? undefined : DATE_ERROR)
    if (r === null || !isIsoDate(date)) return
    try {
      await addRateChange(item.loan.id, { validFrom: date, nominalRate: r })
    } catch {
      return setSaveError(SAVE_ERROR)
    }
    setOpen(false)
    setRate('')
    setSaveError(undefined)
    onChange()
  }

  return (
    <div className="card">
      <h2 className="h2">Rentehistorikk</h2>
      {sorted.map((r, i) => (
        <div className="row" key={`${r.validFrom}-${i}`}>
          <span style={{ color: i === 0 ? undefined : 'var(--muted)' }}>{formatRate(r.nominalRate)}</span>
          <span className="lbl">fra {formatDate(r.validFrom)}</span>
        </div>
      ))}
      {open ? (
        <>
          <div className="grid2">
            <Field id="newRate" label="Ny rente (%)" value={rate} onChange={setRate} error={error} inputMode="decimal" />
            <Field id="newRateDate" label="Gjelder fra" type="date" value={date} onChange={setDate} error={dateError} />
          </div>
          <button className="btn" onClick={save}>
            Lagre renteendring
          </button>
          {saveError && (
            <p className="err" role="alert">
              {saveError}
            </p>
          )}
        </>
      ) : (
        <button className="btn2" onClick={() => setOpen(true)}>
          <PlusIcon size={18} />
          Registrer renteendring
        </button>
      )}
    </div>
  )
}

export function LoanDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { item, reload } = useLoan(id)
  const [confirmClose, setConfirmClose] = useState(false)
  const [closeError, setCloseError] = useState<string>()
  if (!item) return null

  const { loan, status } = item
  const month = currentMonth()
  const chip = statusChip(item, month)
  const isCredit = loan.kind === 'kreditt'
  const upcoming = status.forecast.filter((r) => r.month > month)
  const points = isCredit ? [] : chartPoints(item)

  async function markPaid() {
    try {
      await closeLoan(loan.id, todayIso())
    } catch {
      return setCloseError(SAVE_ERROR)
    }
    navigate('/')
  }

  return (
    <>
      <Link className="back" to="/">
        <BackIcon />
        Oversikt
      </Link>
      <div className="stack" style={{ marginTop: -8 }}>
        <h1 className="h1">{loan.name}</h1>
        <span className="lbl">{[loan.lender, KIND_LONG[loan.kind], `forfall den ${loan.dueDay}.`].filter(Boolean).join(' · ')}</span>
      </div>

      <div className="card" style={{ gap: 16 }}>
        <div className="row" style={{ alignItems: 'center' }}>
          <div className="stack">
            <span className="lbl">{isCredit ? 'Saldo' : 'Restgjeld'}</span>
            <span className="num" style={{ fontFamily: 'var(--font-head)', fontSize: 30, fontWeight: 600 }}>
              {kr(status.currentBalance)}
            </span>
          </div>
          <span className={`chip chip-${chip.tone}`}>{chip.text}</span>
        </div>
        <div className="grid2" style={{ gap: 14 }}>
          <div className="stack">
            <span className="lbl">Nominell rente</span>
            <span className="num" style={{ fontSize: 17, fontWeight: 600 }}>
              {formatRate(currentRate(item.rates, loan.dueDay, month))}
            </span>
          </div>
          <div className="stack">
            <span className="lbl">{isCredit ? 'Du betaler' : 'Per termin'}</span>
            <span className="num" style={{ fontSize: 17, fontWeight: 600 }} data-testid="per-term">
              {kr(status.monthlyCost)}
            </span>
            {!isCredit && loan.feePerTerm > 0 && <span className="lbl">inkl. {kr(loan.feePerTerm)} gebyr</span>}
          </div>
          {!isCredit && (
            <div className="stack">
              <span className="lbl">Gjenstår</span>
              <span className="num" style={{ fontSize: 17, fontWeight: 600 }}>
                {upcoming.length} terminer
              </span>
            </div>
          )}
          {isCredit && loan.creditLimit !== null && (
            <div className="stack">
              <span className="lbl">Kredittgrense</span>
              <span className="num" style={{ fontSize: 17, fontWeight: 600 }}>
                {kr(loan.creditLimit)}
              </span>
            </div>
          )}
          <div className="stack">
            <span className="lbl">Nedbetalt</span>
            <span style={{ fontSize: 17, fontWeight: 600 }}>
              {status.never ? 'Aldri' : status.payoffMonth ? formatMonthShort(status.payoffMonth) : '–'}
            </span>
          </div>
        </div>
        {status.never && <div className="warnbox">Med {kr(loan.monthlyPayment ?? 0)} i måneden blir saldoen aldri nedbetalt fordi beløpet ikke dekker renta.</div>}
      </div>

      {points.length > 0 && (
        <div className="card">
          <div className="row">
            <h2 className="h2">Plan mot faktisk</h2>
            <span className="lbl">siste {points.length} mnd</span>
          </div>
          <PlanChart points={points} />
        </div>
      )}

      <RateHistory item={item} onChange={reload} />

      {!isCredit && upcoming.length > 0 && <ScheduleTable rows={upcoming} />}

      {!isCredit && !status.paidOff && (
        <Link className="btn" to={`/lan/${loan.id}/hva-om`}>
          Hva om jeg betaler mer?
        </Link>
      )}
      <div className="grid2">
        <Link className="btn2" to={`/lan/${loan.id}/rediger`}>
          Rediger
        </Link>
        <button className="btn2" onClick={() => setConfirmClose(true)}>
          Marker som nedbetalt
        </button>
      </div>
      {confirmClose && (
        <div className="warnbox" role="status">
          <p style={{ margin: '0 0 10px' }}>
            {loan.name} flyttes til «Lukkede lån» og telles ikke med i oversikten. Du kan gjenåpne det fra Lån-siden.
          </p>
          <div className="grid2">
            <button className="btn2" onClick={() => setConfirmClose(false)}>
              Avbryt
            </button>
            <button className="btn2" style={{ background: 'var(--warn)', color: '#fff', borderColor: 'var(--warn)' }} onClick={markPaid}>
              Ja, marker som nedbetalt
            </button>
          </div>
        </div>
      )}
      {closeError && (
        <p className="err" role="alert">
          {closeError}
        </p>
      )}
    </>
  )
}
