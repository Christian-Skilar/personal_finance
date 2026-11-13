import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { db } from '../../data/db'
import { createLoan } from '../../data/repo'
import { todayIso } from '../../domain/month'
import { sp } from '../../test/sp'
import { LoanDetail } from './LoanDetail'
import { Overview } from './Overview'

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()))
})

async function seed() {
  const bolig = await createLoan(
    { kind: 'annuitet', name: 'Boliglån', lender: 'DNB', startBalance: 245_000_000, startDate: todayIso(), termMonths: 264, feePerTerm: 5_000, dueDay: 15, creditLimit: null, monthlyPayment: null },
    520,
  )
  await createLoan(
    { kind: 'kreditt', name: 'Kredittkort', lender: 'Bank Norwegian', startBalance: 2_430_000, startDate: todayIso(), termMonths: null, feePerTerm: 0, dueDay: 20, creditLimit: 5_000_000, monthlyPayment: 200_000 },
    2290,
  )
  return bolig
}

function renderApp(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/lan/:id" element={<LoanDetail />} />
      </Routes>
    </MemoryRouter>,
  )
}

test('tom oversikt', async () => {
  renderApp()
  expect(await screen.findByText('Ingen lån ennå')).toBeInTheDocument()
  expect(screen.getAllByRole('link', { name: 'Legg til lån' }).length).toBeGreaterThan(0)
})

test('oversikten summerer gjeld og merker høy rente', async () => {
  await seed()
  renderApp()
  const total = await screen.findByTestId('total')
  expect(sp(total.textContent ?? '')).toBe('2 474 300 kr')
  expect(sp(screen.getByTestId('monthly').textContent ?? '')).toBe('17 647 kr')
  const card = screen.getByRole('link', { name: /Kredittkort/ })
  expect(within(card).getByText('Høy rente')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /Boliglån/ })).toHaveAttribute('href', expect.stringMatching(/^\/lan\//))
})

test('lån-detaljen viser terminbeløp og plan', async () => {
  const id = await seed()
  renderApp(`/lan/${id}`)
  expect(await screen.findByRole('heading', { name: 'Boliglån' })).toBeInTheDocument()
  expect(sp(screen.getByTestId('per-term').textContent ?? '')).toBe('15 647 kr')
  const table = screen.getByRole('table')
  expect(within(table).getAllByRole('row')).toHaveLength(13) // overskrift + 12
  await userEvent.click(screen.getByRole('button', { name: 'Vis alle 264 terminer' }))
  expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(265)
})
