import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Theme } from '../hooks/useTheme'

type LockScreenProps = {
  hasVault: boolean
  theme: Theme
  toggleTheme: () => void
  webauthnAvailable: boolean
  onCreateVault: (password: string) => Promise<void>
  onUnlock: (password: string) => Promise<void>
  onUnlockBiometric: () => Promise<void>
  error: string
}

export function LockScreen({
  hasVault,
  theme,
  toggleTheme,
  webauthnAvailable,
  onCreateVault,
  onUnlock,
  onUnlockBiometric,
  error,
}: LockScreenProps) {
  const [masterPassword, setMasterPassword] = useState('')
  const [setupPassword, setSetupPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [localError, setLocalError] = useState('')

  const displayError = error || localError

  const handleCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (setupPassword.length < 10) {
      setLocalError('Use at least 10 characters for your master password.')
      return
    }
    if (setupPassword !== confirmPassword) {
      setLocalError('Passwords do not match.')
      return
    }
    setLocalError('')
    await onCreateVault(setupPassword)
  }

  const handleUnlock = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLocalError('')
    await onUnlock(masterPassword)
  }

  return (
    <div className="lock-screen">
      <div className="card lock-card">
        <div className="lock-brand">
          <div className="lock-brand-icon">🔐</div>
          <h1>Password Vault</h1>
          <p>End-to-end encrypted. Local-first. Your passwords, your control.</p>
        </div>
        <button type="button" className="theme-toggle" onClick={toggleTheme} style={{ marginBottom: '1rem' }}>
          <span className="theme-toggle-icon">{theme === 'dark' ? '☀️' : '🌙'}</span>
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
        {!hasVault ? (
          <form onSubmit={handleCreate} className="stack">
            <h2>Create your vault</h2>
            <label>
              Master password
              <input type="password" value={setupPassword} onChange={(e) => setSetupPassword(e.target.value)} autoComplete="new-password" required />
            </label>
            <label>
              Confirm password
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" required />
            </label>
            <button type="submit">Create Vault</button>
          </form>
        ) : (
          <form onSubmit={handleUnlock} className="stack">
            <h2>Unlock vault</h2>
            <label>
              Master password
              <input type="password" value={masterPassword} onChange={(e) => setMasterPassword(e.target.value)} autoComplete="current-password" required />
            </label>
            <button type="submit">Unlock</button>
            {webauthnAvailable && (
              <button type="button" className="secondary" onClick={onUnlockBiometric}>
                Unlock with Biometric
              </button>
            )}
          </form>
        )}
        {displayError && <p className="error">{displayError}</p>}
      </div>
    </div>
  )
}
