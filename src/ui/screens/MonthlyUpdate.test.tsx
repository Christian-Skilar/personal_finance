import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { db } from '../../data/db'
import { createLoan } from '../../data/repo'
import { buildSchedule } from '../../domain/loan-schedule'
import { formatNok } from '../../domain/money'
import { sp } from '../../test/sp'
import { MonthlyUpdate } from './MonthlyUpdate'

const input = {
  kind: 'annuitet' as const, name: 'Billån', lender: 'Santander', startBalance: 18_600_000, startDate: '2026-10-13',
  termMonths: 48, feePerTerm: 9_500, dueDay: 15, creditLimit: null, monthlyPayment: null,
}
const rates = [{ validFrom: '2026-10-13', nominalRate: 790 }]
const novBalance = buildSchedule({ ...input, kind: 'annuitet', termMonths: 48, rates })[0].balance

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-11-20T12:00:00'))
  await Promise.all(db.tables.map((t) => t.clear()))
})
afterEach(() => vi.useRealTimers())

function renderIt() {
  return render(
    <MemoryRouter initialEntries={['/oppdater']}>
      <Routes>
        <Route path="/oppdater" element={<MonthlyUpdate />} />
        <Route path="/" element={<p>hjem</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

test('forhåndsutfyller planens saldo, varsler avvik og lagrer', async () => {
  const id = await createLoan(input, 790)
  renderIt()
  expect(await screen.findByRole('heading', { name: 'November 2026' })).toBeInTheDocument()
  const field = screen.getByLabelText('Restgjeld') as HTMLInputElement
  expect(sp(field.value)).toBe(sp(formatNok(novBalance).replace(/,00\s*kr$/, '').replace(/\s*kr$/, '')))
  const higher = Math.round((novBalance * 1.1) / 100)
  await userEvent.clear(field)
  await userEvent.type(field, String(higher))
  expect(screen.getByText(/% høyere enn planen/)).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Lagre november' }))
  expect(await screen.findByText('hjem')).toBeInTheDocument()
  const entries = await db.monthlyEntries.toArray()
  expect(entries).toEqual([expect.objectContaining({ loanId: id, month: '2026-11', actualBalance: higher * 100, actualInterest: null })])
})

test('ugyldig beløp lagres ikke', async () => {
  await createLoan(input, 790)
  renderIt()
  const field = await screen.findByLabelText('Restgjeld')
  await userEvent.clear(field)
  await userEvent.type(field, 'abc')
  await userEvent.click(screen.getByRole('button', { name: 'Lagre november' }))
  expect(screen.getByText('Skriv et gyldig beløp, f.eks. 2 450 000')).toBeInTheDocument()
  expect(await db.monthlyEntries.count()).toBe(0)
})
