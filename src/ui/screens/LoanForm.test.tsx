import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { db } from '../../data/db'
import { sp } from '../../test/sp'
import { LoanForm } from './LoanForm'

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()))
})

function renderNew() {
  return render(
    <MemoryRouter initialEntries={['/lan/ny']}>
      <Routes>
        <Route path="/lan/ny" element={<LoanForm />} />
        <Route path="/" element={<p>hjem</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

async function fill(label: string, value: string) {
  const el = screen.getByLabelText(label)
  await userEvent.clear(el)
  if (value) await userEvent.type(el, value)
}

test('lagrer boliglånet og viser terminbeløp', async () => {
  renderNew()
  await fill('Navn', 'Boliglån')
  await fill('Bank', 'DNB')
  await fill('Restgjeld', '2 450 000')
  await fill('Nominell rente (%)', '5,20')
  await fill('År', '22')
  await fill('Måneder', '0')
  await fill('Termingebyr', '50')
  await fill('Forfallsdag', '15')
  expect(sp(screen.getByTestId('preview').textContent ?? '')).toContain('15 647 kr')
  await userEvent.click(screen.getByRole('button', { name: 'Lagre' }))
  expect(await screen.findByText('hjem')).toBeInTheDocument()
  const loans = await db.loans.toArray()
  expect(loans).toHaveLength(1)
  expect(loans[0]).toMatchObject({ name: 'Boliglån', startBalance: 245_000_000, termMonths: 264, feePerTerm: 5_000 })
})

test('viser feil og lagrer ikke ved ugyldige måneder', async () => {
  renderNew()
  await fill('Navn', 'Boliglån')
  await fill('Restgjeld', '2 450 000')
  await fill('Nominell rente (%)', '5,20')
  await fill('År', '22')
  await fill('Måneder', '14')
  await fill('Forfallsdag', '15')
  await userEvent.click(screen.getByRole('button', { name: 'Lagre' }))
  expect(await screen.findByText('Måneder må være mellom 0 og 11')).toBeInTheDocument()
  expect(screen.getByLabelText('Måneder')).toHaveAttribute('aria-invalid', 'true')
  expect(await db.loans.count()).toBe(0)
})

test('kreditt viser andre felter og nedbetalingstid', async () => {
  renderNew()
  await userEvent.click(screen.getByRole('button', { name: 'Kreditt' }))
  expect(screen.queryByLabelText('År')).not.toBeInTheDocument()
  await fill('Saldo', '24 300')
  await fill('Nominell rente (%)', '22,9')
  await fill('Jeg betaler per måned', '400')
  expect(screen.getByTestId('preview')).toHaveTextContent('Blir aldri nedbetalt med dette beløpet')
})
