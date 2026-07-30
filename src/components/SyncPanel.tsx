import { useState } from 'react'
import type { FormEvent } from 'react'

type SyncPanelProps = {
  onSubmit: (url: string, username: string, password: string, isRegistering: boolean) => Promise<void>
  onCancel: () => void
  error: string
}

export function SyncPanel({ onSubmit, onCancel, error }: SyncPanelProps) {
  const [isRegistering, setIsRegistering] = useState(true)
  const [url, setUrl] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await onSubmit(url.trim().replace(/\/$/, ''), username, password, isRegistering)
  }

  return (
    <section className="card sync-panel">
      <form onSubmit={handleSubmit} className="stack">
        <h2>Cloud Sync Setup</h2>
        <p className="sync-note">Your vault is encrypted before it ever leaves your device.</p>
        <div className="inline">
          <button type="button" className={isRegistering ? '' : 'secondary'} onClick={() => setIsRegistering(true)}>New account</button>
          <button type="button" className={!isRegistering ? '' : 'secondary'} onClick={() => setIsRegistering(false)}>Existing account</button>
        </div>
        <label>
          Worker URL
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://api.mdlo.dev" required />
        </label>
        <label>
          Username
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
        </label>
        <label>
          Sync password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required />
        </label>
        {error && <p className="error">{error}</p>}
        <div className="inline">
          <button type="submit">{isRegistering ? 'Create & connect' : 'Connect'}</button>
          <button type="button" className="secondary" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </section>
  )
}
