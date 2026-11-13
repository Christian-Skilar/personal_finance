import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { db } from '../../data/db'
import { createLoan } from '../../data/repo'
import { todayIso } from '../../domain/month'
import { sp } from '../../test/sp'
import { WhatIf } from './WhatIf'

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()))
})

test('viser besparelse for valgt ekstra beløp', async () => {
  const id = await createLoan(
    { kind: 'annuitet', name: 'Testlån', lender: '', startBalance: 10_000_000, startDate: todayIso(), termMonths: 12, feePerTerm: 0, dueDay: 15, creditLimit: null, monthlyPayment: null },
    1200,
  )
  render(
    <MemoryRouter initialEntries={[`/lan/${id}/hva-om`]}>
      <Routes>
        <Route path="/lan/:id/hva-om" element={<WhatIf />} />
      </Routes>
    </MemoryRouter>,
  )
  await userEvent.click(await screen.findByRole('button', { name: '1 000' }))
  expect(sp(screen.getByTestId('saved-interest').textContent ?? '')).toBe('ca. 655 kr')
  expect(screen.getByTestId('saved-time')).toHaveTextContent('1 mnd')
})
