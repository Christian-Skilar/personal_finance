import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { createLoan, getLoanBundle, updateLoan } from '../../data/repo'
import { creditPayoff } from '../../domain/credit'
import { annuityPayment, type LoanKind } from '../../domain/loan-schedule'
import { formatNok, parseNok, parseRate } from '../../domain/money'
import { addMonths, formatMonthLong, todayIso, toYearMonth } from '../../domain/month'
import { validateLoanForm, type LoanForm as Form } from '../../domain/validate'
import { Field } from '../components/Field'

const KINDS: { kind: LoanKind; label: string; hint: string }[] = [
  { kind: 'annuitet', label: 'Annuitet', hint: 'Samme beløp hver termin. Vanligst for boliglån, billån og studielån.' },
  { kind: 'serie', label: 'Serie', hint: 'Fast avdrag, så terminbeløpet synker over tid.' },
  { kind: 'kreditt', label: 'Kreditt', hint: 'Kredittkort og rammekreditt. Ingen fast plan; appen regner ut når den er nedbetalt.' },
]

const empty = (): Form => ({
  kind: 'annuitet', name: '', lender: '', balance: '', date: todayIso(), rate: '', years: '', months: '0', fee: '', dueDay: '', creditLimit: '', monthlyPayment: '',
})

const kr = (ore: number) => formatNok(ore).replace(/,00(?=\s*kr)/, '')
const toField = (ore: number | null) => (ore === null ? '' : kr(ore).replace(/\s*kr$/, ''))

function preview(f: Form): { label: string; value: string } {
  const balance = parseNok(f.balance)
  const rate = parseRate(f.rate)
  if (f.kind === 'kreditt') {
    const pay = parseNok(f.monthlyPayment)
    const label = pay ? `Nedbetalt med ${formatNok(pay, { whole: true })}/mnd` : 'Nedbetalt'
    if (balance === null || rate === null || !pay) return { label, value: '–' }
    const r = creditPayoff(balance, rate, pay, addMonths(toYearMonth(f.date || todayIso()), 1))
    return { label, value: r.kind === 'never' ? 'Blir aldri nedbetalt med dette beløpet' : formatMonthLong(r.payoffMonth) }
  }
  const terms = (Number(f.years) || 0) * 12 + (Number(f.months) || 0)
  const fee = f.fee.trim() ? (parseNok(f.fee) ?? 0) : 0
  const label = f.kind === 'annuitet' ? 'Per termin, inkl. gebyr' : 'Første termin, inkl. gebyr'
  if (balance === null || rate === null || terms < 1) return { label, value: '–' }
  const first = f.kind === 'annuitet' ? annuityPayment(balance, rate, terms) : Math.round(balance / terms) + Math.round((balance * rate) / 120000)
  return { label, value: `ca. ${formatNok(first + fee, { whole: true })}` }
}

export function LoanForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const editing = Boolean(id)
  const [f, setF] = useState<Form>(empty)
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({})

  useEffect(() => {
    if (!id) return
    getLoanBundle(id).then(({ loan, rates }) => {
      setF({
        kind: loan.kind,
        name: loan.name,
        lender: loan.lender,
        balance: toField(loan.startBalance),
        date: loan.startDate,
        rate: String(rates[0].nominalRate / 100).replace('.', ','),
        years: loan.termMonths === null ? '' : String(Math.floor(loan.termMonths / 12)),
        months: loan.termMonths === null ? '0' : String(loan.termMonths % 12),
        fee: loan.feePerTerm ? toField(loan.feePerTerm) : '',
        dueDay: String(loan.dueDay),
        creditLimit: toField(loan.creditLimit),
        monthlyPayment: toField(loan.monthlyPayment),
      })
    })
  }, [id])

  const set = (key: keyof Form) => (v: string) => setF((prev) => ({ ...prev, [key]: v }))
  const pv = useMemo(() => preview(f), [f])
  const isCredit = f.kind === 'kreditt'
  const kindInfo = KINDS.find((k) => k.kind === f.kind)!

  async function onSave() {
    const result = validateLoanForm(f)
    if (!result.ok) {
      setErrors(result.errors)
      return
    }
    setErrors({})
    if (id) await updateLoan(id, result.loan)
    else await createLoan(result.loan, result.rate)
    navigate(id ? `/lan/${id}` : '/')
  }

  return (
    <>
      <div className="row" style={{ alignItems: 'center' }}>
        <Link className="back" to={id ? `/lan/${id}` : '/'}>
          Avbryt
        </Link>
      </div>
      <h1 className="h1">{editing ? 'Rediger lån' : 'Legg til gjeld'}</h1>

      {!editing && (
        <div className="field">
          <span className="label">Type</span>
          <div className="seg" role="group" aria-label="Type gjeld">
            {KINDS.map((k) => (
              <button key={k.kind} type="button" aria-pressed={f.kind === k.kind} onClick={() => set('kind')(k.kind)}>
                {k.label}
              </button>
            ))}
          </div>
          <span className="lbl" style={{ lineHeight: 1.45 }}>
            {kindInfo.hint}
          </span>
        </div>
      )}

      <div className="grid2">
        <Field id="name" label="Navn" value={f.name} onChange={set('name')} error={errors.name} />
        <Field id="lender" label="Bank" value={f.lender} onChange={set('lender')} error={errors.lender} />
      </div>
      <div className="grid2">
        <Field id="balance" label={isCredit ? 'Saldo' : 'Restgjeld'} value={f.balance} onChange={set('balance')} error={errors.balance} inputMode="decimal" />
        <Field id="date" label="Per dato" type="date" value={f.date} onChange={set('date')} error={errors.date} />
      </div>
      {editing ? (
        <p className="lbl" style={{ margin: 0 }}>
          Renten endrer du under Rentehistorikk på lånet.
        </p>
      ) : (
        <Field id="rate" label="Nominell rente (%)" value={f.rate} onChange={set('rate')} error={errors.rate} inputMode="decimal" />
      )}

      {!isCredit && (
        <>
          <div className="grid2">
            <Field id="years" label="År" value={f.years} onChange={set('years')} error={errors.years} inputMode="numeric" />
            <Field id="months" label="Måneder" value={f.months} onChange={set('months')} error={errors.months} inputMode="numeric" />
          </div>
          <span className="lbl" style={{ marginTop: -10 }}>
            Gjenværende løpetid
          </span>
          <div className="grid2">
            <Field id="fee" label="Termingebyr" value={f.fee} onChange={set('fee')} error={errors.fee} inputMode="decimal" placeholder="0" />
            <Field id="dueDay" label="Forfallsdag" value={f.dueDay} onChange={set('dueDay')} error={errors.dueDay} inputMode="numeric" />
          </div>
        </>
      )}

      {isCredit && (
        <>
          <div className="grid2">
            <Field id="creditLimit" label="Kredittgrense" value={f.creditLimit} onChange={set('creditLimit')} error={errors.creditLimit} inputMode="decimal" />
            <Field id="dueDay" label="Forfallsdag" value={f.dueDay} onChange={set('dueDay')} error={errors.dueDay} inputMode="numeric" />
          </div>
          <Field
            id="monthlyPayment"
            label="Jeg betaler per måned"
            value={f.monthlyPayment}
            onChange={set('monthlyPayment')}
            error={errors.monthlyPayment}
            inputMode="decimal"
          />
        </>
      )}

      <div className="info stack" data-testid="preview">
        <span className="lbl">{pv.label}</span>
        <span style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 600, color: 'var(--deep)' }}>{pv.value}</span>
      </div>

      <button className="btn" onClick={onSave}>
        Lagre
      </button>
    </>
  )
}
