import { HashRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './Layout'
import { LoanDetail } from './screens/LoanDetail'
import { LoanForm } from './screens/LoanForm'
import { MonthlyUpdate } from './screens/MonthlyUpdate'
import { PayoffPlan } from './screens/PayoffPlan'
import { WhatIf } from './screens/WhatIf'
import { LoanList, Overview } from './screens/Overview'
import { Settings } from './screens/Settings'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Overview />} />
        <Route path="/lan" element={<LoanList />} />
        <Route path="/lan/ny" element={<LoanForm />} />
        <Route path="/lan/:id" element={<LoanDetail />} />
        <Route path="/lan/:id/rediger" element={<LoanForm />} />
        <Route path="/lan/:id/hva-om" element={<WhatIf />} />
        <Route path="/oppdater" element={<MonthlyUpdate />} />
        <Route path="/planer" element={<PayoffPlan />} />
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
