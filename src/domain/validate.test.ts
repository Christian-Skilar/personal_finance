import { validateLoanForm, type LoanForm } from './validate'

const bolig: LoanForm = {
  kind: 'annuitet', name: 'Boliglån', lender: 'DNB', balance: '2 450 000', date: '2026-11-13', rate: '5,20',
  years: '22', months: '0', fee: '50', dueDay: '15', creditLimit: '', monthlyPayment: '',
}

test('gyldig boliglån', () => {
  const r = validateLoanForm(bolig)
  expect(r).toEqual({
    ok: true,
    rate: 520,
    loan: {
      kind: 'annuitet', name: 'Boliglån', lender: 'DNB', startBalance: 245_000_000, startDate: '2026-11-13',
      termMonths: 264, feePerTerm: 5_000, dueDay: 15, creditLimit: null, monthlyPayment: null,
    },
  })
})

test('tomt gebyr blir 0', () => {
  const r = validateLoanForm({ ...bolig, fee: '' })
  expect(r.ok && r.loan.feePerTerm).toBe(0)
})

const errorsOf = (f: LoanForm) => {
  const r = validateLoanForm(f)
  if (r.ok) throw new Error('forventet feil')
  return r.errors
}

test('feilmeldinger på norsk', () => {
  expect(errorsOf({ ...bolig, name: '  ' }).name).toBe('Skriv inn et navn')
  expect(errorsOf({ ...bolig, balance: 'abc' }).balance).toBe('Skriv et gyldig beløp, f.eks. 2 450 000')
  expect(errorsOf({ ...bolig, rate: '150' }).rate).toBe('Renten må være mellom 0 og 100 %')
  expect(errorsOf({ ...bolig, months: '14' }).months).toBe('Måneder må være mellom 0 og 11')
  expect(errorsOf({ ...bolig, years: '0', months: '0' }).years).toBe('Løpetiden må være minst 1 måned')
  expect(errorsOf({ ...bolig, dueDay: '32' }).dueDay).toBe('Forfallsdag må være mellom 1 og 31')
  expect(errorsOf({ ...bolig, date: '' }).date).toBe('Velg en dato')
  expect(errorsOf({ ...bolig, fee: 'x' }).fee).toBe('Skriv et gyldig beløp, f.eks. 2 450 000')
})

test('kreditt krever månedlig innbetaling og ignorerer løpetid', () => {
  const credit: LoanForm = { ...bolig, kind: 'kreditt', name: 'Kredittkort', balance: '24 300', rate: '22,9', years: '', months: '', fee: '', creditLimit: '50 000', monthlyPayment: '' }
  expect(errorsOf(credit).monthlyPayment).toBe('Skriv hvor mye du betaler per måned')
  const r = validateLoanForm({ ...credit, monthlyPayment: '2 000' })
  expect(r).toMatchObject({ ok: true, rate: 2290, loan: { termMonths: null, feePerTerm: 0, creditLimit: 5_000_000, monthlyPayment: 200_000 } })
})
