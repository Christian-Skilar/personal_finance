import { useState, type ChangeEvent } from 'react'
import { backupFileName, exportBackup, importBackup, parseBackup, type BackupFile } from '../../data/backup'
import { setSetting } from '../../data/repo'
import { todayIso } from '../../domain/month'

async function shareOrDownload(name: string, json: string): Promise<boolean> {
  const file = new File([json], name, { type: 'application/json' })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Backup av gjeld-appen' })
      return true
    } catch {
      return false // brukeren avbrøt delingen
    }
  }
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
  return true
}

export function Settings() {
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<BackupFile | null>(null)

  async function onExport() {
    setError(null)
    const json = JSON.stringify(await exportBackup(), null, 2)
    if (await shareOrDownload(backupFileName(todayIso()), json)) {
      await setSetting('lastBackupAt', new Date().toISOString())
      setMessage('Backupen er lagret.')
    }
  }

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    setMessage(null)
    setPending(null)
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const result = parseBackup(await file.text())
    if (!result.ok) {
      setError(result.error)
      return
    }
    setError(null)
    setPending(result.data)
  }

  async function onConfirm() {
    if (!pending) return
    await importBackup(pending)
    setPending(null)
    setMessage('Backupen er importert.')
  }

  return (
    <>
      <div className="stack">
        <span className="lbl">Innstillinger</span>
        <h1 className="h1">Backup</h1>
      </div>
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: 'var(--ink-2)' }}>
        Dataene ligger bare på denne telefonen. Ta backup jevnlig og lagre filen i Google Drive eller send den på e-post.
      </p>

      <div className="card">
        <h2 className="h2">Ta backup</h2>
        <button className="btn" onClick={onExport}>
          Eksporter backup
        </button>
      </div>

      <div className="card">
        <h2 className="h2">Gjenopprett</h2>
        <div className="field">
          <label htmlFor="import">Importer backup</label>
          <input id="import" type="file" accept="application/json,.json" onChange={onFile} />
        </div>
        {pending && (
          <div className="warnbox" role="status">
            <p style={{ margin: '0 0 10px' }}>
              Backupen inneholder {pending.loans.length} lån og {pending.monthlyEntries.length} registreringer. Alt som ligger i appen nå blir
              erstattet.
            </p>
            <div className="grid2">
              <button className="btn2" onClick={() => setPending(null)}>
                Avbryt
              </button>
              <button className="btn2" style={{ background: 'var(--warn)', color: '#fff', borderColor: 'var(--warn)' }} onClick={onConfirm}>
                Erstatt data
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="err" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="info" role="status">
          {message}
        </p>
      )}
    </>
  )
}
