import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { exportBackup } from '../../data/backup'
import { db } from '../../data/db'
import { createLoan } from '../../data/repo'
import { Settings } from './Settings'

const input = {
  kind: 'annuitet' as const, name: 'Boliglån', lender: 'DNB', startBalance: 245_000_000, startDate: '2026-11-13',
  termMonths: 264, feePerTerm: 5_000, dueDay: 15, creditLimit: null, monthlyPayment: null,
}

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()))
})

const renderIt = () => render(<MemoryRouter><Settings /></MemoryRouter>)

test('ugyldig fil viser feilmelding', async () => {
  renderIt()
  const file = new File(['{'], 'x.json', { type: 'application/json' })
  await userEvent.upload(screen.getByLabelText('Importer backup'), file)
  expect(await screen.findByText('Filen er ikke en backup fra denne appen')).toBeInTheDocument()
})

test('gyldig fil krever bekreftelse før import', async () => {
  await createLoan(input, 520)
  const text = JSON.stringify(await exportBackup())
  await Promise.all(db.tables.map((t) => t.clear()))
  renderIt()
  await userEvent.upload(screen.getByLabelText('Importer backup'), new File([text], 'b.json', { type: 'application/json' }))
  expect(await screen.findByText('Backupen inneholder 1 lån og 0 registreringer. Alt som ligger i appen nå blir erstattet.')).toBeInTheDocument()
  expect(await db.loans.count()).toBe(0)
  await userEvent.click(screen.getByRole('button', { name: 'Erstatt data' }))
  expect(await screen.findByText('Backupen er importert.')).toBeInTheDocument()
  expect(await db.loans.count()).toBe(1)
})
