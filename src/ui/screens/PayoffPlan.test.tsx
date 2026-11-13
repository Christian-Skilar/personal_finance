import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { db } from '../../data/db'
import { createLoan } from '../../data/repo'
import { todayIso } from '../../domain/month'
import { durationText } from '../format'
import { PayoffPlan } from './PayoffPlan'

const credit = (name: string, balance: number, payment: number) => ({
  kind: 'kreditt' as const, name, lender: '', startBalance: balance, startDate: todayIso(), termMonths: null, feePerTerm: 0, dueDay: 15, creditLimit: null, monthlyPayment: payment,
})

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()))
  await createLoan(credit('A-kort', 1_000_000, 100_000), 2000)
  await createLoan(credit('B-kreditt', 5_000_000, 100_000), 500)
  await createLoan(credit('C-kort', 300_000, 50_000), 1000)
})

test('skred og snøball gir ulik rekkefølge', async () => {
  render(<MemoryRouter><PayoffPlan /></MemoryRouter>)
  const order = await screen.findByRole('list', { name: 'Rekkefølge' })
  expect(within(order).getAllByRole('listitem')[0]).toHaveTextContent('A-kort')
  await userEvent.click(screen.getByRole('button', { name: 'Snøball' }))
  expect(within(screen.getByRole('list', { name: 'Rekkefølge' })).getAllByRole('listitem')[0]).toHaveTextContent('C-kort')
})

test('durationText', () => {
  expect(durationText(0)).toBe('0 mnd')
  expect(durationText(12)).toBe('1 år')
  expect(durationText(14)).toBe('1 år 2 mnd')
  expect(durationText(5)).toBe('5 mnd')
})
