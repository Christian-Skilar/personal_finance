import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { db } from '../data/db'
import { setSetting } from '../data/repo'
import { ErrorBoundary } from './ErrorBoundary'
import { Layout } from './Layout'

function mockPersist(result: boolean) {
  Object.defineProperty(navigator, 'storage', {
    configurable: true,
    value: { persist: () => Promise.resolve(result), persisted: () => Promise.resolve(result) },
  })
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<p>innhold</p>} />
          <Route path="/oppdater" element={<p>oppdater</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()))
  mockPersist(true)
})

test('bunnmenyen har fire lenker og markerer aktiv side', async () => {
  renderAt('/oppdater')
  const nav = screen.getByRole('navigation', { name: 'Hovedmeny' })
  const links = ['Oversikt', 'Lån', 'Oppdater', 'Planer'].map((name) => screen.getByRole('link', { name }))
  links.forEach((l) => expect(nav).toContainElement(l))
  expect(screen.getByRole('link', { name: 'Oppdater' })).toHaveAttribute('aria-current', 'page')
  expect(screen.getByRole('link', { name: 'Oversikt' })).not.toHaveAttribute('aria-current')
})

test('advarer når telefonen ikke gir varig lagring', async () => {
  mockPersist(false)
  renderAt('/')
  expect(await screen.findByText('Telefonen kan slette dataene. Ta backup jevnlig.')).toBeInTheDocument()
})

test('minner om backup etter mer enn 30 dager', async () => {
  const old = new Date(Date.now() - 34 * 86_400_000).toISOString()
  await setSetting('lastBackupAt', old)
  renderAt('/')
  expect(await screen.findByText('34 dager siden siste backup')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Ta backup' })).toHaveAttribute('href', '/innstillinger')
})

test('ingen backup-påminnelse når backup er ny', async () => {
  await setSetting('lastBackupAt', new Date().toISOString())
  renderAt('/')
  await screen.findByText('innhold')
  expect(screen.queryByText(/siden siste backup/)).not.toBeInTheDocument()
})

test('feilgrense viser melding i stedet for å krasje', () => {
  const Boom = () => {
    throw new Error('boom')
  }
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
  render(
    <ErrorBoundary>
      <Boom />
    </ErrorBoundary>,
  )
  expect(screen.getByText('Noe gikk galt')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Last inn på nytt' })).toBeInTheDocument()
  spy.mockRestore()
})
