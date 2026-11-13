import { useEffect, useState } from 'react'
import { getSetting, setSetting } from '../data/repo'

const DAY = 86_400_000

/** Ber om varig lagring og regner dager siden siste backup (eller første bruk). */
export function useStorageStatus(): { persisted: boolean | null; daysSinceBackup: number | null } {
  const [persisted, setPersisted] = useState<boolean | null>(null)
  const [daysSinceBackup, setDays] = useState<number | null>(null)

  useEffect(() => {
    let alive = true
    const storage = typeof navigator !== 'undefined' ? navigator.storage : undefined
    if (storage?.persist) {
      storage.persist().then((ok) => alive && setPersisted(ok), () => alive && setPersisted(false))
    }
    ;(async () => {
      let since = await getSetting<string>('lastBackupAt')
      if (!since) {
        since = await getSetting<string>('firstUseAt')
        if (!since) {
          since = new Date().toISOString()
          await setSetting('firstUseAt', since)
        }
      }
      if (alive) setDays(Math.floor((Date.now() - Date.parse(since)) / DAY))
    })()
    return () => {
      alive = false
    }
  }, [])

  return { persisted, daysSinceBackup }
}
