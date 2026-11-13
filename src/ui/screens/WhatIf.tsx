import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { forecastBase, termsOf } from '../../domain/loan-status'
import { formatRate, parseNok } from '../../domain/money'
import { formatMonthShort } from '../../domain/month'
import { whatIf } from '../../domain/what-if'
import { Field } from '../components/Field'
import { currentRate, durationText, kr } from '../format'
import { BackIcon } from '../icons'
import { currentMonth, useLoan } from '../useLoans'

const PRESETS = [50_000, 100_000, 200_000]
const presetLabel = (ore: number) => kr(ore).replace(/\s*kr$/, '').replace(/[  ]/g, ' ')

export function WhatIf() {
  const { id } = useParams()
  const { item } = useLoan(id)
  const [picked, setPicked] = useState<number | 'annet'>(100_000)
  const [custom, setCustom] = useState('')
  const month = currentMonth()

  const data = useMemo(() => {
    if (!item || item.loan.kind === 'kreditt' || item.status.paidOff) return null
    const terms = termsOf(item.loan, item.rates)
    const base = forecastBase(item.loan, item.rates, item.entries, month)
    const customOre = parseNok(custom)
    const selected = picked === 'annet' ? customOre : picked
    const rows = whatIf(terms, base, [0, ...PRESETS])
    const current = selected === null ? null : whatIf(terms, base, [selected])[0]
    return { rows, current, baseline: rows[0] }
  }, [item, picked, custom, month])

  if (!item) return null

  const back = (
    <Link className="back" to={`/lan/${item.loan.id}`}>
      <BackIcon />
      {item.loan.name}
    </Link>
  )

  if (!data) {
    return (
      <>
        {back}
        <p className="lbl">Hva om-beregning finnes bare for annuitets- og serielån som ikke er nedbetalt.</p>
      </>
    )
  }

  return (
    <>
      {back}
      <h1 className="h1" style={{ marginTop: -8 }}>
        Hva om jeg betaler mer?
      </h1>

      <div className="field">
        <span className="label">Ekstra per måned</span>
        <div className="pills" role="group" aria-label="Ekstra per måned">
          {PRESETS.map((p) => (
            <button key={p} type="button" className="pill" aria-pressed={picked === p} onClick={() => setPicked(p)}>
              {presetLabel(p)}
            </button>
          ))}
          <button type="button" className="pill" aria-pressed={picked === 'annet'} onClick={() => setPicked('annet')} style={{ fontSize: 13 }}>
            Annet
          </button>
        </div>
      </div>
      {picked === 'annet' && <Field id="custom" label="Eget beløp per måned" value={custom} onChange={setCustom} inputMode="decimal" />}

      {data.current && (
        <div className="hero">
          <div className="stack" style={{ gap: 4 }}>
            <span className="lbl">Nytt nedbetalt-tidspunkt</span>
            <span className="hero-big">{formatMonthShort(data.current.payoffMonth)}</span>
            <span className="lbl">i stedet for {formatMonthShort(data.baseline.payoffMonth)}</span>
          </div>
          <div className="grid2">
            <div className="stack">
              <span className="lbl">Ferdig tidligere</span>
              <span className="hero-val" data-testid="saved-time">
                {durationText(data.current.monthsSaved)}
              </span>
            </div>
            <div className="stack">
              <span className="lbl">Renter spart</span>
              <span className="hero-val num" data-testid="saved-interest">
                ca. {kr(data.current.interestSaved)}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="h2">Sammenligning</h2>
        <table className="tbl">
          <thead>
            <tr>
              <th>Ekstra/mnd</th>
              <th>Ferdig</th>
              <th>Tidligere</th>
              <th>Spart rente</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r) => (
              <tr key={r.extra}>
                <td>{kr(r.extra)}</td>
                <td>{formatMonthShort(r.payoffMonth)}</td>
                <td>{r.extra ? `${r.monthsSaved} mnd` : '–'}</td>
                <td>{r.extra ? kr(r.interestSaved).replace(/\s*kr$/, '') : '–'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="lbl" style={{ margin: 0, lineHeight: 1.5 }}>
        Ekstra innbetaling går rett til avdrag. Terminbeløpet er det samme, men lånet blir kortere. Beregnet med dagens rente på{' '}
        {formatRate(currentRate(item.rates, item.loan.dueDay, month))}.
      </p>
    </>
  )
}
