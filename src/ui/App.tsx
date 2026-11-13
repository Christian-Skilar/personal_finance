import { HashRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './Layout'
import { LoanForm } from './screens/LoanForm'
import { Settings } from './screens/Settings'

function Todo({ title }: { title: string }) {
  return <h1 className="h1">{title}</h1>
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Todo title="Gjeld" />} />
        <Route path="/lan" element={<Todo title="Lån" />} />
        <Route path="/lan/ny" element={<LoanForm />} />
        <Route path="/lan/:id" element={<Todo title="Lån" />} />
        <Route path="/lan/:id/rediger" element={<LoanForm />} />
        <Route path="/lan/:id/hva-om" element={<Todo title="Hva om" />} />
        <Route path="/oppdater" element={<Todo title="Månedlig oppdatering" />} />
        <Route path="/planer" element={<Todo title="Plan for å bli gjeldfri" />} />
        <Route path="/innstillinger" element={<Settings />} />
      </Route>
    </Routes>
  )
}

export function App() {
  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  )
}
