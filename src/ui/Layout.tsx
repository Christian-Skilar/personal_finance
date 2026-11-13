import { Link, Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { ErrorBoundary } from './ErrorBoundary'
import { WarnIcon } from './icons'
import { useStorageStatus } from './useStorageStatus'

export const BACKUP_REMINDER_DAYS = 30

export function Layout() {
  const { persisted, daysSinceBackup } = useStorageStatus()
  return (
    <div className="app">
      <main className="main">
        {persisted === false && (
          <div className="banner" role="status">
            <WarnIcon />
            <span>Telefonen kan slette dataene. Ta backup jevnlig.</span>
          </div>
        )}
        {daysSinceBackup !== null && daysSinceBackup > BACKUP_REMINDER_DAYS && (
          <div className="banner" role="status">
            <WarnIcon />
            <span>{daysSinceBackup} dager siden siste backup</span>
            <Link className="btn-sm" to="/innstillinger">
              Ta backup
            </Link>
          </div>
        )}
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      <BottomNav />
    </div>
  )
}
