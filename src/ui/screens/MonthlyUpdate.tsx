import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveMonthlyEntries } from '../../data/repo'
import { expectedBalance } from '../../domain/loan-status'
import { parseNok } from '../../domain/money'
import { formatMonthLong } from '../../domain/month'
import { MSG } from '../../domain/validate'
import { Field } from '../components/Field'
import { amountField, capitalize, kr } from '../format'
import { PlusIcon } from '../icons'
import { currentMonth, useLoans, type LoanItem } from '../useLoans'

interface Row {
  balance: string
  interest: string
  extra: string
  note: string
  open: boolean
}

const pctFormat = new Intl.NumberFormat('nb-NO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
export const DEVIATION_WARN_PCT = 5

function deviationText(actual: number | null, expected: number, isCredit: boolean): string | null {
  if (actual === null || expected <= 0) return null
  const pct = ((actual - expected) / expected) * 100
  if (Math.abs(pct) <= DEVIATION_WARN_PCT) return null
  const dir = pct > 0 ? 'høyere' : 'lavere'
  const why = isCredit ? 'Har du brukt kortet mer, betalt ekstra, eller er renta endret?' : 'Har du betalt ekstra, eller er renta endret?'
  return `${pctFormat.format(Math.abs(pct))} % ${dir} enn planen. ${why}`
}

export function MonthlyUpdate() {
  const { loading, items } = useLoans()
  const navigate = useNavigate()
  const month = currentMonth()
  const monthName = formatMonthLong(month).split(' ')[0]
  const [rows, setRows] = useState<Record<string, Row>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  const expected = (item: LoanItem) => expectedBalance(item.loan, item.rates, item.entries, month)

  useEffect(() => {
    const init: Record<string, Row> = {}
    for (const item of items) {
      const existing = item.entries.find((e) => e.month === month)
      init[item.loan.id] = {
        balance: amountField(existing ? existing.actualBalance : expected(item)),
        interest: amountField(existing?.actualInterest ?? null),
        extra: amountField(existing?.extraPayment ?? null),
        note: existing?.note ?? '',
        open: Boolean(existing?.actualInterest || existing?.extraPayment || existing?.note),
      }
    }
    setRows(init)
  }, [items, month])

  const update = (id: string, patch: Partial<Row>) => setRows((r) => ({ ...r, [id]: { ...r[id], ...patch } }))

  async function onSave() {
    const errs: Record<string, string> = {}
    const entries = items.map((item) => {
      const r = rows[item.loan.id]
      const balance = parseNok(r.balance)
      const interest = r.interest.trim() ? parseNok(r.interest) : null
      const extra = r.extra.trim() ? parseNok(r.extra) : null
      if (balance === null) errs[`${item.loan.id}.balance`] = MSG.amount
      if (r.interest.trim() && interest === null) errs[`${item.loan.id}.interest`] = MSG.amount
      if (r.extra.trim() && extra === null) errs[`${item.loan.id}.extra`] = MSG.amount
      return { loanId: item.loan.id, month, actualBalance: balance ?? 0, actualInterest: interest, extraPayment: extra, note: r.note.trim() || null }
    })
    setErrors(errs)
    if (Object.keys(errs).length) return
    await saveMonthlyEntries(entries)
    navigate('/')
  }

  if (loading || Object.keys(rows).length !== items.length) return null

  return (
    <>
      <div className="stack">
        <span className="lbl">Månedlig oppdatering</span>
        <h1 className="h1">{capitalize(formatMonthLong(month))}</h1>
      </div>
      {items.length === 0 ? (
        <p className="lbl">Ingen aktive lån å oppdatere.</p>
      ) : (
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: 'var(--ink-2)' }}>
          Skriv inn restgjeld fra nettbanken. Feltene er forhåndsutfylt med det planen sier.
        </p>
      )}

      {items.map((item) => {
        const id = item.loan.id
        const r = rows[id]
        const isCredit = item.loan.kind === 'kreditt'
        const exp = expected(item)
        const warn = deviationText(parseNok(r.balance), exp, isCredit)
        return (
          <fieldset key={id} className="card" style={{ margin: 0, borderColor: warn ? '#f0c9a8' : undefined }}>
            <legend style={{ fontWeight: 600, padding: 0, float: 'left', width: '100%' }}>
              {item.loan.name}
              {item.loan.lender ? ` · ${item.loan.lender}` : ''}
            </legend>
            <Field
              id={`${id}-balance`}
              label={isCredit ? 'Saldo' : 'Restgjeld'}
              value={r.balance}
              onChange={(v) => update(id, { balance: v })}
              error={errors[`${id}.balance`]}
              inputMode="decimal"
            />
            <span className="lbl num" style={{ fontSize: 12, marginTop: -4 }}>
              Plan: {kr(exp)}
            </span>
            {warn && (
              <div className="warnbox" role="status">
                {warn}
              </div>
            )}
            {r.open ? (
              <>
                <div className="grid2">
                  <Field id={`${id}-interest`} label="Rente trukket" value={r.interest} onChange={(v) => update(id, { interest: v })} error={errors[`${id}.interest`]} inputMode="decimal" />
                  <Field id={`${id}-extra`} label="Ekstra innbetalt" value={r.extra} onChange={(v) => update(id, { extra: v })} error={errors[`${id}.extra`]} inputMode="decimal" />
                </div>
                <Field id={`${id}-note`} label="Notat" value={r.note} onChange={(v) => update(id, { note: v })} placeholder="Valgfritt" />
              </>
            ) : (
              <button type="button" className="link-btn" onClick={() => update(id, { open: true })}>
                <PlusIcon size={16} />
                Rente, ekstra innbetaling, notat
              </button>
            )}
          </fieldset>
        )
      })}

      {items.length > 0 && (
        <button className="btn" onClick={onSave}>
          Lagre {monthName}
        </button>
      )}
    </>
  )
}
