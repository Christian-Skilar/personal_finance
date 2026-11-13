import { render, screen } from '@testing-library/react'
import { App } from './App'

test('viser overskriften Gjeld', () => {
  render(<App />)
  expect(screen.getByRole('heading', { name: 'Gjeld' })).toBeInTheDocument()
})
