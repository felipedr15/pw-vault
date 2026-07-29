import { useState } from 'react'
import type { VaultItem } from '../types'
import { guessIconUrl, getPasswordAge } from '../lib/utils'

type ItemDetailProps = {
  item: VaultItem
  onEdit: (item: VaultItem) => void
  onDelete: (id: string, title: string) => void
  onCopyUsername: () => void
  onCopyPassword: () => void
}

export function ItemDetail({ item, onEdit, onDelete, onCopyUsername, onCopyPassword }: ItemDetailProps) {
  const [showPassword, setShowPassword] = useState(false)
  const faviconUrl = guessIconUrl(item.title, item.website)
  const age = getPasswordAge(item.updatedAt)

  return (
    <div className="stack">
      <div className="item-title">
        {faviconUrl && (
          <img src={faviconUrl} alt="" width={24} height={24} className="favicon" onError={(e) => { e.currentTarget.style.display = 'none' }} />
        )}
        <h2 style={{ margin: 0 }}>{item.title}</h2>
      </div>
      <div className="detail-row">
        <span className="detail-label">Username</span>
        <span>{item.username}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Password</span>
        <span className="masked">{showPassword ? item.password : '••••••••••••'}</span>
      </div>
      {item.website && (
        <div className="detail-row">
          <span className="detail-label">Website</span>
          <a href={item.website.startsWith('http') ? item.website : `https://${item.website}`} target="_blank" rel="noreferrer">
            {item.website}
          </a>
        </div>
      )}
      {item.notes && (
        <div className="detail-row">
          <span className="detail-label">Notes</span>
          <span>{item.notes}</span>
        </div>
      )}
      {item.tags.length > 0 && (
        <div className="item-tags">
          {item.tags.map((tag) => <span key={tag} className="tag-label">{tag}</span>)}
        </div>
      )}
      {age > 180 && <p className="age-warning">Password not changed in {age} days</p>}
      <p className="updated">Updated {new Date(item.updatedAt).toLocaleString()}</p>
      <div className="inline">
        <button type="button" className="secondary" onClick={onCopyUsername}>Copy Username</button>
        <button type="button" className="secondary" onClick={onCopyPassword}>Copy Password</button>
        <button type="button" className="secondary" onClick={() => setShowPassword((v) => !v)}>
          {showPassword ? 'Hide' : 'Show'}
        </button>
      </div>
      <div className="inline">
        <button type="button" onClick={() => onEdit(item)}>Edit</button>
        <button type="button" className="danger" onClick={() => onDelete(item.id, item.title)}>Delete</button>
      </div>
    </div>
  )
}
