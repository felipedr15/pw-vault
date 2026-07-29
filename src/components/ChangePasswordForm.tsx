import { useState } from 'react'
import type { FormEvent } from 'react'

type ChangePasswordFormProps = {
  onSubmit: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>
  onCancel: () => void
}

export function ChangePasswordForm({ onSubmit, onCancel }: ChangePasswordFormProps) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (newPassword.length < 10) {
      setError('New password must be at least 10 characters.')
      return
    }
    if (newPassword === currentPassword) {
      setError('New password must be different from the current one.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.')
      return
    }

    setLoading(true)
    const result = await onSubmit(currentPassword, newPassword)
    setLoading(false)

    if (!result.success) {
      setError(result.error ?? 'Failed to change password.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="stack">
      <h2>Change Master Password</h2>
      <p className="sync-note">
        This will re-encrypt your entire vault with the new password.
        Make sure you remember it — there is no recovery option.
      </p>
      <label>
        Current password
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
      </label>
      <label>
        New password
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
          required
        />
      </label>
      <label>
        Confirm new password
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          required
        />
      </label>
      {error && <p className="error">{error}</p>}
      <div className="inline">
        <button type="submit" disabled={loading}>
          {loading ? 'Encrypting…' : 'Change Password'}
        </button>
        <button type="button" className="secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}
