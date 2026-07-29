import { useMemo, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import type { EntryFormData, ModalMode } from '../types'
import { generatePassword, getPasswordStrength } from '../lib/utils'
import { TAG_OPTIONS } from '../lib/constants'

type EntryFormProps = {
  mode: ModalMode
  initialData: EntryFormData
  onSave: (data: EntryFormData) => void
  onCancel: () => void
}

export function EntryForm({ mode, initialData, onSave, onCancel }: EntryFormProps) {
  const [form, setForm] = useState<EntryFormData>(initialData)
  const [showPassword, setShowPassword] = useState(false)
  const [customTagInput, setCustomTagInput] = useState('')

  const passwordStrength = useMemo(() => getPasswordStrength(form.password), [form.password])

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!form.title || !form.username || !form.password) return
    onSave(form)
  }

  const toggleTag = (tag: string) => {
    setForm((current) => ({
      ...current,
      tags: current.tags.includes(tag) ? current.tags.filter((t) => t !== tag) : [...current.tags, tag],
    }))
  }

  const addCustomTag = () => {
    const trimmed = customTagInput.trim()
    if (trimmed && !form.tags.includes(trimmed)) {
      setForm((current) => ({ ...current, tags: [...current.tags, trimmed] }))
    }
    setCustomTagInput('')
  }

  const handleCustomTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); addCustomTag() }
  }

  return (
    <form onSubmit={handleSubmit} className="stack">
      <h2>{mode === 'edit' ? 'Edit Entry' : 'Add Entry'}</h2>
      <label>
        Title
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Example: Gmail" required />
      </label>
      <label>
        Username
        <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} autoComplete="username" required />
      </label>
      <label>
        Password
        <div className="inline">
          <input
            type={showPassword ? 'text' : 'password'}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            autoComplete="new-password"
            required
          />
          <button type="button" className="secondary" onClick={() => setShowPassword((v) => !v)}>
            {showPassword ? 'Hide' : 'Show'}
          </button>
          <button type="button" className="secondary" onClick={() => setForm({ ...form, password: generatePassword(20) })}>
            Generate
          </button>
        </div>
      </label>
      <div className="strength">
        <div className={`strength-bar score-${passwordStrength.score}`} />
        <p>Strength: {passwordStrength.label}</p>
      </div>
      <label>
        Website
        <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://" />
      </label>
      <label>
        Notes
        <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
      </label>
      <div>
        <p className="tag-label-heading">Tags</p>
        <div className="tag-buttons">
          {TAG_OPTIONS.map((tag) => (
            <button
              key={tag}
              type="button"
              className={`tag-button ${form.tags.includes(tag) ? 'active' : ''}`}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
        <div className="custom-tag-input">
          <input
            value={customTagInput}
            onChange={(e) => setCustomTagInput(e.target.value)}
            onKeyDown={handleCustomTagKeyDown}
            placeholder="Custom tag…"
          />
          <button type="button" className="secondary" onClick={addCustomTag} disabled={!customTagInput.trim()}>
            Add
          </button>
        </div>
        {form.tags.filter((t) => !TAG_OPTIONS.includes(t)).length > 0 && (
          <div className="tag-buttons" style={{ marginTop: '0.4rem' }}>
            {form.tags.filter((t) => !TAG_OPTIONS.includes(t)).map((tag) => (
              <button key={tag} type="button" className="tag-button active" onClick={() => toggleTag(tag)}>
                {tag} ×
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="inline">
        <button type="submit">{mode === 'edit' ? 'Update' : 'Save'}</button>
        <button type="button" className="secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}
